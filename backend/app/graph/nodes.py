from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from app.core.config import Settings
from app.core.enums import HazardCategory, ReasoningDecisionType, ResolutionStatus, RiskLevel
from app.db.duckdb_client import BudgetRepository
from app.db.postgres_audit import AuditRepository
from app.graph.llm import GLMDecisionEngine
from app.models.contractor import ContractorAttempt
from app.models.state import DecisionTraceItem, ToolCallRecord, WorkflowGraphState
from app.services.event_broker import EventBroker
from app.tools.budget_tools import check_budget, execute_fund_transfer
from app.tools.contractor_tools import find_contractors


class WorkflowNodes:
    def __init__(
        self,
        settings: Settings,
        budget_repo: BudgetRepository,
        audit_repo: AuditRepository,
        event_broker: EventBroker,
    ) -> None:
        self._settings = settings
        self._budget_repo = budget_repo
        self._audit_repo = audit_repo
        self._event_broker = event_broker
        self._decision_engine = GLMDecisionEngine(settings)

    async def triage_node(self, state: WorkflowGraphState) -> WorkflowGraphState:
        incident = state["incident"]
        text = f"{incident.title} {incident.description}".lower()

        category = self._classify_hazard(text)
        risk_level = self._classify_risk(text)

        state["hazard_category"] = category
        state["risk_level"] = risk_level
        state["resolution_status"] = ResolutionStatus.IN_PROGRESS

        summary = f"Incident triaged as {category.value} with {risk_level.value} risk."
        state["decision_trace"].append(DecisionTraceItem(node="Triage", summary=summary))
        await self._record_event(state, "Triage", summary, None)
        return state

    async def financial_check_node(self, state: WorkflowGraphState) -> WorkflowGraphState:
        risk_level = state["risk_level"]
        category = state["hazard_category"]
        required_amount = self._required_amount_for_risk(risk_level)

        budget_state = check_budget(self._budget_repo, category, required_amount)

        state["required_amount"] = required_amount
        state["budget_state"] = budget_state
        state["tool_calls"].append(
            ToolCallRecord(
                tool="check_budget",
                params={"category": category.value, "required_amount": required_amount},
                result=budget_state.model_dump(mode="json"),
            )
        )

        summary = (
            f"Budget check completed for {category.value}. Remaining={budget_state.remaining_budget:.2f}, "
            f"Required={required_amount:.2f}."
        )
        state["decision_trace"].append(DecisionTraceItem(node="Financial_Check", summary=summary))
        await self._record_event(state, "Financial_Check", summary, None)
        return state

    async def reasoning_node(self, state: WorkflowGraphState) -> WorkflowGraphState:
        category = state["hazard_category"]
        risk_level = state["risk_level"]
        budget_state = state["budget_state"]

        contingency = next(
            item for item in self._budget_repo.list_budgets() if item["category"] == self._settings.contingency_fund_source
        )

        decision = await self._decision_engine.decide(
            {
                "hazard_category": category.value,
                "risk_level": risk_level.value,
                "remaining_budget": budget_state.remaining_budget,
                "required_amount": budget_state.required_amount,
                "transfer_available": float(contingency["remaining_budget"]) >= self._settings.fund_transfer_increment,
                "transfer_amount": self._settings.fund_transfer_increment,
                "contingency_source": self._settings.contingency_fund_source,
            }
        )
        state["reasoning_output"] = decision
        state["decision_trace"].append(
            DecisionTraceItem(node="Reasoning", summary=decision.reason, decision=decision.decision.value)
        )

        if decision.decision == ReasoningDecisionType.TRANSFER_FUNDS:
            transferred = execute_fund_transfer(
                self._budget_repo,
                amount=float(decision.action.params.get("amount", self._settings.fund_transfer_increment)),
                source=str(decision.action.params.get("source", self._settings.contingency_fund_source)),
                target=category,
            )
            state["tool_calls"].append(
                ToolCallRecord(
                    tool="execute_fund_transfer",
                    params=decision.action.params,
                    result={"success": transferred},
                )
            )
            if not transferred:
                state["resolution_status"] = ResolutionStatus.HUMAN_ESCALATION
                state["escalation_reason"] = "Contingency transfer failed"
                state["reasoning_output"].decision = ReasoningDecisionType.ESCALATE
                state["reasoning_output"].reason = "Contingency transfer failed. Escalate to supervisor."

        if state["reasoning_output"].decision == ReasoningDecisionType.ESCALATE:
            state["resolution_status"] = ResolutionStatus.HUMAN_ESCALATION
            state["escalation_reason"] = state["reasoning_output"].reason

        await self._record_event(
            state,
            "Reasoning",
            state["reasoning_output"].reason,
            state["reasoning_output"].decision.value,
        )
        return state

    async def logistics_dispatch_node(self, state: WorkflowGraphState) -> WorkflowGraphState:
        if state["resolution_status"] == ResolutionStatus.HUMAN_ESCALATION:
            await self._record_event(
                state,
                "Logistics_Dispatch",
                "Skipped dispatch due to escalation state.",
                "ESCALATE",
            )
            return state

        category = state["hazard_category"]
        location = state["incident"].location
        candidates = find_contractors(category, location)
        state["candidate_contractors"] = candidates

        selected = None
        for candidate in candidates[: self._settings.contractor_retry_limit]:
            if candidate.available:
                selected = candidate
                break
            state["contractor_attempts"].append(
                ContractorAttempt(
                    contractor_id=candidate.contractor_id,
                    available=False,
                    reason="Contractor unavailable. Retrying next closest provider.",
                )
            )

        state["tool_calls"].append(
            ToolCallRecord(
                tool="find_contractors",
                params={"category": category.value, "location": location},
                result={"count": len(candidates)},
            )
        )

        if selected:
            state["selected_contractor"] = selected
            state["resolution_status"] = ResolutionStatus.RESOLVED
            summary = f"Dispatched contractor {selected.name} ({selected.contractor_id})."
            decision = "CONTINUE"
        else:
            state["resolution_status"] = ResolutionStatus.HUMAN_ESCALATION
            state["escalation_reason"] = "No available contractor after fallback retries."
            summary = "No contractor available after retry loop. Escalated to human supervisor."
            decision = "ESCALATE"

        state["decision_trace"].append(DecisionTraceItem(node="Logistics_Dispatch", summary=summary, decision=decision))
        await self._record_event(state, "Logistics_Dispatch", summary, decision)
        return state

    @staticmethod
    def _required_amount_for_risk(risk_level: RiskLevel) -> float:
        if risk_level == RiskLevel.CRITICAL:
            return 50000.0
        if risk_level == RiskLevel.HIGH:
            return 25000.0
        if risk_level == RiskLevel.MEDIUM:
            return 12000.0
        return 5000.0

    @staticmethod
    def _classify_hazard(text: str) -> HazardCategory:
        if any(token in text for token in ["blackout", "power", "electric", "voltage", "substation"]):
            return HazardCategory.UTILITY_POWER
        if any(token in text for token in ["leak", "sewage", "drain", "flood", "pipe"]):
            return HazardCategory.WATER_SEWAGE
        if any(token in text for token in ["tree", "branch", "overgrown", "vegetation", "fallen trunk"]):
            return HazardCategory.VEGETATION
        if any(token in text for token in ["streetlight", "lamp", "lighting", "dark street", "light pole"]):
            return HazardCategory.LIGHTING
        return HazardCategory.ROAD_PAVEMENT

    @staticmethod
    def _classify_risk(text: str) -> RiskLevel:
        if any(token in text for token in ["fatal", "explosion", "electrocution", "major collapse", "critical"]):
            return RiskLevel.CRITICAL
        if any(token in text for token in ["injury", "high risk", "danger", "blocked", "accident"]):
            return RiskLevel.HIGH
        if any(token in text for token in ["moderate", "slow traffic", "recurring"]):
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    async def _record_event(self, state: WorkflowGraphState, node: str, summary: str, decision: str | None) -> None:
        payload = self._serialize_state(state)
        incident_id = state["incident"].incident_id
        await self._audit_repo.record(
            incident_id=incident_id,
            node_name=node,
            summary=summary,
            decision=decision,
            payload=payload,
        )
        await self._event_broker.publish(
            {
                "incident_id": incident_id,
                "node": node,
                "summary": summary,
                "decision": decision,
                "state": payload,
            }
        )

    def _serialize_state(self, state: WorkflowGraphState) -> dict[str, Any]:
        def _normalize(value: Any) -> Any:
            if isinstance(value, BaseModel):
                return value.model_dump(mode="json")
            if isinstance(value, list):
                return [_normalize(item) for item in value]
            if hasattr(value, "value"):
                return value.value
            if isinstance(value, dict):
                return {key: _normalize(item) for key, item in value.items()}
            return value

        return {key: _normalize(value) for key, value in state.items()}
