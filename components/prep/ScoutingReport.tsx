import type { QuizAttempt, ResourceItem, ScoutingReport as ScoutingReportType } from "@/lib/prep-types";
import { getRecommendedResources } from "@/lib/practice-utils";
import type { QuizQuestion } from "@/lib/prep-types";

type ScoutingReportProps = {
  report: ScoutingReportType;
  eventId: string;
  attempts: QuizAttempt[];
  questions: QuizQuestion[];
  resources: ResourceItem[];
};

function getLatestAttemptForEvent(attempts: QuizAttempt[], eventId: string) {
  return attempts
    .filter((attempt) => attempt.eventId === eventId)
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];
}

export function ScoutingReport({
  report,
  eventId,
  attempts,
  questions,
  resources,
}: ScoutingReportProps) {
  const latestAttempt = getLatestAttemptForEvent(attempts, eventId);

  const recommendedResources = latestAttempt
    ? getRecommendedResources({
        weakTopics: latestAttempt.weakTopics,
        questions: questions.filter((question) => question.eventId === eventId),
        resources,
      })
    : [];

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          Scouting Report
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">
          What actually moves the score
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          This combines officer guidance with quiz performance. Once students
          practice, weak topics and next resources become more specific.
        </p>
      </div>

      {latestAttempt ? (
        <div className="mb-5 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
                Latest self-quiz result
              </p>
              <h3 className="mt-1 text-xl font-black text-white">
                {latestAttempt.score}/{latestAttempt.totalQuestions} •{" "}
                {latestAttempt.percent}%
              </h3>
            </div>

            <div className="rounded-full border border-cyan-400/40 bg-zinc-950 px-4 py-2 text-sm font-black text-cyan-300">
              {latestAttempt.studentName}
            </div>
          </div>

          {latestAttempt.weakTopics.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-zinc-400">
                Weak topics from quiz
              </p>
              <div className="flex flex-wrap gap-2">
                {latestAttempt.weakTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm font-bold text-emerald-300">
              No weak topics recorded from the latest attempt.
            </p>
          )}
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-sm leading-6 text-zinc-400">
            No quiz attempts yet. Once a student completes the practice queue,
            this report can show weak topics and recommended next resources.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h3 className="font-black text-white">Common mistakes</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
            {report.commonMistakes.map((mistake) => (
              <li key={mistake}>• {mistake}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h3 className="font-black text-white">Medalist habits</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
            {report.medalistHabits.map((habit) => (
              <li key={habit}>• {habit}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h3 className="font-black text-white">High-value skills</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
            {report.highValueSkills.map((skill) => (
              <li key={skill}>• {skill}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
          Recommended next move
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          {latestAttempt?.weakTopics.length
            ? `Review ${latestAttempt.weakTopics[0]} first, then retake a short quiz.`
            : report.defaultNextMove}
        </p>

        {recommendedResources.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {recommendedResources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                className="max-w-full truncate rounded-full border border-emerald-400/40 bg-zinc-950 px-3 py-1 text-xs font-bold text-emerald-300 hover:border-white"
              >
                {resource.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
