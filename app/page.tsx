import { TopNav } from "@/components/layout/top-nav";
import { UploadIssueForm } from "@/components/report/upload-issue-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-6 lg:px-10">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <TopNav active="upload" />

        <section className="animate-rise-in rounded-2xl border border-[#314766] bg-[linear-gradient(120deg,#18293f_0%,#1d2f49_58%,#17263a_100%)] p-6 shadow-[0_16px_36px_rgba(4,12,26,0.35)] md:p-8">
          <p className="mb-3 inline-flex rounded-full border border-[#446186] bg-[#112039] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[#aac1df] uppercase">
            GridGuard Intake
          </p>
          <h1 className="max-w-3xl text-3xl leading-tight font-semibold text-[#e8f0fb] md:text-5xl">
            GridGuard traffic incident upload and AI verification.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9ab0ca] md:text-base">
            Submit an image and field context so PBT, Majlis Daerah, and JKR teams can verify emergency severity, road blockade risk, and funding decisions.
          </p>
          <div className="mt-5 grid gap-3 text-sm text-[#b5c8df] md:grid-cols-3">
            <p className="rounded-xl border border-[#334b6d] bg-[#15273d] px-4 py-3">1. Upload field image evidence</p>
            <p className="rounded-xl border border-[#334b6d] bg-[#15273d] px-4 py-3">2. Pin map location and add details</p>
            <p className="rounded-xl border border-[#334b6d] bg-[#15273d] px-4 py-3">3. Review AI risk and budget proposal</p>
          </div>
        </section>

        <UploadIssueForm />
      </main>
    </div>
  );
}
