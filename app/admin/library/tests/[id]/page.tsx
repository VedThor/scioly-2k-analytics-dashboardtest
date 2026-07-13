import { notFound } from "next/navigation";
import { PracticeQuestionManager } from "@/components/admin/PracticeQuestionManager";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/data";
import { getPracticeQuestions, getPracticeTestRecord } from "@/lib/practice-data";

export const dynamic = "force-dynamic";

export default async function PracticeQuestionEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const testId = Number(id);
  if (!Number.isInteger(testId) || testId <= 0) notFound();
  const [currentUser, test, questions] = await Promise.all([
    requireRole("officer"),
    getPracticeTestRecord(testId, true),
    getPracticeQuestions(testId, true),
  ]);
  if (!test) notFound();

  return (
    <AppShell currentUser={currentUser}>
      <div className="min-w-0 space-y-6">
        <PageHeader label="Officer tools · Interactive practice" title={test.title} description="Build the test members take on the site. Multiple-choice questions score automatically; free-response questions reveal a model answer for structured self-review." />
        <PracticeQuestionManager test={test} initialQuestions={questions} />
      </div>
    </AppShell>
  );
}
