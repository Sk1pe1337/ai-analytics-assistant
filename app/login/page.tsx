"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

/* ============================= */
/* ===== INNER COMPONENT ======= */
/* ============================= */

function LoginContent() {
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

      // fallback redirect
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 100);
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
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-40 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[640px] w-[640px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur">
            <span className="text-sm font-black tracking-wide">AI</span>
          </div>
          <div>
            <div className="text-lg font-semibold">AI Analytics Assistant</div>
            <div className="text-xs text-zinc-400">Login</div>
          </div>
        </Link>
      </header>

      <main className="relative mx-auto flex max-w-6xl px-6 pb-16">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-xl">
            <h1 className="text-2xl font-semibold">Log in</h1>

            <div className="mt-6 space-y-4">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onKeyDown}
                type="email"
                placeholder="Email"
                className="w-full rounded-2xl bg-black/30 px-4 py-3 text-sm ring-1 ring-white/10"
              />

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                type="password"
                placeholder="Password"
                className="w-full rounded-2xl bg-black/30 px-4 py-3 text-sm ring-1 ring-white/10"
              />

              {error && (
                <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/20">
                  {error}
                </div>
              )}

              <button
                onClick={login}
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Log in →"}
              </button>
            </div>

            <div className="mt-5 text-sm">
              <Link href="/register" className="text-indigo-400">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ============================= */
/* ===== SUSPENSE WRAPPER ====== */
/* ============================= */

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
