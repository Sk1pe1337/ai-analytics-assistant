"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Vote = "Helpful" | "Needs improvement" | "Would pay";

type FeedbackItem = {
  id: string;
  vote: Vote;
  comment: string;
  createdAt: string; // ISO
};

const STORAGE_KEY = "mvp_feedback_v1";

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function loadFeedback(): FeedbackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveFeedback(items: FeedbackItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function FeedbackPage() {
  const [vote, setVote] = useState<Vote | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(loadFeedback());
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const helpful = items.filter((x) => x.vote === "Helpful").length;
    const needs = items.filter((x) => x.vote === "Needs improvement").length;
    const pay = items.filter((x) => x.vote === "Would pay").length;
    return { total, helpful, needs, pay };
  }, [items]);

  function submit(v: Vote) {
    setVote(v);
    setError("");

    const trimmed = comment.trim();
    if (!trimmed) {
      setError("Please add a short comment (1–2 sentences).");
      return;
    }

    const next: FeedbackItem = {
      id: uid(),
      vote: v,
      comment: trimmed,
      createdAt: new Date().toISOString(),
    };

    const updated = [next, ...items].slice(0, 50); // keep last 50
    setItems(updated);
    saveFeedback(updated);

    setSent(true);
    setTimeout(() => setSent(false), 2200);
    setComment("");
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }

  return (
    <div className="min-h-screen bg-[#070713] text-zinc-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Feedback</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Customer validation evidence: feedback is saved locally (MVP).
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
            >
              Back to dashboard
            </Link>
            <Link
              href="/"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
            >
              Landing
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Stat label="Total responses" value={String(stats.total)} />
          <Stat label="Helpful" value={String(stats.helpful)} />
          <Stat label="Needs improvement" value={String(stats.needs)} />
          <Stat label="Would pay" value={String(stats.pay)} />
        </div>

        {/* Form */}
        <div className="mt-6 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="text-sm font-semibold">Quick survey</div>

          <label className="mt-4 block text-sm text-zinc-300">
            Comment
            <textarea
              className="mt-2 w-full rounded-2xl bg-black/40 p-3 text-sm text-zinc-100 ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-indigo-500/40"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What would make this product useful for your business?"
            />
          </label>

          {error && (
            <div className="mt-3 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-200 ring-1 ring-rose-500/20">
              {error}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => submit("Helpful")}
              className="rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
            >
              Helpful ✅
            </button>
            <button
              onClick={() => submit("Needs improvement")}
              className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 ring-1 ring-rose-500/30 hover:bg-rose-500/25"
            >
              Needs improvement ⚠️
            </button>
            <button
              onClick={() => submit("Would pay")}
              className="rounded-xl bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-200 ring-1 ring-indigo-500/30 hover:bg-indigo-500/25"
            >
              Would pay 💳
            </button>

            <div className="ml-auto flex gap-2">
              <Link
                href="/admin/feedback"
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
              >
                View saved feedback →
              </Link>
              <button
                onClick={clearAll}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
                title="Clears local MVP feedback"
              >
                Clear
              </button>
            </div>
          </div>

          {sent && (
            <div className="mt-4 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-500/20">
              Feedback submitted ✅ (saved locally)
            </div>
          )}

          <div className="mt-3 text-xs text-zinc-400">
            Note: For MVP, feedback is stored in browser localStorage (no backend required).
          </div>
        </div>

        {/* Recent list */}
        <div className="mt-6 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Recent feedback</div>
            <div className="text-xs text-zinc-400">{items.length} saved</div>
          </div>

          {items.length === 0 ? (
            <div className="mt-4 text-sm text-zinc-400">No feedback yet. Submit the first one 🙂</div>
          ) : (
            <div className="mt-4 space-y-3">
              {items.slice(0, 6).map((x) => (
                <div
                  key={x.id}
                  className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-zinc-200 ring-1 ring-white/10">
                      {x.vote}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(x.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-zinc-200">{x.comment}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
