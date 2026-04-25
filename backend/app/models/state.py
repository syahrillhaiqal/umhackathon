from typing import Any

from pydantic import BaseModel, Field
from typing_extensions import NotRequired, TypedDict

from app.core.enums import HazardCategory, ReasoningDecisionType, ResolutionStatus, RiskLevel
from app.models.budget import BudgetState
from app.models.contractor import Contractor, ContractorAttempt
from app.models.incident import Incident
from app.models.vision_output import VisionOutput


class ToolAction(BaseModel):
    tool: str
    params: dict[str, Any] = Field(default_factory=dict)


class ReasoningDecision(BaseModel):
    decision: ReasoningDecisionType
    reason: str
    action: ToolAction


class ToolCallRecord(BaseModel):
    tool: str
    params: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)


class DecisionTraceItem(BaseModel):
    node: str
    summary: str
    decision: str | None = None


class WorkflowState(BaseModel):
    incident: Incident
    hazard_category: HazardCategory | None = None
    risk_level: RiskLevel | None = None
    required_amount: float | None = None
    budget_state: BudgetState | None = None
    reasoning_output: ReasoningDecision | None = None
    decision_trace: list[DecisionTraceItem] = Field(default_factory=list)
    tool_calls: list[ToolCallRecord] = Field(default_factory=list)
    contractor_attempts: list[ContractorAttempt] = Field(default_factory=list)
    candidate_contractors: list[Contractor] = Field(default_factory=list)
    selected_contractor: Contractor | None = None
    resolution_status: ResolutionStatus = ResolutionStatus.PENDING
    escalation_reason: str | None = None


class WorkflowGraphState(TypedDict):
    incident: Incident
    image_url: NotRequired[str]
    vision_output: NotRequired[VisionOutput]
    hazard_category: NotRequired[HazardCategory]
    risk_level: NotRequired[RiskLevel]
    required_amount: NotRequired[float]
    budget_state: NotRequired[BudgetState]
    reasoning_output: NotRequired[ReasoningDecision]
    decision_trace: list[DecisionTraceItem]
    tool_calls: list[ToolCallRecord]
    contractor_attempts: list[ContractorAttempt]
    candidate_contractors: list[Contractor]
    selected_contractor: NotRequired[Contractor | None]
    resolution_status: ResolutionStatus
    escalation_reason: NotRequired[str | None]


def build_initial_state(incident: Incident) -> WorkflowGraphState:
    return {
        "incident": incident,
        "image_url": incident.image_url,
        "decision_trace": [],
        "tool_calls": [],
        "contractor_attempts": [],
        "candidate_contractors": [],
        "selected_contractor": None,
        "resolution_status": ResolutionStatus.PENDING,
        "escalation_reason": None,
    }
