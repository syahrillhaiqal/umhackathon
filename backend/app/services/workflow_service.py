from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.redis import AsyncRedisSaver
from pydantic import BaseModel

from app.core.config import settings
from app.db.duckdb_client import BudgetRepository
from app.db.postgres_audit import AuditRepository
from app.graph.builder import WorkflowGraph
from app.graph.nodes import WorkflowNodes
from app.models.incident import Incident, IncidentCreate
from app.models.state import build_initial_state
from app.services.event_broker import EventBroker
from app.tools.budget_tools import list_budget_snapshots


class WorkflowService:
    def __init__(self) -> None:
        self._budget_repo = BudgetRepository(settings.duckdb_path)
        self._audit_repo = AuditRepository(settings.postgres_dsn)
        self._event_broker = EventBroker()
        self._workflow_graph: WorkflowGraph | None = None
        self._checkpointer_cm: AsyncIterator[AsyncRedisSaver] | None = None

    async def initialize(self) -> None:
        self._budget_repo.initialize()
        await self._audit_repo.initialize()
        nodes = WorkflowNodes(
            settings=settings,
            budget_repo=self._budget_repo,
            audit_repo=self._audit_repo,
            event_broker=self._event_broker,
        )
        checkpointer: Any
        try:
            self._checkpointer_cm = AsyncRedisSaver.from_conn_string(settings.redis_url)
            checkpointer = await self._checkpointer_cm.__aenter__()
        except Exception as exc:
            # Redis Stack commands (FT.*) may be unavailable on plain Redis.
            # Fall back to in-memory checkpointing to keep incident flow running.
            print(f"[workflow] Redis checkpoint unavailable; falling back to MemorySaver: {exc}")
            self._checkpointer_cm = None
            checkpointer = MemorySaver()

        self._workflow_graph = WorkflowGraph(nodes=nodes, checkpointer=checkpointer)

    async def shutdown(self) -> None:
        if self._workflow_graph is not None:
            self._workflow_graph = None
        if self._checkpointer_cm is not None:
            await self._checkpointer_cm.__aexit__(None, None, None)
        self._checkpointer_cm = None

    async def process_incident(self, payload: IncidentCreate) -> dict[str, Any]:
        incident = Incident(**payload.model_dump())
        initial_state = build_initial_state(incident)
        config = {"configurable": {"thread_id": incident.incident_id}}
        if self._workflow_graph is None:
            raise RuntimeError("Workflow graph is not initialized")
        final_state = await self._workflow_graph.graph.ainvoke(initial_state, config=config)
        return self._normalize(final_state)

    async def resume_incident(self, incident_id: str) -> dict[str, Any]:
        config = {"configurable": {"thread_id": incident_id}}
        if self._workflow_graph is None:
            raise RuntimeError("Workflow graph is not initialized")
        snapshot = await self._workflow_graph.graph.aget_state(config)
        if snapshot is None or not snapshot.values:
            raise ValueError("No checkpointed state found for this incident")
        final_state = await self._workflow_graph.graph.ainvoke(snapshot.values, config=config)
        return self._normalize(final_state)

    async def list_incidents(self) -> list[dict[str, Any]]:
        return await self._audit_repo.list_latest_incidents()

    async def get_trace(self, incident_id: str) -> list[dict[str, Any]]:
        return await self._audit_repo.list_incident_trace(incident_id)

    async def list_budgets(self) -> list[dict[str, float | str]]:
        return list_budget_snapshots(self._budget_repo)

    async def stream_events(self) -> AsyncIterator[dict[str, str]]:
        async with self._event_broker.subscribe() as queue:
            while True:
                event = await queue.get()
                yield {"event": "incident_update", "data": json.dumps(event)}

    def _normalize(self, value: Any) -> Any:
        if isinstance(value, BaseModel):
            return value.model_dump(mode="json")
        if isinstance(value, list):
            return [self._normalize(item) for item in value]
        if isinstance(value, dict):
            return {key: self._normalize(item) for key, item in value.items()}
        if hasattr(value, "value"):
            return value.value
        return value
