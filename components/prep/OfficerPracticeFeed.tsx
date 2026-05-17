"use client";

import type { EventPrep, QuizAttempt } from "@/lib/prep-types";
import { summarizeAttemptsByEvent } from "@/lib/practice-utils";

type OfficerPracticeFeedProps = {
  attempts: QuizAttempt[];
  events: EventPrep[];
};

function getEventName(events: EventPrep[], eventId: string) {
  return events.find((event) => event.id === eventId)?.name ?? eventId;
}

function formatDuration(seconds?: number) {
  if (!seconds) return "Not tracked";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes <= 0) return `${remainingSeconds}s`;

  return `${minutes}m ${remainingSeconds}s`;
}

export function OfficerPracticeFeed({
  attempts,
  events,
}: OfficerPracticeFeedProps) {
  const summaries = summarizeAttemptsByEvent(attempts);

  const sortedAttempts = attempts
    .slice()
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

  const totalAttempts = attempts.length;

  const averagePercent =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((sum, attempt) => sum + attempt.percent, 0) /
            attempts.length
        )
      : 0;

  const uniqueStudents = new Set(
    attempts.map((attempt) => attempt.studentName.trim()).filter(Boolean)
  ).size;

  const allWeakTopics = attempts.flatMap((attempt) => attempt.weakTopics);
  const weakTopicCounts = new Map<string, number>();

  for (const topic of allWeakTopics) {
    weakTopicCounts.set(topic, (weakTopicCounts.get(topic) ?? 0) + 1);
  }

  const topWeakTopics = Array.from(weakTopicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Practice Attempts"
          value={String(totalAttempts)}
          detail="Completed self-quizzes"
        />

        <MetricCard
          label="Active Students"
          value={String(uniqueStudents)}
          detail="Students who submitted practice"
        />

        <MetricCard
          label="Average Score"
          value={attempts.length > 0 ? `${averagePercent}%` : "No data"}
          detail="Across reported attempts"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                Recent Practice
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Student quiz reports
              </h2>
            </div>

            <p className="text-sm font-bold text-zinc-500">
              {sortedAttempts.length} report
              {sortedAttempts.length === 1 ? "" : "s"}
            </p>
          </div>

          {sortedAttempts.length === 0 ? (
            <EmptyState
              title="No practice reports yet"
              body="Once students complete quizzes in the Practice Queue, reports will appear here."
            />
          ) : (
            <div className="grid gap-3">
              {sortedAttempts.map((attempt) => (
                <article
                  key={attempt.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-300">
                          {getEventName(events, attempt.eventId)}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${
                            attempt.percent >= 80
                              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                              : attempt.percent >= 60
                                ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                                : "border-rose-400/40 bg-rose-400/10 text-rose-300"
                          }`}
                        >
                          {attempt.percent}%
                        </span>
                      </div>

                      <h3 className="mt-3 break-words text-lg font-black text-white">
                        {attempt.studentName}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Score: {attempt.score}/{attempt.totalQuestions} • Time:{" "}
                        {formatDuration(attempt.timeSpentSeconds)} • Completed{" "}
                        {new Date(attempt.completedAt).toLocaleString()}
                      </p>

                      {attempt.weakTopics.length > 0 ? (
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
                      ) : (
                        <p className="mt-3 text-sm font-bold text-emerald-300">
                          No weak topics detected.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-black p-4 text-center lg:w-28">
                      <p className="text-xs font-bold uppercase text-zinc-500">
                        Score
                      </p>
                      <p className="mt-1 text-2xl font-black text-cyan-300">
                        {attempt.score}/{attempt.totalQuestions}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Team Weaknesses
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Most common weak topics
            </h2>

            {topWeakTopics.length === 0 ? (
              <EmptyState
                title="No weak topics yet"
                body="Weak topics will appear after students miss tagged questions."
              />
            ) : (
              <div className="mt-5 grid gap-3">
                {topWeakTopics.map(([topic, count], index) => (
                  <div
                    key={topic}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                          Rank {index + 1}
                        </p>
                        <h3 className="mt-1 break-words font-black text-white">
                          {topic}
                        </h3>
                      </div>

                      <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs font-black text-rose-300">
                        {count} miss{count === 1 ? "" : "es"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Event Summary
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Practice by event
            </h2>

            {summaries.length === 0 ? (
              <EmptyState
                title="No event summaries yet"
                body="Event-level summaries appear once quiz attempts are submitted."
              />
            ) : (
              <div className="mt-5 grid gap-3">
                {summaries.map((summary) => (
                  <article
                    key={summary.eventId}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words font-black text-white">
                          {getEventName(events, summary.eventId)}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-400">
                          {summary.attempts} attempt
                          {summary.attempts === 1 ? "" : "s"} • Average{" "}
                          {summary.averagePercent}%
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-300">
                        {summary.averagePercent}%
                      </span>
                    </div>

                    {summary.mostCommonWeakTopics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {summary.mostCommonWeakTopics.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-xs font-bold text-zinc-400"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="mt-3 break-words text-4xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{detail}</p>
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-6 text-center">
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
    </div>
  );
}
