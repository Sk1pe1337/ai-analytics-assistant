"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PlanId = "basic" | "pro" | "enterprise" | "consulting";

type Plan = {
  id: PlanId;
  title: string;
  subtitle: string;
  monthlyPrice: number; // KZT
  currency: "KZT";
  badge?: string;
  highlight?: boolean;
  includes: string[];
  advantages: string[];
  cta: { label: string; href: string };
  footnote?: string;
};

function formatKZT(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₸";
}

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  // We assume "annual" = pay for 12 months, with a discount (like SaaS)
  const annualDiscount = 0.15; // 15%

  const plans: Plan[] = useMemo(
    () => [
      {
        id: "basic",
        title: "Basic",
        subtitle: "For micro-SMEs & startups",
        monthlyPrice: 15000,
        currency: "KZT",
        badge: "Most affordable",
        includes: [
          "CSV upload & column mapping",
          "Revenue + cost analysis",
          "Profit & margin calculation",
          "Basic KPI dashboard",
          "AI recommendations (MVP logic)",
          "Feedback support",
        ],
        advantages: [
          "Affordable entry-level analytics",
          "No BI setup required",
          "Perfect for small teams",
        ],
        cta: { label: "Start demo", href: "/login" },
      },
      {
        id: "pro",
        title: "Professional",
        subtitle: "For growing SMEs (10–50 employees)",
        monthlyPrice: 35000,
        currency: "KZT",
        badge: "Best value",
        highlight: true,
        includes: [
          "Everything in Basic",
          "Multiple business tracking",
          "Historical trend comparison",
          "Margin alerts",
          "Advanced KPI analytics",
          "Exportable reports (PDF/Excel) — MVP-ready",
          "Priority support",
        ],
        advantages: [
          "Better financial control",
          "More insights & automation",
          "Designed for growth teams",
        ],
        cta: { label: "Choose Professional", href: "/login" },
      },
      {
        id: "enterprise",
        title: "Enterprise",
        subtitle: "For established SMEs (50+ employees)",
        monthlyPrice: 75000,
        currency: "KZT",
        badge: "For scale",
        includes: [
          "Everything in Professional",
          "Custom KPI models",
          "Dedicated onboarding",
          "API integrations (POS, Shopify, ERP) — future",
          "Automated data sync — future",
          "Custom dashboard branding",
          "Dedicated support manager",
        ],
        advantages: [
          "Enterprise-grade customization",
          "Full integration ecosystem",
          "Strategic analytics support",
        ],
        cta: { label: "Contact sales", href: "/feedback" },
        footnote: "MVP note: some integrations are roadmap items shown for business plan consistency.",
      },
      {
        id: "consulting",
        title: "Custom Consulting",
        subtitle: "Custom AI implementation projects",
        monthlyPrice: 150000, // per project (we show as monthly “average”)
        currency: "KZT",
        badge: "Custom work",
        includes: [
          "Custom dashboard development",
          "Predictive model setup",
          "Data integration services",
          "Workflow automation",
          "3–4 week implementation cycle",
        ],
        advantages: [
          "Tailored AI solution",
          "Personalized implementation",
          "High-value transformation",
        ],
        cta: { label: "Request proposal", href: "/feedback" },
        footnote: "Shown as average per project. Real pricing depends on scope.",
      },
    ],
    []
  );

  function priceFor(plan: Plan) {
    if (billing === "monthly") return { label: formatKZT(plan.monthlyPrice), sub: "/month" };
    // annual with discount (SaaS standard)
    const annual = Math.round(plan.monthlyPrice * 12 * (1 - annualDiscount));
    return { label: formatKZT(annual), sub: "/year" };
  }

  const revenueProjection = useMemo(() => {
    // From your screenshot assumptions:
    // Basic: 25 users, Pro: 12 users, Enterprise: 4 clients, Consulting: 2 projects/month
    const basic = 15000 * 25;
    const pro = 35000 * 12;
    const ent = 75000 * 4;
    const consulting = 150000 * 2;
    const total = basic + pro + ent + consulting;
    return { basic, pro, ent, consulting, total, annual: total * 12 };
  }, []);

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

      {/* Header */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur">
            <span className="text-sm font-black tracking-wide">AI</span>
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight">AI Analytics Assistant</div>
            <div className="text-xs text-zinc-400">Pricing • SME analytics SaaS</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/demo"
            className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            Demo script
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Start demo →
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-16">
        {/* Title */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Plans for every SME stage</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Simple analytics packages aligned with the business model. The MVP runs as a functional demo and shows a
              real user journey.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] p-2 ring-1 ring-white/10 backdrop-blur">
            <button
              onClick={() => setBilling("monthly")}
              className={[
                "rounded-xl px-4 py-2 text-sm ring-1 transition",
                billing === "monthly"
                  ? "bg-white/10 text-white ring-white/15"
                  : "bg-transparent text-zinc-300 ring-transparent hover:bg-white/5",
              ].join(" ")}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={[
                "rounded-xl px-4 py-2 text-sm ring-1 transition",
                billing === "annual"
                  ? "bg-white/10 text-white ring-white/15"
                  : "bg-transparent text-zinc-300 ring-transparent hover:bg-white/5",
              ].join(" ")}
            >
              Annual{" "}
              <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200 ring-1 ring-emerald-500/20">
                -15%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const price = priceFor(p);
            return (
              <div
                key={p.id}
                className={[
                  "rounded-3xl p-6 ring-1 backdrop-blur-xl",
                  p.highlight
                    ? "bg-indigo-500/10 ring-indigo-500/25"
                    : "bg-white/[0.06] ring-white/10",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold">{p.title}</div>
                      {p.badge && (
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-200 ring-1 ring-white/10">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">{p.subtitle}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-semibold">{price.label}</div>
                    <div className="text-xs text-zinc-400">{price.sub}</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold text-zinc-300">Includes</div>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                      {p.includes.map((x) => (
                        <li key={x} className="flex gap-2">
                          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20">
                            ✓
                          </span>
                          <span className="min-w-0">{x}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-zinc-300">Advantages</div>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                      {p.advantages.map((x) => (
                        <li key={x} className="flex gap-2">
                          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-zinc-200 ring-1 ring-white/10">
                            →
                          </span>
                          <span className="min-w-0">{x}</span>
                        </li>
                      ))}
                    </ul>

                    {p.footnote && (
                      <div className="mt-4 rounded-2xl bg-black/30 p-3 text-xs text-zinc-400 ring-1 ring-white/10">
                        {p.footnote}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    href={p.cta.href}
                    className={[
                      "w-full rounded-xl px-4 py-3 text-center text-sm font-semibold",
                      p.highlight
                        ? "bg-indigo-500 text-white hover:bg-indigo-400"
                        : "bg-white/10 text-zinc-100 ring-1 ring-white/10 hover:bg-white/5",
                    ].join(" ")}
                  >
                    {p.cta.label}
                  </Link>
                </div>

                <div className="mt-3 text-xs text-zinc-500">
                  {billing === "annual" ? "Annual plan billed once per year." : "Monthly plan billed every month."}
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue projection box (for teacher) */}
        <div className="mt-10 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-lg font-semibold">Revenue projection (Year 1 assumptions)</div>
              <div className="mt-1 text-sm text-zinc-400">
                Basic: 25 users • Professional: 12 users • Enterprise: 4 clients • Consulting: 2 projects/month
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400">Projected total</div>
              <div className="text-2xl font-semibold">{formatKZT(revenueProjection.total)} / month</div>
              <div className="text-sm text-zinc-400">{formatKZT(revenueProjection.annual)} / year</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <MiniStat label="Basic" value={formatKZT(revenueProjection.basic)} />
            <MiniStat label="Professional" value={formatKZT(revenueProjection.pro)} />
            <MiniStat label="Enterprise" value={formatKZT(revenueProjection.ent)} />
            <MiniStat label="Consulting" value={formatKZT(revenueProjection.consulting)} />
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            MVP note: pricing page demonstrates consistency between MVP and business model for evaluation.
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-10 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
          >
            Back to landing
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
          >
            Go to dashboard
          </Link>
          <Link
            href="/feedback"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
          >
            Contact / Feedback
          </Link>
        </div>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
