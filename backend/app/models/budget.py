from pydantic import BaseModel, Field

from app.core.enums import HazardCategory


class BudgetState(BaseModel):
    category: HazardCategory
    allocated_budget: float = Field(ge=0)
    remaining_budget: float = Field(ge=0)
    required_amount: float = Field(ge=0)
    is_sufficient: bool


class BudgetCategorySnapshot(BaseModel):
    category: str
    allocated_budget: float
    remaining_budget: float
