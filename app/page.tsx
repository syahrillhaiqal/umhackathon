"use client"

import { UploadIssueForm } from "@/components/report/upload-issue-form";


export default function Home() {
  
const handleClick = async () => {
  console.log("tesatets")
}
  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-6 lg:px-10">
      
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_24px_65px_rgba(17,57,83,0.16)] backdrop-blur md:p-8">
        <section className="animate-rise-in rounded-2xl border border-[#d8e7eb] bg-[linear-gradient(120deg,#e9fffb_0%,#fff7ea_70%)] p-6 md:p-8">
          <p className="mb-3 inline-flex rounded-full border border-[#8cc9ce] bg-white/75 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[#0d6f77] uppercase">
            Public Issue Intake
          </p>
          <h1 className="max-w-3xl text-3xl leading-tight font-semibold text-[#0f2435] md:text-5xl">
            Verify high-risk traffic incidents with AI-assisted triage.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#345066] md:text-base">
            Upload a photo and field details so PBT, Majlis Daerah, and JKR teams can validate urgency, road blockage potential, and public hazard level.
          </p>
          <div className="mt-5 grid gap-3 text-sm text-[#355268] md:grid-cols-3">
            <p className="rounded-xl border border-[#c9d8e4] bg-white px-4 py-3">1. Add photo evidence</p>
            <p className="rounded-xl border border-[#c9d8e4] bg-white px-4 py-3">2. Describe issue context</p>
            <p className="rounded-xl border border-[#c9d8e4] bg-white px-4 py-3">3. Receive AI triage preview</p>
             <button className="bg-blue-700 text-white" onClick={handleClick}>
            TEST BACKEND
          </button>
          </div>

         

        </section>

        <UploadIssueForm />
      </main>
    </div>
  );
}
