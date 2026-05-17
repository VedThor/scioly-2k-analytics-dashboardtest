"use client";

import { useMemo, useState } from "react";

import { PracticeQuiz } from "@/components/prep/PracticeQuiz";
import { eventPrepData, quizQuestions, quizzes, resources } from "@/lib/prep-data";
import type { QuizAttempt } from "@/lib/prep-types";
import { summarizeAttemptsByEvent } from "@/lib/practice-utils";

export default function PracticePage() {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  const summaries = useMemo(
    () => summarizeAttemptsByEvent(attempts),
    [attempts]
  );

  function handleCompleteAttempt(attempt: QuizAttempt) {
    setAttempts((currentAttempts) => [attempt, ...currentAttempts]);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl shadow-black/30 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Practice Queue
              </p>

              <h1 className="mt-3 break-words text-4xl font-black tracking-tight text-white sm:text-5xl">
                Quiz yourself, then turn misses into a plan.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
                This is the interactive practice layer. Students answer event
                questions, get scored, see weak topics, and generate a practice
                report officers can use.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Officer visibility preview
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-black p-3">
                  <p className="text-xs font-bold uppercase text-zinc-500">
                    Attempts
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {attempts.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-3">
                  <p className="text-xs font-bold uppercase text-zinc-500">
                    Events
                  </p>
                  <p className="mt-1 text-2xl font-black text-cyan-300">
                    {summaries.length}
                  </p>
                </div>
              </div>
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

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                Officer Feed
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Recent practice reports
              </h2>
            </div>

            <p className="text-sm font-bold text-zinc-500">
              Local preview for now
            </p>
          </div>

          {attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-6 text-center">
              <p className="font-black text-white">No reports yet</p>
              <p className="mt-2 text-sm text-zinc-400">
                Complete a quiz to generate an officer-visible practice report.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {attempts.map((attempt) => (
                <article
                  key={attempt.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
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

        {summaries.length > 0 && (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Team Weakness Summary
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {summaries.map((summary) => (
                <article
                  key={summary.eventId}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                  <h3 className="font-black text-white">{summary.eventId}</h3>

                  <p className="mt-2 text-sm text-zinc-400">
                    {summary.attempts} attempt
                    {summary.attempts === 1 ? "" : "s"} • Average{" "}
                    {summary.averagePercent}%
                  </p>

                  {summary.mostCommonWeakTopics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {summary.mostCommonWeakTopics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
