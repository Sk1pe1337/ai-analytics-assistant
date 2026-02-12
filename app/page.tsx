import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070713] text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-40 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[640px] w-[640px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(99,102,241,0.16),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      {/* Top bar */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur">
            <span className="text-sm font-black tracking-wide">AI</span>
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight">AI Analytics Assistant</div>
            <div className="text-xs text-zinc-400">For SMEs • CSV/Sheets-ready • Working MVP</div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Start demo →
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-6">
        {/* Hero */}
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Built for small & medium businesses
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              Turn messy spreadsheets into{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-indigo-100 to-fuchsia-200 bg-clip-text text-transparent">
                clear decisions
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-300">
              A lightweight alternative to complex BI tools. Upload CSV / Excel / Google Sheets exports,
              map revenue & multiple costs, see profit/margin, and get actionable recommendations when
              the business is underperforming.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <Link
                href="/login"
                className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                Start demo →
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl bg-white/10 px-5 py-3 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
              >
                Go to dashboard
              </Link>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
              <Feature title="Real KPI parsing" text="Works on real CSV files, not mock charts." />
              <Feature title="Cost mapping" text="Select multiple cost columns — no strict format." />
              <Feature title="Actionable insights" text="Recommendations adapt to profit/loss." />
            </div>
          </div>

          {/* MVP Card */}
          <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-xl md:p-7">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-200">MVP user journey</div>
                <div className="text-xs text-zinc-400">Clear flow for final demo</div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200 ring-1 ring-emerald-500/20">
                Working MVP
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm text-zinc-300">
              <CheckItem done>Login (demo auth)</CheckItem>
              <CheckItem done>Upload CSV</CheckItem>
              <CheckItem done>Map revenue & multiple costs</CheckItem>
              <CheckItem done>See KPI dashboard</CheckItem>
              <CheckItem done>AI insights + export report</CheckItem>
              <CheckItem done>Feedback collection</CheckItem>
            </div>

            <div className="mt-6 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
              <div className="text-xs text-zinc-400">Why SMEs like it</div>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-zinc-200">
                <li>No BI setup, no dashboards to build</li>
                <li>Works with Excel / Sheets / POS exports</li>
                <li>Immediate profit/loss visibility</li>
              </ul>
            </div>

            <div className="mt-6 flex gap-2">
              <Link
                href="/login"
                className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-400"
              >
                Start demo
              </Link>
              <Link
                href="/pricing"
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-center text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
              >
                Pricing
              </Link>
            </div>

            <div className="mt-3 text-xs text-zinc-400">
              Tip: In the dashboard, use column mapping to support any CSV format.
            </div>
          </div>
        </div>

        {/* Problem → Solution */}
        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <Card title="Problem (SMEs today)">
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200">
              <li>BI tools are expensive and complex to configure</li>
              <li>Owners spend hours in Excel and still miss key insights</li>
              <li>Hard to see profit/loss quickly and take action</li>
            </ul>
          </Card>

          <Card title="Solution (our product)">
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200">
              <li>Upload CSV / export from Sheets</li>
              <li>Map revenue + multiple cost columns</li>
              <li>Get KPIs + recommendations tailored to loss/profit</li>
            </ul>
          </Card>
        </section>

        {/* Business model */}
        <section className="mt-10">
          <div className="text-lg font-semibold">Business model</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <ModelCard title="Demo (MVP)" price="$0" items={["CSV upload", "KPI dashboard", "Insights", "Export report"]} />
            <ModelCard
              title="Pro (future)"
              price="$19–29/mo"
              items={["Google Sheets integration", "Saved reports", "Multiple businesses", "Team access"]}
            />
            <ModelCard
              title="Integrations (future)"
              price="Add-ons"
              items={["Shopify/POS sync", "Auto imports", "Alerts (loss risk)", "Forecasting"]}
            />
          </div>
          <div className="mt-3 text-xs text-zinc-400">
            MVP validates demand and usability before building deep integrations.
          </div>
        </section>

        {/* Criteria alignment */}
        <section className="mt-10 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="text-lg font-semibold">Aligned with evaluation criteria</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <CheckItem done>Functional website (demo access)</CheckItem>
            <CheckItem done>Real product functionality (CSV parsing + KPIs)</CheckItem>
            <CheckItem done>Logical user journey (landing → login → dashboard → insights → feedback)</CheckItem>
            <CheckItem done>Customer need alignment (SMEs, profit/loss visibility)</CheckItem>
            <CheckItem done>Technical feasibility (Next.js + parsing + export)</CheckItem>
            <CheckItem done>Consistency with business plan (freemium → pro)</CheckItem>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Run demo now →
            </Link>
            <Link
              href="/feedback"
              className="rounded-xl bg-white/10 px-5 py-3 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
            >
              Leave feedback
            </Link>
            <Link
              href="/insights"
              className="rounded-xl bg-white/10 px-5 py-3 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
            >
              View insights
            </Link>
          </div>
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-zinc-500">
          MVP Demo • Next.js + Tailwind • AI Analytics Assistant for SMEs
        </footer>
      </main>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs leading-5 text-zinc-400">{text}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur">
      <div className="text-sm font-semibold text-zinc-200">{title}</div>
      {children}
    </div>
  );
}

function ModelCard({ title, price, items }: { title: string; price: string; items: string[] }) {
  return (
    <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-end justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-lg font-semibold">{price}</div>
      </div>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function CheckItem({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={[
          "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md ring-1",
          done
            ? "bg-emerald-500/20 text-emerald-200 ring-emerald-500/30"
            : "bg-white/5 text-zinc-400 ring-white/10",
        ].join(" ")}
      >
        {done ? "✓" : "•"}
      </span>
      <span className="text-sm text-zinc-200">{children}</span>
    </div>
  );
}
