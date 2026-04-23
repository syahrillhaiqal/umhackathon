from pydantic import BaseModel, Field

from app.core.enums import HazardCategory


class Contractor(BaseModel):
    contractor_id: str
    name: str
    category: HazardCategory
    distance_km: float = Field(ge=0)
    available: bool
    eta_minutes: int = Field(ge=1)
    hourly_rate: float = Field(ge=0)


class ContractorAttempt(BaseModel):
    contractor_id: str
    available: bool
    reason: str
