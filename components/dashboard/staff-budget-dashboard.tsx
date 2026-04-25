"use client";

import { useEffect, useMemo, useState } from "react";

interface PendingIncident {
  incident_id: string;
  title: string;
  location: string;
  status: string;
  risk_level: string | null;
  hazard_category: string | null;
  updated_at: string;
}

interface IncidentRecord {
  incident_id: string;
  title: string;
  location: string;
  status: string;
  risk_level: string | null;
  hazard_category: string | null;
  updated_at: string;
}

interface TraceEntry {
  id: string;
  node_name: string;
  summary: string;
  decision: string | null;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function StaffBudgetDashboard() {
  const [pendingIncidents, setPendingIncidents] = useState<PendingIncident[]>([]);
  const [pastIncidents, setPastIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [traceEntries, setTraceEntries] = useState<TraceEntry[]>([]);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false);
  const [loadingPastReports, setLoadingPastReports] = useState<boolean>(false);
  const [loadingTrace, setLoadingTrace] = useState<boolean>(false);
  const [actingIncidentId, setActingIncidentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const selectedIncident = useMemo(
    () =>
      pendingIncidents.find((incident) => incident.incident_id === selectedIncidentId) ??
      pastIncidents.find((incident) => incident.incident_id === selectedIncidentId) ??
      null,
    [pastIncidents, pendingIncidents, selectedIncidentId],
  );

  const queueCount = pendingIncidents.length;
  const pastReportCount = pastIncidents.length;

  useEffect(() => {
    void refreshDashboardData();
  }, []);

  async function refreshDashboardData() {
    await Promise.all([refreshPendingQueue(), refreshPastReports()]);
  }

  async function parseErrorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { detail?: string };
      return body.detail || "Request failed.";
    } catch {
      return "Request failed.";
    }
  }

  async function refreshPendingQueue() {
    setLoadingQueue(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents/pending-approval`);
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const incidents = (await response.json()) as PendingIncident[];
      setPendingIncidents(incidents);

      if (incidents.length === 0) {
        return;
      }

      const nextSelectedId = incidents.some((incident) => incident.incident_id === selectedIncidentId)
        ? selectedIncidentId
        : incidents[0].incident_id;

      setSelectedIncidentId(nextSelectedId);
      if (nextSelectedId) {
        await loadTrace(nextSelectedId);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load pending approvals.");
    } finally {
      setLoadingQueue(false);
    }
  }

  async function refreshPastReports() {
    setLoadingPastReports(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents`);
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const incidents = (await response.json()) as IncidentRecord[];
      setPastIncidents(incidents);

      if (!selectedIncidentId && incidents.length > 0) {
        const firstIncidentId = incidents[0].incident_id;
        setSelectedIncidentId(firstIncidentId);
        await loadTrace(firstIncidentId);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load past reports.");
    } finally {
      setLoadingPastReports(false);
    }
  }

