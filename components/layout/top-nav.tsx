import Link from "next/link";

interface TopNavProps {
  active: "upload" | "staff";
}

export function TopNav({ active }: TopNavProps) {
  const uploadStyle =
    active === "upload"
      ? "border-[#5a76a3] bg-[#223754] text-[#dbe8f8]"
      : "border-[#314766] text-[#9fb3ce] hover:border-[#425b80] hover:text-[#d7e3f7]";

  const staffStyle =
    active === "staff"
      ? "border-[#5a76a3] bg-[#223754] text-[#dbe8f8]"
      : "border-[#314766] text-[#9fb3ce] hover:border-[#425b80] hover:text-[#d7e3f7]";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2b3f5a] bg-[#16263a]/90 px-4 py-3 shadow-[0_18px_40px_rgba(4,12,26,0.34)] backdrop-blur">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#84a0c6] uppercase">GridGuard</p>
        <h1 className="text-lg font-semibold text-[#e6effa]">Municipal Incident Intelligence</h1>
      </div>

      <nav className="flex items-center gap-2">
        <Link
          href="/"
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${uploadStyle}`}
        >
          Citizen Upload
        </Link>
        <Link
          href="/dashboard/staff"
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${staffStyle}`}
        >
          Staff Dashboard
        </Link>
      </nav>
    </header>
  );
}
