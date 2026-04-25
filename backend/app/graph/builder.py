from __future__ import annotations

from typing import Literal

from langgraph.graph import END, START, StateGraph

from app.core.enums import ReasoningDecisionType, ResolutionStatus
from app.graph.nodes import WorkflowNodes
from app.models.state import WorkflowGraphState


def _route_from_reasoning(state: WorkflowGraphState) -> Literal["financial_check", "logistics_dispatch", "end"]:
    if state.get("resolution_status") in {
        ResolutionStatus.AWAITING_ADMIN_APPROVAL,
        ResolutionStatus.HUMAN_ESCALATION,
    }:
        return "end"

    reasoning = state.get("reasoning_output")
    if reasoning is None:
        return "end"
    if reasoning.decision == ReasoningDecisionType.TRANSFER_FUNDS:
        return "financial_check"
    if reasoning.decision == ReasoningDecisionType.CONTINUE:
        return "logistics_dispatch"
    return "end"


def _route_from_logistics(state: WorkflowGraphState) -> Literal["end"]:
    if state["resolution_status"] in {ResolutionStatus.RESOLVED, ResolutionStatus.HUMAN_ESCALATION}:
        return "end"
    return "end"


class WorkflowGraph:
    def __init__(self, nodes: WorkflowNodes, checkpointer=None) -> None:
        self._nodes = nodes
        self._checkpointer = checkpointer
        self._graph = self._build()

    def _build(self):
        graph_builder = StateGraph(WorkflowGraphState)
        graph_builder.add_node("vision_preprocessing", self._nodes.vision_preprocessing_node)
        graph_builder.add_node("triage", self._nodes.triage_node)
        graph_builder.add_node("financial_check", self._nodes.financial_check_node)
        graph_builder.add_node("reasoning", self._nodes.reasoning_node)
        graph_builder.add_node("logistics_dispatch", self._nodes.logistics_dispatch_node)

        graph_builder.add_edge(START, "vision_preprocessing")
        graph_builder.add_edge("vision_preprocessing", "triage")
        graph_builder.add_edge("triage", "financial_check")
        graph_builder.add_edge("financial_check", "reasoning")
        graph_builder.add_conditional_edges(
            "reasoning",
            _route_from_reasoning,
            {
                "financial_check": "financial_check",
                "logistics_dispatch": "logistics_dispatch",
                "end": END,
            },
        )
        graph_builder.add_conditional_edges("logistics_dispatch", _route_from_logistics, {"end": END})

        return graph_builder.compile(checkpointer=self._checkpointer)

    @property
    def graph(self):
        return self._graph
