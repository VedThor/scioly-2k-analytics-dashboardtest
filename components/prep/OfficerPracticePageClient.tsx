"use client";

import { useEffect, useState } from "react";

import { OfficerPracticeFeed } from "@/components/prep/OfficerPracticeFeed";
import { eventPrepData } from "@/lib/prep-data";
import type { QuizAttempt } from "@/lib/prep-types";

const PRACTICE_ATTEMPTS_KEY = "scioly-practice-attempts";

export function OfficerPracticePageClient() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedAttemptsText = window.localStorage.getItem(PRACTICE_ATTEMPTS_KEY);
    const savedAttempts: QuizAttempt[] = savedAttemptsText
      ? JSON.parse(savedAttemptsText)
      : [];

    setAttempts(savedAttempts);
    setLoaded(true);
  }, []);

  function clearLocalReports() {
    const confirmed = window.confirm(
      "Clear local practice reports? This only clears the browser preview data."
    );

    if (!confirmed) return;

    window.localStorage.removeItem(PRACTICE_ATTEMPTS_KEY);
    setAttempts([]);
  }

  return (
    <div className="flex w-full flex-col gap-6 overflow-x-hidden">
      <section className="rounded-md border border-court-line bg-court-panel p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase text-cyan-300">
              Officer Dashboard
            </div>

            <h1 className="mt-2 break-words text-4xl font-black italic uppercase leading-none text-white md:text-6xl">
              Practice reports officers can use
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
              This turns self-quiz attempts into officer-visible preparation
              data: who practiced, what they scored, and which topics are weak
              across the team.
            </p>
          </div>

          <div className="rounded-md border border-court-line bg-court-elevated p-4">
            <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
              Data source
            </p>

            <h2 className="mt-2 text-xl font-black text-white">
              Local preview mode
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Attempts are currently stored in browser localStorage. This can
              later move to Supabase or the site database.
            </p>

            <button
              type="button"
              onClick={clearLocalReports}
              className="mt-4 w-full rounded-md border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm font-black uppercase tracking-wide text-rose-300 transition hover:border-rose-300 hover:bg-rose-400/20"
            >
              Clear Local Reports
            </button>
          </div>
        </div>
      </section>

      {!loaded ? (
        <section className="rounded-md border border-court-line bg-court-panel p-8 text-center">
          <p className="font-black text-white">Loading practice reports...</p>
        </section>
      ) : (
        <OfficerPracticeFeed attempts={attempts} events={eventPrepData} />
      )}
    </div>
  );
}
