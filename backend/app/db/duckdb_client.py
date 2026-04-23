from __future__ import annotations

from pathlib import Path
from threading import Lock

import duckdb

from app.core.enums import HazardCategory


class BudgetRepository:
    def __init__(self, db_path: str) -> None:
        self._path = Path(db_path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        self._conn = duckdb.connect(str(self._path))

    def initialize(self) -> None:
        with self._lock:
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS municipal_budgets (
                    category TEXT PRIMARY KEY,
                    allocated_budget DOUBLE NOT NULL,
                    remaining_budget DOUBLE NOT NULL
                )
                """
            )
            count = self._conn.execute("SELECT COUNT(*) FROM municipal_budgets").fetchone()[0]
            if count == 0:
                seed_rows = [
                    (HazardCategory.ROAD_PAVEMENT.value, 120000.0, 25000.0),
                    (HazardCategory.UTILITY_POWER.value, 180000.0, 90000.0),
                    (HazardCategory.WATER_SEWAGE.value, 210000.0, 40000.0),
                    (HazardCategory.VEGETATION.value, 70000.0, 15000.0),
                    (HazardCategory.LIGHTING.value, 95000.0, 18000.0),
                    ("Safety_Contingency", 500000.0, 300000.0),
                ]
                self._conn.executemany(
                    "INSERT INTO municipal_budgets(category, allocated_budget, remaining_budget) VALUES (?, ?, ?)",
                    seed_rows,
                )

    def get_budget(self, category: HazardCategory) -> dict[str, float | str]:
        row = self._conn.execute(
            "SELECT category, allocated_budget, remaining_budget FROM municipal_budgets WHERE category = ?",
            [category.value],
        ).fetchone()
        if not row:
            raise ValueError(f"Budget category not found: {category.value}")
        return {
            "category": row[0],
            "allocated_budget": float(row[1]),
            "remaining_budget": float(row[2]),
        }

    def transfer(self, amount: float, source: str, target: str) -> bool:
        with self._lock:
            source_row = self._conn.execute(
                "SELECT remaining_budget FROM municipal_budgets WHERE category = ?",
                [source],
            ).fetchone()
            target_row = self._conn.execute(
                "SELECT remaining_budget FROM municipal_budgets WHERE category = ?",
                [target],
            ).fetchone()
            if not source_row or not target_row:
                return False
            if float(source_row[0]) < amount:
                return False

            self._conn.execute("BEGIN TRANSACTION")
            try:
                self._conn.execute(
                    "UPDATE municipal_budgets SET remaining_budget = remaining_budget - ? WHERE category = ?",
                    [amount, source],
                )
                self._conn.execute(
                    "UPDATE municipal_budgets SET remaining_budget = remaining_budget + ? WHERE category = ?",
                    [amount, target],
                )
                self._conn.execute("COMMIT")
            except Exception:
                self._conn.execute("ROLLBACK")
                raise
        return True

    def list_budgets(self) -> list[dict[str, float | str]]:
        rows = self._conn.execute(
            "SELECT category, allocated_budget, remaining_budget FROM municipal_budgets ORDER BY category"
        ).fetchall()
        return [
            {
                "category": row[0],
                "allocated_budget": float(row[1]),
                "remaining_budget": float(row[2]),
            }
            for row in rows
        ]
