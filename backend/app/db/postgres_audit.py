from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import DateTime, String, Text, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class DecisionAuditLog(Base):
    __tablename__ = "decision_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    incident_id: Mapped[str] = mapped_column(String(64), index=True)
    node_name: Mapped[str] = mapped_column(String(64), index=True)
    summary: Mapped[str] = mapped_column(Text())
    decision: Mapped[str | None] = mapped_column(String(32), nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AuditRepository:
    def __init__(self, dsn: str) -> None:
        self._engine = create_async_engine(dsn, pool_pre_ping=True)
        self._session_factory = async_sessionmaker(self._engine, expire_on_commit=False, class_=AsyncSession)

    async def initialize(self) -> None:
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def record(
        self,
        incident_id: str,
        node_name: str,
        summary: str,
        decision: str | None,
        payload: dict[str, Any],
    ) -> None:
        async with self._session_factory() as session:
            session.add(
                DecisionAuditLog(
                    incident_id=incident_id,
                    node_name=node_name,
                    summary=summary,
                    decision=decision,
                    payload=payload,
                )
            )
            await session.commit()

    async def list_incident_trace(self, incident_id: str) -> list[dict[str, Any]]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(DecisionAuditLog)
                .where(DecisionAuditLog.incident_id == incident_id)
                .order_by(DecisionAuditLog.created_at.asc())
            )
            rows = result.scalars().all()
            return [
                {
                    "id": row.id,
                    "incident_id": row.incident_id,
                    "node_name": row.node_name,
                    "summary": row.summary,
                    "decision": row.decision,
                    "payload": row.payload,
                    "created_at": row.created_at.isoformat(),
                }
                for row in rows
            ]

    async def list_latest_incidents(self, limit: int = 50) -> list[dict[str, Any]]:
        async with self._session_factory() as session:
            result = await session.execute(
                select(DecisionAuditLog)
                .order_by(DecisionAuditLog.created_at.desc())
                .limit(limit)
            )
            rows = result.scalars().all()
            latest: dict[str, dict[str, Any]] = {}
            for row in rows:
                if row.incident_id in latest:
                    continue
                incident_payload = row.payload.get("incident", {})
                latest[row.incident_id] = {
                    "incident_id": row.incident_id,
                    "title": incident_payload.get("title", "Unknown incident"),
                    "location": incident_payload.get("location", "Unknown"),
                    "status": row.payload.get("resolution_status", "PENDING"),
                    "risk_level": row.payload.get("risk_level"),
                    "hazard_category": row.payload.get("hazard_category"),
                    "updated_at": row.created_at.isoformat(),
                }
            return list(latest.values())
