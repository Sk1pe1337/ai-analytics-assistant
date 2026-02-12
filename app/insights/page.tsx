import Link from "next/link";

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[#070713] text-zinc-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">AI Insights</h1>
            <p className="mt-2 text-sm text-zinc-400">
              In MVP, insights are derived from KPI patterns (profit/loss, margin, cost growth) to guide SME decisions.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 grid gap-3">
          <Insight tag="Profitability" title="Detect profit/loss state" text="If profit is negative, recommend cutting costs and focusing on high-margin offers." impact="High" />
          <Insight tag="Costs" title="Multi-cost aggregation" text="Supports multiple cost columns to match real business spreadsheets." impact="High" />
          <Insight tag="Growth" title="Monitor margins over time" text="Thin margins (<10%) trigger pricing/cost recommendations." impact="Medium" />
          <Insight tag="Inventory" title="Top product prioritization" text="When product column is selected, highlight best-performing product to avoid stockouts." impact="Medium" />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/feedback"
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Leave feedback →
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
          >
            Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}

function Insight({
  tag,
  title,
  text,
  impact,
}: {
  tag: string;
  title: string;
  text: string;
  impact: "High" | "Medium" | "Low";
}) {
  const impactStyle =
    impact === "High"
      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25"
      : impact === "Medium"
      ? "bg-indigo-500/15 text-indigo-200 ring-indigo-500/25"
      : "bg-white/10 text-zinc-200 ring-white/10";

  return (
    <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm text-zinc-300">{text}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-zinc-300 ring-1 ring-white/10">
            {tag}
          </span>
          <span className={["rounded-full px-3 py-1 text-[11px] ring-1", impactStyle].join(" ")}>
            Impact: {impact}
          </span>
        </div>
      </div>
    </div>
  );
}
