"use client";

import { useEffect, useMemo, useState } from "react";

import { PracticeQuiz } from "@/components/prep/PracticeQuiz";
import { eventPrepData, quizQuestions, quizzes, resources } from "@/lib/prep-data";
import type { QuizAttempt } from "@/lib/prep-types";
import { summarizeAttemptsByEvent } from "@/lib/practice-utils";

const PRACTICE_ATTEMPTS_KEY = "scioly-practice-attempts";

export function PracticePageClient() {
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

  const summaries = useMemo(
    () => summarizeAttemptsByEvent(attempts),
    [attempts]
  );

  function handleCompleteAttempt(attempt: QuizAttempt) {
    setAttempts((currentAttempts) => {
      const nextAttempts = [attempt, ...currentAttempts];

      window.localStorage.setItem(
        PRACTICE_ATTEMPTS_KEY,
        JSON.stringify(nextAttempts)
      );

      return nextAttempts;
    });
  }

  return (
    <div className="flex w-full flex-col gap-6 overflow-x-hidden">
      <section className="rounded-md border border-court-line bg-court-panel p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase text-cyan-300">
              Practice Queue
            </div>

            <h1 className="mt-2 break-words text-4xl font-black italic uppercase leading-none text-white md:text-6xl">
              Quiz yourself, then turn misses into a plan
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
              Students answer event questions, get scored, see weak topics, and
              generate a practice report officers can use.
            </p>
          </div>

          <div className="rounded-md border border-court-line bg-court-elevated p-4">
            <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
              Officer visibility preview
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-court-line bg-court-black p-3">
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Attempts
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {loaded ? attempts.length : "—"}
                </p>
              </div>

              <div className="rounded-md border border-court-line bg-court-black p-3">
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Events
                </p>
                <p className="mt-1 text-2xl font-black text-cyan-300">
                  {loaded ? summaries.length : "—"}
                </p>
              </div>
            </div>

            <a
              href="/officer/practice"
              className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-sm font-black uppercase tracking-wide text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/20"
            >
              View Officer Dashboard
            </a>
          </div>
        </div>
      </section>

      <PracticeQuiz
        events={eventPrepData}
        quizzes={quizzes}
        questions={quizQuestions}
        resources={resources}
        onCompleteAttempt={handleCompleteAttempt}
      />

      <section className="rounded-md border border-court-line bg-court-panel p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
              Officer Feed
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Recent practice reports
            </h2>
          </div>

          <p className="text-sm font-bold text-zinc-500">
            Saved locally for preview
          </p>
        </div>

        {!loaded ? (
          <EmptyState title="Loading reports..." body="" />
        ) : attempts.length === 0 ? (
          <EmptyState
            title="No reports yet"
            body="Complete a quiz to generate an officer-visible practice report."
          />
        ) : (
          <div className="grid gap-3">
            {attempts.slice(0, 5).map((attempt) => (
              <article
                key={attempt.id}
                className="rounded-md border border-court-line bg-court-elevated p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words font-black text-white">
                      {attempt.studentName} completed a practice quiz
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      Event: {attempt.eventId} • Score: {attempt.score}/
                      {attempt.totalQuestions} • {attempt.percent}%
                    </p>

                    {attempt.weakTopics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attempt.weakTopics.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300">
                    {new Date(attempt.completedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-zinc-700 bg-court-elevated p-6 text-center">
      <p className="font-black text-white">{title}</p>
      {body ? <p className="mt-2 text-sm text-zinc-400">{body}</p> : null}
    </div>
  );
}
