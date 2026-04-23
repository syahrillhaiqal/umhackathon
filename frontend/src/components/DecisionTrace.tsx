import type { DecisionTraceEntry } from "../types";

interface DecisionTraceProps {
  trace: DecisionTraceEntry[];
}

export function DecisionTrace({ trace }: DecisionTraceProps) {
  return (
    <section className="panel rounded-2xl p-5">
      <h2 className="font-display text-lg font-semibold">Decision Trace</h2>
      <div className="mt-3 max-h-130 space-y-3 overflow-auto pr-1">
        {trace.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-slate-300/25 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{entry.node_name}</p>
              <span className="text-xs uppercase tracking-wide opacity-70">
                {new Date(entry.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-2 text-sm">{entry.summary}</p>
            <div className="mt-2 text-xs uppercase tracking-wide opacity-75">
              decision: {entry.decision ?? "N/A"}
            </div>
            <pre className="mt-3 overflow-auto rounded-lg bg-black/15 p-2 text-xs">
              {JSON.stringify(entry.payload.tool_calls ?? [], null, 2)}
            </pre>
          </article>
        ))}
        {trace.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-400/40 p-4 text-sm opacity-80">
            Select an incident to inspect summary, decision path, and tool calls.
          </p>
        ) : null}
      </div>
    </section>
  );
}