  async function loadTrace(incidentId: string) {
    setLoadingTrace(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/trace`);
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      const entries = (await response.json()) as TraceEntry[];
      setTraceEntries(entries);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load incident trace.");
    } finally {
      setLoadingTrace(false);
    }
  }

  async function runAdminAction(incidentId: string, action: "approve" | "reject") {
    setActingIncidentId(incidentId);
    setErrorMessage("");

    try {
      const reviewer = "staff-dashboard";
      const note =
        action === "reject"
          ? window.prompt("Reason for rejection (optional):", "Needs manual review") || "Needs manual review"
          : "Approved by staff dashboard";

      const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewer,
          note,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }

      await refreshDashboardData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Admin action failed.");
    } finally {
      setActingIncidentId(null);
    }
  }

  return (
    <section className="animate-rise-in space-y-6 rounded-2xl border border-[#2b3f5a] bg-[#131f31] p-5 shadow-[0_16px_38px_rgba(4,12,26,0.35)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#e6effa]">Admin Workflow Approval Board</h2>
          <p className="mt-2 text-sm text-[#9fb1c9]">
            Monitor AI guardrail stops, inspect decision traces, and approve or reject auto-actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void refreshDashboardData();
          }}
          className="rounded-lg border border-[#3e5b83] bg-[#1e3550] px-3 py-1.5 text-xs font-semibold text-[#dce9fa] transition hover:bg-[#28466b]"
        >
          {loadingQueue || loadingPastReports ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[#334b6b] bg-[#1a2b41] p-4">
          <p className="text-xs text-[#8ca7cb] uppercase">Pending Approvals</p>
          <p className="mt-2 text-xl font-semibold text-[#ecf3fb]">{queueCount}</p>
        </div>
        <div className="rounded-xl border border-[#334b6b] bg-[#1a2b41] p-4">
          <p className="text-xs text-[#8ca7cb] uppercase">Selected Incident</p>
          <p className="mt-2 truncate text-sm font-semibold text-[#ecf3fb]">{selectedIncident?.incident_id || "None"}</p>
        </div>
        <div className="rounded-xl border border-[#334b6b] bg-[#1a2b41] p-4">
          <p className="text-xs text-[#8ca7cb] uppercase">Past Reports</p>
          <p className="mt-2 text-xl font-semibold text-[#ecf3fb]">{pastReportCount}</p>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-[#6b4e64] bg-[#2a1c2a] px-3 py-2 text-xs text-[#efbfd8]">{errorMessage}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-[#334b6b] bg-[#121d2d]">
            <div className="border-b border-[#334b6b] bg-[#17253a] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#dce9fa]">Pending Approval Queue</h3>
              <p className="mt-1 text-xs text-[#8fa7c8]">Approve or reject incidents blocked by guardrails.</p>
            </div>
            <table className="min-w-full text-sm">
              <thead className="border-b border-[#334b6b] bg-[#17253a] text-left text-[#8ea9cd]">
                <tr>
                  <th className="px-4 py-3 font-medium">Incident</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Hazard</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingIncidents.map((incident) => (
                  <tr
                    key={incident.incident_id}
                    className={`border-b border-[#273a56] text-[#d6e2f3] ${
                      incident.incident_id === selectedIncidentId ? "bg-[#1b2c45]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIncidentId(incident.incident_id);
                          void loadTrace(incident.incident_id);
                        }}
                        className="text-left"
                      >
                        <p className="font-medium">{incident.incident_id}</p>
                        <p className="text-xs text-[#8fa7c8]">{incident.title}</p>
                        <p className="text-xs text-[#8fa7c8]">{incident.location}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3">{incident.risk_level || "N/A"}</td>
                    <td className="px-4 py-3">{incident.hazard_category || "N/A"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actingIncidentId === incident.incident_id}
                          onClick={() => {
                            void runAdminAction(incident.incident_id, "approve");
                          }}
                          className="rounded-lg border border-[#3a5a4d] bg-[#1f4f42] px-2 py-1 text-xs font-semibold text-[#a6f2d5] transition hover:bg-[#2a6b59] disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={actingIncidentId === incident.incident_id}
                          onClick={() => {
                            void runAdminAction(incident.incident_id, "reject");
                          }}
                          className="rounded-lg border border-[#6b4e64] bg-[#3b2436] px-2 py-1 text-xs font-semibold text-[#efbfd8] transition hover:bg-[#52304b] disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-xs text-[#8fa7c8]">
                      No incidents are currently waiting for admin approval.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#334b6b] bg-[#121d2d]">
            <div className="border-b border-[#334b6b] bg-[#17253a] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#dce9fa]">Past Incident Reports</h3>
              <p className="mt-1 text-xs text-[#8fa7c8]">Review previously submitted incidents and inspect full trace history.</p>
            </div>
            <table className="min-w-full text-sm">
              <thead className="border-b border-[#334b6b] bg-[#17253a] text-left text-[#8ea9cd]">
                <tr>
                  <th className="px-4 py-3 font-medium">Incident</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {pastIncidents.map((incident) => (
                  <tr
                    key={incident.incident_id}
                    className={`border-b border-[#273a56] text-[#d6e2f3] ${
                      incident.incident_id === selectedIncidentId ? "bg-[#1b2c45]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIncidentId(incident.incident_id);
                          void loadTrace(incident.incident_id);
                        }}
                        className="text-left"
                      >
                        <p className="font-medium">{incident.incident_id}</p>
                        <p className="text-xs text-[#8fa7c8]">{incident.title}</p>
                        <p className="text-xs text-[#8fa7c8]">{incident.location}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs">{incident.status}</td>
                    <td className="px-4 py-3 text-xs text-[#9fb1c9]">{new Date(incident.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
                {pastIncidents.length === 0 && !loadingPastReports ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-xs text-[#8fa7c8]">
                      No past reports found yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-xl border border-[#334b6b] bg-[#121d2d] p-4">
          <h3 className="text-sm font-semibold text-[#dce9fa]">Decision Trace</h3>
          <p className="mt-1 text-xs text-[#8fa7c8]">
            {selectedIncident ? `Incident ${selectedIncident.incident_id}` : "Select an incident to inspect trace."}
          </p>

          <div className="mt-3 max-h-112 space-y-2 overflow-auto pr-1">
            {loadingTrace ? <p className="text-xs text-[#8fa7c8]">Loading trace...</p> : null}

            {!loadingTrace && traceEntries.length === 0 ? (
              <p className="text-xs text-[#8fa7c8]">No trace entries found for this incident.</p>
            ) : null}

            {traceEntries.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-[#273a56] bg-[#17253a] p-3 text-xs text-[#d6e2f3]">
                <p className="font-semibold text-[#e6effa]">{entry.node_name}</p>
                <p className="mt-1">{entry.summary}</p>
                <p className="mt-1 text-[#9fb1c9]">Decision: {entry.decision || "N/A"}</p>
                <p className="mt-1 text-[#9fb1c9]">{new Date(entry.created_at).toLocaleString()}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
