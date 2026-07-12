import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { getCurrentUser } from "@/lib/data";
import { getAllPracticeQuestions, getAllPracticeTests } from "@/lib/resource-data";

export default async function PracticePage() {
  const currentUser = await getCurrentUser();
  const questions = getAllPracticeQuestions();
  const tests = getAllPracticeTests();

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <PageHeader
          label="Preparation"
          title="Practice library"
          description="Find questions and practice tests across all active events. Open an event to see answers, explanations, and related resources."
        />
        <section className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Questions" value={questions.length} detail="Topic checks" />
          <StatTile label="Practice tests" value={tests.length} detail="Mini, full, and testoff sets" />
          <StatTile label="Events covered" value={new Set(questions.map((question) => question.eventSlug)).size} detail="Active event libraries" />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-md border border-court-line bg-court-panel p-5 md:p-6">
            <div className="text-sm font-medium text-cyan-300">Questions</div>
            <h2 className="mt-1 text-xl font-semibold text-white">Topic practice</h2>
            <div className="mt-5 space-y-4">
              {questions.map((question) => (
                <Link
                  key={`${question.eventSlug}-${question.question}`}
                  href={`/resources/${question.eventSlug}`}
                  className="block rounded-md border border-court-line bg-court-elevated p-4 transition hover:border-cyan-400/70"
                >
                  <div className="text-[11px] font-black uppercase text-cyan-300">
                    {question.eventName} / {question.topic} / {question.difficulty}
                  </div>
                  <p className="mt-2 font-black text-white">{question.question}</p>
                  <p className="mt-3 text-sm text-zinc-500">Open event hub for answer explanation →</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-court-line bg-court-panel p-5 md:p-6">
            <div className="text-sm font-medium text-cyan-300">Tests</div>
            <h2 className="mt-1 text-xl font-semibold text-white">Practice tests</h2>
            <div className="mt-5 space-y-4">
              {tests.map((test) => (
                <Link
                  key={`${test.eventSlug}-${test.title}`}
                  href={`/resources/${test.eventSlug}`}
                  className="block rounded-md border border-court-line bg-court-elevated p-4 transition hover:border-fuchsia-400/70"
                >
                  <div className="text-[11px] font-black uppercase text-fuchsia-300">
                    {test.eventName} / {test.format} / {test.difficulty}
                  </div>
                  <h3 className="mt-2 text-lg font-black text-white">{test.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{test.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
