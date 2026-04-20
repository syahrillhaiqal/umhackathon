"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { generateDummyTriage, TriageResult } from "@/lib/ai-triage";

const levelStyles: Record<TriageResult["level"], string> = {
  Emergency: "border-[#e97a5e] bg-[#ffede5] text-[#8f311f]",
  "High Risk": "border-[#e7ba70] bg-[#fff6df] text-[#895e1a]",
  Monitor: "border-[#95c8ab] bg-[#edf9f1] text-[#22633f]",
};

interface UploadState {
  location: string;
  landmark: string;
  description: string;
  imageFile: File | null;
}

export function UploadIssueForm() {
  const [form, setForm] = useState<UploadState>({
    location: "",
    landmark: "",
    description: "",
    imageFile: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResult | null>(null);

  const canSubmit = useMemo(
    () => Boolean(form.imageFile && form.location.trim() && form.description.trim()),
    [form],
  );

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

    if (!form.imageFile) {
      return;
    }

    const triage = generateDummyTriage({
      location: form.location,
      description: `${form.landmark}. ${form.description}`,
      imageSize: form.imageFile.size,
    });

    setResult(triage);
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <form
        onSubmit={onSubmit}
        className="animate-rise-in rounded-2xl border border-[#d8e0e7] bg-white p-5 shadow-[0_12px_24px_rgba(38,59,84,0.08)] md:p-6"
      >
        <h2 className="text-2xl font-semibold text-[#132839]">Traffic Issue Upload</h2>
        <p className="mt-2 text-sm leading-6 text-[#4f6477]">
          Provide clear evidence so agency officers can quickly validate emergency level and route impact.
        </p>

        <div className="mt-5 space-y-4">
          <label
            htmlFor="issue-image"
            className="group block cursor-pointer rounded-2xl border-2 border-dashed border-[#9ac3d1] bg-[linear-gradient(140deg,#effbff_0%,#fff2e9_100%)] p-6 text-center transition hover:border-[#1c8187] hover:shadow-[0_8px_24px_rgba(13,111,119,0.18)]"
          >
            <input
              id="issue-image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => onImageChange(event.target.files?.[0] ?? null)}
            />
            <div className="mx-auto max-w-sm">
              <p className="text-base font-semibold text-[#113147] group-hover:text-[#0c6e74]">{imageLabel}</p>
              <p className="mt-1 text-sm text-[#50667b]">PNG, JPG, or WEBP. Maximum visual clarity is recommended.</p>
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#203547]">Incident Location</span>
              <input
                value={form.location}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, location: event.target.value }));
                  setResult(null);
                }}
                className="h-11 rounded-xl border border-[#c8d8e4] px-3 text-sm outline-none ring-[#0d8f8f] placeholder:text-[#7e93a5] focus:ring-2"
                placeholder="Example: Jalan Meranti, KM 4"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[#203547]">Contactable Landmark</span>
              <input
                className="h-11 rounded-xl border border-[#c8d8e4] px-3 text-sm outline-none ring-[#0d8f8f] placeholder:text-[#7e93a5] focus:ring-2"
                placeholder="Example: Near SK Meranti gate"
                value={form.landmark}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, landmark: event.target.value }));
                  setResult(null);
                }}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#203547]">Issue Description</span>
            <textarea
              value={form.description}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, description: event.target.value }));
                setResult(null);
              }}
              rows={5}
              className="resize-none rounded-xl border border-[#c8d8e4] px-3 py-2 text-sm outline-none ring-[#0d8f8f] placeholder:text-[#7e93a5] focus:ring-2"
              placeholder="Describe what happened, visible danger, and road condition."
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 w-full rounded-xl bg-[#0d8f8f] text-sm font-semibold text-white transition hover:bg-[#0d7575] disabled:cursor-not-allowed disabled:bg-[#8cbcbc]"
          >
            Run AI Triage Preview
          </button>
        </div>
      </form>

      <aside className="animate-rise-in rounded-2xl border border-[#d8e0e7] bg-white p-5 shadow-[0_12px_24px_rgba(38,59,84,0.08)] md:p-6">
        <h3 className="text-xl font-semibold text-[#132839]">AI Verification Snapshot</h3>
        <p className="mt-2 text-sm leading-6 text-[#4f6477]">
          This is a simulated response showing how the platform can classify severity and impact.
        </p>

        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Uploaded incident"
            width={800}
            height={480}
            unoptimized
            className="mt-4 h-44 w-full rounded-xl border border-[#d9e3ec] object-cover"
          />
        ) : (
          <div className="mt-4 flex h-44 items-center justify-center rounded-xl border border-dashed border-[#b8c8d5] bg-[#f4f8fc] text-sm text-[#648197]">
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
            <p className="rounded-xl bg-[#f2f7fb] p-3 text-[#2e485c]">
              <span className="font-semibold text-[#1c3347]">Route impact:</span> {result.routeImpact}
            </p>
            <p className="rounded-xl bg-[#f2f7fb] p-3 text-[#2e485c]">
              <span className="font-semibold text-[#1c3347]">Hazard category:</span> {result.hazardType}
            </p>
            <p className="rounded-xl bg-[#f2f7fb] p-3 text-[#2e485c]">
              <span className="font-semibold text-[#1c3347]">Confidence:</span> {result.confidence}%
            </p>
            <p className="rounded-xl border border-[#dce8f2] bg-white p-3 text-[#2f4b5f]">{result.recommendation}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[#dce8f2] bg-[#f8fbfe] p-3 text-sm text-[#60788f]">
            Submit the form to generate an initial AI triage preview for agency verification.
          </div>
        )}
      </aside>
    </section>
  );
}
