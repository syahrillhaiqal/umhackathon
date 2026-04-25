from __future__ import annotations

import json
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, ValidationError

from app.core.config import Settings
from app.core.enums import ReasoningDecisionType, RiskLevel
from app.models.state import ReasoningDecision, ToolAction
from app.graph.prompts import SYSTEM_PROMPT


class LLMDecisionEnvelope(BaseModel):
    summary: str
    decision: ReasoningDecisionType
    next_action: dict[str, Any] = Field(default_factory=dict)


class IlmuDecisionEngine:
    """Decision engine using Ilmu YTL AI Labs API.
    
    Uses Ilmu multimodal model for structured reasoning about
    budget transfers, contractor dispatch, and escalation decisions.
    Falls back to deterministic logic if API unavailable.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: ChatOpenAI | None = None
        if settings.ilmu_api_key:
            self._client = ChatOpenAI(
                api_key=settings.ilmu_api_key,
                base_url=settings.ilmu_base_url,
                model=settings.ilmu_model,
                temperature=0,
            )

    async def decide(self, payload: dict[str, Any]) -> ReasoningDecision:
        envelope = await self._llm_decide(payload)
        return ReasoningDecision(
            decision=envelope.decision,
            reason=envelope.summary,
            action=ToolAction(
                tool=str(envelope.next_action.get("tool", "noop")),
                params=dict(envelope.next_action.get("params", {})),
            ),
        )

    async def _llm_decide(self, payload: dict[str, Any]) -> LLMDecisionEnvelope:
        if self._client is None:
            return self._deterministic_decision(payload)

        try:
            response = await self._client.ainvoke(
                [
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=json.dumps(payload, ensure_ascii=True)),
                ]
            )
            content = response.content if isinstance(response.content, str) else json.dumps(response.content)
            parsed = self._extract_json(content)
            return LLMDecisionEnvelope.model_validate(parsed)
        except (ValidationError, json.JSONDecodeError, KeyError, TypeError, ValueError):
            return self._deterministic_decision(payload)

    def _deterministic_decision(self, payload: dict[str, Any]) -> LLMDecisionEnvelope:
        risk_level = RiskLevel(payload["risk_level"])
        remaining_budget = float(payload["remaining_budget"])
        required_amount = float(payload["required_amount"])
        transfer_available = bool(payload.get("transfer_available", False))

        if remaining_budget <= 0 and risk_level in {RiskLevel.HIGH, RiskLevel.CRITICAL} and transfer_available:
            return LLMDecisionEnvelope(
                summary="High-risk incident with zero budget. Transfer funds from contingency.",
                decision=ReasoningDecisionType.TRANSFER_FUNDS,
                next_action={
                    "tool": "execute_fund_transfer",
                    "params": {
                        "source": payload["contingency_source"],
                        "target": payload["hazard_category"],
                        "amount": payload["transfer_amount"],
                    },
                },
            )

        if remaining_budget >= required_amount:
            return LLMDecisionEnvelope(
                summary="Budget is sufficient. Proceed to contractor dispatch.",
                decision=ReasoningDecisionType.CONTINUE,
                next_action={"tool": "find_contractors", "params": {}},
            )

        return LLMDecisionEnvelope(
            summary="No viable financial path remains. Escalate to human supervisor.",
            decision=ReasoningDecisionType.ESCALATE,
            next_action={"tool": "escalate", "params": {"target": "HUMAN_SUPERVISOR"}},
        )

    @staticmethod
    def _extract_json(content: str) -> dict[str, Any]:
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(cleaned)
