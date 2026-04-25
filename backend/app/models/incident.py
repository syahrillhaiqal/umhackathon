from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field

from app.core.enums import ResolutionStatus


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=10, max_length=2000)
    location: str = Field(min_length=3, max_length=180)
    image_url: str | None = Field(default=None, description="Image URL or base64-encoded image")
    media_url: str | None = None


class Incident(IncidentCreate):
    incident_id: str = Field(default_factory=lambda: str(uuid4()))
    reported_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: ResolutionStatus = ResolutionStatus.PENDING
