"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Vote = "Helpful" | "Needs improvement" | "Would pay";
type FeedbackItem = { id: string; vote: Vote; comment: string; createdAt: string };

const STORAGE_KEY = "mvp_feedback_v1";

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

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    setItems(loadFeedback());
  }, []);

  const summary = useMemo(() => {
    const total = items.length;
    const helpful = items.filter((x) => x.vote === "Helpful").length;
    const needs = items.filter((x) => x.vote === "Needs improvement").length;
    const pay = items.filter((x) => x.vote === "Would pay").length;
    return { total, helpful, needs, pay };
  }, [items]);

  return (
    <div className="min-h-screen bg-[#070713] text-zinc-100 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Admin • Feedback Log</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Evidence for MVP validation: saved user responses (local storage).
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/feedback"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
            >
              Back to feedback
            </Link>
            <Link
              href="/"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 hover:bg-white/5"
            >
              Landing
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Stat label="Total responses" value={String(summary.total)} />
          <Stat label="Helpful" value={String(summary.helpful)} />
          <Stat label="Needs improvement" value={String(summary.needs)} />
          <Stat label="Would pay" value={String(summary.pay)} />
        </div>

        <div className="mt-6 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="text-sm font-semibold">Responses</div>

          {items.length === 0 ? (
            <div className="mt-4 text-sm text-zinc-400">
              No feedback yet. Go to /feedback and submit a few responses for your demo.
            </div>
          ) : (
            <div className="mt-4 overflow-auto rounded-2xl ring-1 ring-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-zinc-200">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Vote</th>
                    <th className="px-3 py-2">Comment</th>
                  </tr>
                </thead>
                <tbody className="bg-black/20 text-zinc-200">
                  {items.map((x) => (
                    <tr key={x.id} className="border-t border-white/10">
                      <td className="px-3 py-2 text-xs text-zinc-400">
                        {new Date(x.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] ring-1 ring-white/10">
                          {x.vote}
                        </span>
                      </td>
                      <td className="px-3 py-2">{x.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 text-xs text-zinc-500">
            MVP note: stored locally for speed. In production this would be saved to Neon/Postgres.
          </div>
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
