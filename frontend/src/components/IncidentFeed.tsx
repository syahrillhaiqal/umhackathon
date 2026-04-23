import type { IncidentSummary } from "../types";
import { StatusBadge } from "./StatusBadge";

interface IncidentFeedProps {
  incidents: IncidentSummary[];
  selectedIncidentId: string | null;
  onSelect: (incidentId: string) => void;
}

export function IncidentFeed({ incidents, selectedIncidentId, onSelect }: IncidentFeedProps) {
  return (
    <section className="panel rounded-2xl p-5">
      <h2 className="font-display text-lg font-semibold">Incident Feed</h2>
      <div className="mt-3 max-h-130 space-y-3 overflow-auto pr-1">
        {incidents.map((incident) => (
          <button
            key={incident.incident_id}
            type="button"
            onClick={() => onSelect(incident.incident_id)}
            className={`w-full rounded-xl border p-3 text-left transition ${
              selectedIncidentId === incident.incident_id
                ? "border-accent/60 bg-accent/10"
                : "border-slate-300/30 hover:border-accent/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{incident.title}</h3>
              <StatusBadge status={incident.status} />
            </div>
            <p className="mt-2 text-sm opacity-90">{incident.location}</p>
            <p className="mt-2 text-xs uppercase tracking-wide opacity-75">
              {incident.hazard_category ?? "UNCLASSIFIED"} · {incident.risk_level ?? "UNKNOWN"}
            </p>
          </button>
        ))}
        {incidents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-400/40 p-4 text-sm opacity-80">
            No incidents yet. Submit one to start the autonomous reasoning cycle.
          </p>
        ) : null}
      </div>
    </section>
  );
}
