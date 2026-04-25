from app.core.enums import HazardCategory
from app.db.duckdb_client import BudgetRepository
from app.models.budget import BudgetState


def check_budget(
    budget_repo: BudgetRepository,
    category: HazardCategory,
    required_amount: float = 0.0,
) -> BudgetState:
    row = budget_repo.get_budget(category)
    remaining_budget = float(row["remaining_budget"])
    return BudgetState(
        category=category,
        allocated_budget=float(row["allocated_budget"]),
        remaining_budget=remaining_budget,
        required_amount=required_amount,
        is_sufficient=remaining_budget >= required_amount,
    )


def execute_fund_transfer(
    budget_repo: BudgetRepository,
    amount: float,
    source: str,
    target: HazardCategory,
) -> bool:
    return budget_repo.transfer(amount=amount, source=source, target=target.value)


def list_budget_snapshots(budget_repo: BudgetRepository) -> list[dict[str, float | str]]:
    return budget_repo.list_budgets()
