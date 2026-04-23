import { useEffect, useMemo, useState } from "react";

import { createIncident, getTrace, listBudgets, listIncidents, subscribeIncidentEvents } from "./api";
import { BudgetBoard } from "./components/BudgetBoard";
import { DecisionTrace } from "./components/DecisionTrace";
import { IncidentFeed } from "./components/IncidentFeed";
import { IncidentForm } from "./components/IncidentForm";
import type { BudgetSnapshot, DecisionTraceEntry, IncidentCreateInput, IncidentSummary } from "./types";

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [budgets, setBudgets] = useState<BudgetSnapshot[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [trace, setTrace] = useState<DecisionTraceEntry[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const shellClass = useMemo(
    () => `${highContrast ? "contrast" : ""} min-h-screen px-4 py-6 md:px-10 md:py-8`,
    [highContrast]
  );

  useEffect(() => {
    void refreshIncidents();
    void refreshBudgets();

    const unsubscribe = subscribeIncidentEvents(() => {
      void refreshIncidents();
      void refreshBudgets();
      if (selectedIncidentId) {
        void loadTrace(selectedIncidentId);
      }
    });

    return unsubscribe;
  }, [selectedIncidentId]);

  async function refreshIncidents() {
    const data = await listIncidents();
    setIncidents(data);
  }

  async function refreshBudgets() {
    const data = await listBudgets();
    setBudgets(data);
  }

  async function loadTrace(incidentId: string) {
    const data = await getTrace(incidentId);
    setTrace(data);
  }

  async function submitIncident(payload: IncidentCreateInput) {
    setSubmitting(true);
    try {
      const state = await createIncident(payload);
      const incident = state.incident as { incident_id?: string } | undefined;
      const incidentId = incident?.incident_id;
      await refreshIncidents();
      await refreshBudgets();
      if (incidentId) {
        setSelectedIncidentId(incidentId);
        await loadTrace(incidentId);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={shellClass}>
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-300/20 bg-black/10 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">GridGuard Control Plane</h1>
          <p className="mt-2 max-w-2xl text-sm opacity-85">
            Agentic municipal hazard resolution with cyclic reasoning, autonomous fund reallocation, and resilient contractor fallback.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode((value) => !value)}
            className="rounded-xl border border-slate-300/40 px-3 py-2 text-sm font-semibold"
          >
            {darkMode ? "Light" : "Dark"} Mode
          </button>
          <button
            onClick={() => setHighContrast((value) => !value)}
            className="rounded-xl border border-slate-300/40 px-3 py-2 text-sm font-semibold"
          >
            {highContrast ? "Standard" : "High Contrast"}
          </button>
        </div>
      </header>

      <main className="grid gap-4 xl:grid-cols-[340px_1fr_1fr]">
        <div className="space-y-4">
          <IncidentForm submitting={submitting} onSubmit={submitIncident} />
          <BudgetBoard budgets={budgets} />
        </div>

        <IncidentFeed
          incidents={incidents}
          selectedIncidentId={selectedIncidentId}
          onSelect={(incidentId) => {
            setSelectedIncidentId(incidentId);
            void loadTrace(incidentId);
          }}
        />

        <DecisionTrace trace={trace} />
      </main>
    </div>
  );
}
