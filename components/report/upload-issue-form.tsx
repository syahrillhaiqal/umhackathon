"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { IncidentCoordinates, IncidentMapPicker } from "@/components/maps/incident-map-picker";
import { generateDummyTriage, TriageResult } from "@/lib/ai-triage";
import { addIncidentReport } from "@/lib/report-store";

const levelStyles: Record<TriageResult["level"], string> = {
  Emergency: "border-[#7c4f58] bg-[#3a2530] text-[#f2c3cf]",
  "High Risk": "border-[#6e5f46] bg-[#342d22] text-[#f4d5a3]",
  Monitor: "border-[#486964] bg-[#213632] text-[#b4e5d6]",
};

interface UploadState {
  description: string;
  imageFile: File | null;
}

export function UploadIssueForm() {
  const [form, setForm] = useState<UploadState>({
    description: "",
    imageFile: null,
  });
  const [coordinates, setCoordinates] = useState<IncidentCoordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [savedIncidentId, setSavedIncidentId] = useState<string>("");

  const canSubmit = useMemo(() => Boolean(form.description.trim() && coordinates), [coordinates, form.description]);

  const imageLabel = form.imageFile ? form.imageFile.name : "Click to upload issue photo";

  const onImageChange = (file: File | null) => {
    setForm((prev) => ({ ...prev, imageFile: file }));
    setResult(null);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!coordinates) {
      return;
    }

    const locationForAi = locationLabel || `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;

    const triage = generateDummyTriage({
      location: locationForAi,
      description: form.description,
      imageSize: form.imageFile?.size ?? 0,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    });

    setResult(triage);

    const createdIncident = addIncidentReport({
      locationText: locationForAi,
      description: form.description,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      triage,
    });

    setSavedIncidentId(createdIncident.id);
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form
        onSubmit={onSubmit}
        className="animate-rise-in rounded-2xl border border-[#2b3f5a] bg-[#131f31] p-5 shadow-[0_16px_38px_rgba(4,12,26,0.35)] md:p-6"
      >
        <h2 className="text-2xl font-semibold text-[#e6effa]">GridGuard Incident Upload</h2>
        <p className="mt-2 text-sm leading-6 text-[#9fb1c9]">
          Upload evidence, pin location, and submit context for AI triage and budget recommendation.
        </p>

        <div className="mt-5 space-y-4">
          <label
            htmlFor="issue-image"
            className="group block cursor-pointer rounded-2xl border-2 border-dashed border-[#4b6488] bg-[linear-gradient(140deg,#1b2d45_0%,#152437_100%)] p-6 text-center transition hover:border-[#6385b5] hover:shadow-[0_8px_24px_rgba(49,77,111,0.4)]"
          >
            <input
              id="issue-image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
            />
            <div className="mx-auto max-w-sm">
              <p className="text-base font-semibold text-[#dbe7f8] group-hover:text-[#f2f6fb]">{imageLabel}</p>
              <p className="mt-1 text-sm text-[#96aecb]">PNG, JPG, or WEBP. Maximum visual clarity is recommended.</p>
            </div>
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[#d9e4f5]">Incident Pin Location (Google Maps)</p>
            <IncidentMapPicker
              value={coordinates}
              onChange={setCoordinates}
              onLocationLabelChange={setLocationLabel}
            />
            <p className="text-xs text-[#8ea6c8]">
              {coordinates
                ? `Pinned: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
                : "No location pinned yet."}
            </p>
            {locationLabel ? <p className="text-xs text-[#8ea6c8]">Selected location: {locationLabel}</p> : null}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#d9e4f5]">Issue Description</span>
            <textarea
              value={form.description}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, description: event.target.value }));
                setResult(null);
              }}
              rows={5}
              className="resize-none rounded-xl border border-[#405a7e] bg-[#17273c] px-3 py-2 text-sm text-[#dbe7f8] outline-none ring-[#5977a5] placeholder:text-[#7f97b7] focus:ring-2"
              placeholder="Describe what happened, visible danger, and road condition."
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 w-full rounded-xl bg-[#4f6f9b] text-sm font-semibold text-[#eef4fd] transition hover:bg-[#5b7cae] disabled:cursor-not-allowed disabled:bg-[#60799d]"
          >
            Allocate Budget
          </button>

          {savedIncidentId ? (
            <p className="rounded-lg border border-[#3a5a4d] bg-[#1f3a33] px-3 py-2 text-xs text-[#b4e5d6]">
              Incident saved as {savedIncidentId}. Staff can review budget in dashboard.
            </p>
          ) : null}
        </div>
      </form>

      <aside className="animate-rise-in rounded-2xl border border-[#2b3f5a] bg-[#131f31] p-5 shadow-[0_16px_38px_rgba(4,12,26,0.35)] md:p-6">
        <h3 className="text-xl font-semibold text-[#e6effa]">GridGuard AI Verification Snapshot</h3>
        <p className="mt-2 text-sm leading-6 text-[#9fb1c9]">
          This is a simulated response showing how the platform can classify severity and impact.
        </p>

        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Uploaded incident"
            width={800}
            height={480}
            unoptimized
            className="mt-4 h-44 w-full rounded-xl border border-[#334a6a] object-cover"
          />
        ) : (
          <div className="mt-4 flex h-44 items-center justify-center rounded-xl border border-dashed border-[#415b81] bg-[#182a42] text-sm text-[#93abcc]">
            Uploaded image preview appears here
          </div>
        )}

        {result ? (
          <div className="mt-4 space-y-3 text-sm">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${levelStyles[result.level]}`}
            >
              {result.level}
            </span>
            <p className="rounded-xl bg-[#1a2b41] p-3 text-[#c6d8ee]">
              <span className="font-semibold text-[#e0ebf9]">Route impact:</span> {result.routeImpact}
            </p>
            <p className="rounded-xl bg-[#1a2b41] p-3 text-[#c6d8ee]">
              <span className="font-semibold text-[#e0ebf9]">Hazard category:</span> {result.hazardType}
            </p>
            <p className="rounded-xl bg-[#1a2b41] p-3 text-[#c6d8ee]">
              <span className="font-semibold text-[#e0ebf9]">Confidence:</span> {result.confidence}%
            </p>
            <p className="rounded-xl bg-[#1a2b41] p-3 text-[#c6d8ee]">
              <span className="font-semibold text-[#e0ebf9]">Pinned location:</span>{" "}
              {coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : "Unavailable"}
            </p>
            <p className="rounded-xl bg-[#1a2b41] p-3 text-[#c6d8ee]">
              <span className="font-semibold text-[#e0ebf9]">AI suggested budget:</span> MYR {result.aiSuggestedBudget.toLocaleString("en-MY")}
            </p>
            <p className="rounded-xl border border-[#334a6a] bg-[#121d2d] p-3 text-[#c9dbf2]">{result.recommendation}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[#334a6a] bg-[#1a2b41] p-3 text-sm text-[#93abcc]">
            Submit the form to generate an initial AI triage preview for agency verification.
          </div>
        )}
      </aside>
    </section>
  );
}
