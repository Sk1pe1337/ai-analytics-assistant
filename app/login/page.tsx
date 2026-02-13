"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useMemo, useState } from "react";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const redirectTo = useMemo(() => {
    const raw = sp.get("next") || sp.get("from") || "/dashboard";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [sp]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(""), 1800);
  }

  async function login() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      showToast("Logged in ✅");

      router.replace(redirectTo);
      router.refresh();

      // железный редирект на случай, если навигация не отработает на проде
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 120);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") login();
  }

  return (
    <div className="min-h-screen bg-[#070713] text-zinc-100">
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
            <div className="text-xs text-zinc-400">Login</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/pricing" className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/10">
            Pricing
          </Link>
          <Link href="/demo" className="rounded-full bg-white/5 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/10">
            Demo script
          </Link>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-6xl px-6 pb-16">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-xl md:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-zinc-400">Welcome back</div>
                <h1 className="mt-2 text-2xl font-semibold">Log in</h1>
                <p className="mt-2 text-sm text-zinc-300">Enter your email and password to access the dashboard.</p>
              </div>

              <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] text-indigo-200 ring-1 ring-indigo-500/20">
                AUTH
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label className="text-xs text-zinc-300">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={onKeyDown}
                  type="email"
                  autoComplete="email"
                  placeholder="you@mail.com"
                  className="mt-1 w-full rounded-2xl bg-black/30 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 outline-none placeholder:text-zinc-500 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={onKeyDown}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-2xl bg-black/30 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 outline-none placeholder:text-zinc-500 focus:ring-indigo-500/40"
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={login}
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Log in →"}
              </button>

              <div className="text-xs text-zinc-400">
                Redirect after login: <span className="text-zinc-200 break-all">{redirectTo}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <Link href="/" className="rounded-xl bg-white/10 px-4 py-2 text-zinc-200 ring-1 ring-white/10 hover:bg-white/5">
                Back to landing
              </Link>

              <Link href="/register" className="rounded-xl bg-white/10 px-4 py-2 text-zinc-200 ring-1 ring-white/10 hover:bg-white/5">
                Create account
              </Link>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#070713] text-zinc-100 grid place-items-center">Loading…</div>}
    >
      <LoginInner />
    </Suspense>
  );
}
