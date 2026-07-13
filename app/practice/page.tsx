import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { PracticeLibrary } from "@/components/practice/PracticeLibrary";
import { StatTile } from "@/components/StatTile";
import { getCurrentUser } from "@/lib/data";
import { getLibraryEvents } from "@/lib/library-data";
import { getAllPracticeQuestions, getAllPracticeTests } from "@/lib/resource-data";

export default async function PracticePage() {
  const [currentUser, events] = await Promise.all([getCurrentUser(), getLibraryEvents()]);
  const questions = getAllPracticeQuestions(events);
  const tests = getAllPracticeTests(events);

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <PageHeader
          label="Preparation"
          title="Practice library"
          description="Find questions and practice tests across all active events. Open an event to see answers, explanations, and related resources."
          actions={currentUser.role === "officer" || currentUser.role === "admin" ? (
            <Link href="/admin/library" className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-black hover:bg-cyan-200">
              Manage practice library
            </Link>
          ) : undefined}
        />
        <section className="grid gap-3 sm:grid-cols-3">
          <StatTile href="#practice-library" label="Questions" value={questions.length} detail="Topic checks" />
          <StatTile href="#practice-library" label="Practice tests" value={tests.length} detail="Mini, full, and testoff sets" />
          <StatTile href="/resources" linkLabel="Open event libraries" label="Events covered" value={new Set(questions.map((question) => question.eventSlug)).size} detail="Active event libraries" />
        </section>

        <PracticeLibrary questions={questions} tests={tests} />
      </div>
    </AppShell>
  );
}
import Link from "next/link";
