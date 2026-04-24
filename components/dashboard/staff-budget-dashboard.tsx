"use client";

import { useMemo, useState } from "react";
import { IncidentReport, getBudgetOverview, getIncidentReports, updateBudgetStatus } from "@/lib/report-store";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function StaffBudgetDashboard() {
  const [reports, setReports] = useState<IncidentReport[]>(() => getIncidentReports());

  const overview = useMemo(() => getBudgetOverview(reports), [reports]);

  const approveBudget = (reportId: string) => {
    const nextReports = updateBudgetStatus(reportId, "Approved");
    setReports([...nextReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  return (
    <section className="animate-rise-in space-y-6 rounded-2xl border border-[#2b3f5a] bg-[#131f31] p-5 shadow-[0_16px_38px_rgba(4,12,26,0.35)] md:p-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#e6effa]">Staff Budget Allocation Board</h2>
        <p className="mt-2 text-sm text-[#9fb1c9]">
          Review AI suggested allocations and approve budget release for verified field response.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-[#334b6b] bg-[#1a2b41] p-4">
          <p className="text-xs text-[#8ca7cb] uppercase">Total Budget</p>
          <p className="mt-2 text-xl font-semibold text-[#ecf3fb]">{formatCurrency(overview.total)}</p>
        </div>
        <div className="rounded-xl border border-[#334b6b] bg-[#1a2b41] p-4">
          <p className="text-xs text-[#8ca7cb] uppercase">AI Proposed</p>
          <p className="mt-2 text-xl font-semibold text-[#ecf3fb]">{formatCurrency(overview.aiProposed)}</p>
        </div>
        <div className="rounded-xl border border-[#334b6b] bg-[#1a2b41] p-4">
          <p className="text-xs text-[#8ca7cb] uppercase">Approved</p>
          <p className="mt-2 text-xl font-semibold text-[#ecf3fb]">{formatCurrency(overview.approved)}</p>
        </div>
        <div className="rounded-xl border border-[#334b6b] bg-[#1a2b41] p-4">
          <p className="text-xs text-[#8ca7cb] uppercase">Remaining</p>
          <p className="mt-2 text-xl font-semibold text-[#ecf3fb]">{formatCurrency(overview.remaining)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#334b6b] bg-[#121d2d]">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#334b6b] bg-[#17253a] text-left text-[#8ea9cd]">
            <tr>
              <th className="px-4 py-3 font-medium">Incident</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">AI Budget</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-[#273a56] text-[#d6e2f3]">
                <td className="px-4 py-3">
                  <p className="font-medium">{report.id}</p>
                  <p className="text-xs text-[#8fa7c8]">{report.locationText}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-[#406086] bg-[#223754] px-2.5 py-1 text-xs font-semibold">
                    {report.triage.level}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(report.aiSuggestedBudget)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      report.budgetStatus === "Approved"
                        ? "bg-[#1f4f42] text-[#a6f2d5]"
                        : "bg-[#4d3a1a] text-[#ffd892]"
                    }`}
                  >
                    {report.budgetStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {report.budgetStatus === "Approved" ? (
                    <span className="text-xs text-[#8ea6c7]">Approved by staff</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => approveBudget(report.id)}
                      className="rounded-lg border border-[#3e5b83] bg-[#28466b] px-3 py-1.5 text-xs font-semibold text-[#dce9fa] transition hover:bg-[#32547f]"
                    >
                      Approve Allocation
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
