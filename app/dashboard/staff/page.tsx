import { StaffBudgetDashboard } from "@/components/dashboard/staff-budget-dashboard";
import { TopNav } from "@/components/layout/top-nav";

export default function StaffDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-6 lg:px-10">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <TopNav active="staff" />

        <section className="animate-rise-in rounded-2xl border border-[#314766] bg-[linear-gradient(120deg,#18293f_0%,#1d2f49_58%,#17263a_100%)] p-6 shadow-[0_16px_36px_rgba(4,12,26,0.35)] md:p-8">
          <p className="mb-3 inline-flex rounded-full border border-[#446186] bg-[#112039] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[#aac1df] uppercase">
            GridGuard Staff Console
          </p>
          <h1 className="max-w-3xl text-3xl leading-tight font-semibold text-[#e8f0fb] md:text-5xl">
            Budget governance for AI-proposed incident responses.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9ab0ca] md:text-base">
            View total operating funds, review allocations proposed from uploaded incident triage, and approve each budget release.
          </p>
        </section>

        <StaffBudgetDashboard />
      </main>
    </div>
  );
}
