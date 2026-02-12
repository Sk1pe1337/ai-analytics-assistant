"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  function ping(msg: string) {
    setToast(msg);
    window.clearTimeout((ping as any)._t);
    (ping as any)._t = window.setTimeout(() => setToast(""), 2200);
  }

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Registration failed.");
        return;
      }

      ping("Account created ✅");
      router.push("/dashboard");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

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

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur">
            <span className="text-sm font-black tracking-wide">AI</span>
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight">AI Analytics Assistant</div>
            <div className="text-xs text-zinc-400">Register • SQLite DB</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
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
            Login →
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-6xl px-6 pb-16">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-xl md:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-zinc-400">Create account</div>
                <h1 className="mt-2 text-2xl font-semibold">Register</h1>
                <p className="mt-2 text-sm text-zinc-300">
                  This MVP stores users in a simple SQLite database via Prisma.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200 ring-1 ring-emerald-500/20">
                MVP
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <label className="block text-sm text-zinc-300">
                Name (optional)
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-black/40 p-3 text-sm text-zinc-100 ring-1 ring-white/10 focus:outline-none focus:ring-indigo-500/40"
                  placeholder="Your name"
                />
              </label>

              <label className="block text-sm text-zinc-300">
                Email
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-black/40 p-3 text-sm text-zinc-100 ring-1 ring-white/10 focus:outline-none focus:ring-indigo-500/40"
                  placeholder="name@email.com"
                />
              </label>

              <label className="block text-sm text-zinc-300">
                Password (min 6)
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="mt-2 w-full rounded-2xl bg-black/40 p-3 text-sm text-zinc-100 ring-1 ring-white/10 focus:outline-none focus:ring-indigo-500/40"
                  placeholder="••••••"
                />
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-200 ring-1 ring-rose-500/20">
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="mt-5 w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account →"}
            </button>

            <div className="mt-4 flex items-center justify-between text-sm">
              <Link
                href="/"
                className="rounded-xl bg-white/10 px-4 py-2 text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
              >
                Back to landing
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-white/10 px-4 py-2 text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
              >
                Already have account?
              </Link>
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              Production note: you’d add email verification + password reset.
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-zinc-100 ring-1 ring-white/10 backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  );
}
