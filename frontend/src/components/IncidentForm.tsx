import { useState } from "react";

import type { IncidentCreateInput } from "../types";

interface IncidentFormProps {
  submitting: boolean;
  onSubmit: (payload: IncidentCreateInput) => Promise<void>;
}

export function IncidentForm({ submitting, onSubmit }: IncidentFormProps) {
  const [form, setForm] = useState<IncidentCreateInput>({
    title: "",
    description: "",
    location: "",
    media_url: "",
  });

  return (
    <form
      className="panel rounded-2xl p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(form);
        setForm({ title: "", description: "", location: "", media_url: "" });
      }}
    >
      <h2 className="font-display text-lg font-semibold">Create Incident</h2>
      <div className="mt-4 grid gap-3">
        <input
          className="rounded-xl border border-slate-300/40 bg-transparent px-3 py-2"
          placeholder="Issue title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
        <textarea
          className="min-h-24 rounded-xl border border-slate-300/40 bg-transparent px-3 py-2"
          placeholder="Detailed incident description"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-slate-300/40 bg-transparent px-3 py-2"
          placeholder="Location"
          value={form.location}
          onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-slate-300/40 bg-transparent px-3 py-2"
          placeholder="Media URL (optional)"
          value={form.media_url}
          onChange={(event) => setForm((prev) => ({ ...prev, media_url: event.target.value }))}
        />
        <button
          disabled={submitting}
          className="rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          type="submit"
        >
          {submitting ? "Submitting..." : "Dispatch AI Resolution"}
        </button>
      </div>
    </form>
  );
}
