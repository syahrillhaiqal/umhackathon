import type { ResolutionStatus } from "../types";

const statusStyles: Record<ResolutionStatus, string> = {
  PENDING: "bg-slate-400/20 text-slate-700 dark:text-slate-100",
  IN_PROGRESS: "bg-amber-500/20 text-warning",
  RESOLVED: "bg-emerald-500/20 text-success",
  HUMAN_ESCALATION: "bg-rose-500/20 text-danger",
  FAILED: "bg-red-700/20 text-danger",
};

interface StatusBadgeProps {
  status: ResolutionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${statusStyles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}
