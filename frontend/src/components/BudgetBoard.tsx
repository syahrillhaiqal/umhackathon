import type { BudgetSnapshot } from "../types";

const hazardOrder = [
  "ROAD_PAVEMENT",
  "UTILITY_POWER",
  "WATER_SEWAGE",
  "VEGETATION",
  "LIGHTING",
];

interface BudgetBoardProps {
  budgets: BudgetSnapshot[];
}

export function BudgetBoard({ budgets }: BudgetBoardProps) {
  const ordered = budgets.filter((budget) => hazardOrder.includes(budget.category));

  return (
    <section className="panel rounded-2xl p-5">
      <h2 className="font-display text-lg font-semibold">Budget Telemetry</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {ordered.map((budget) => {
          const utilization = budget.allocated_budget
            ? Math.max(0, Math.min(100, (budget.remaining_budget / budget.allocated_budget) * 100))
            : 0;
          return (
            <article key={budget.category} className="rounded-xl border border-slate-300/30 p-3">
              <p className="text-xs uppercase tracking-wide opacity-70">{budget.category}</p>
              <p className="mt-2 text-xl font-bold">RM {budget.remaining_budget.toLocaleString()}</p>
              <p className="mt-1 text-xs opacity-70">Allocated RM {budget.allocated_budget.toLocaleString()}</p>
              <div className="mt-3 h-2 rounded-full bg-black/10">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${utilization}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
