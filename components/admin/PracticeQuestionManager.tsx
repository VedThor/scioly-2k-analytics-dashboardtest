"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { PracticeQuestionMutationResponse, PracticeQuestionType, PracticeTestQuestion } from "@/lib/practice-types";
import { cn } from "@/lib/utils";

interface TestInfo {
  id: number;
  title: string;
  eventName: string;
  eventSlug: string;
}

interface FormState {
  id?: number;
  type: PracticeQuestionType;
  prompt: string;
  options: string[];
  correctOption: number;
  modelAnswer: string;
  explanation: string;
  points: number;
  position: number;
  isActive: boolean;
  updatedAt?: string;
}

function blank(position: number): FormState {
  return { type: "mcq", prompt: "", options: ["", "", "", ""], correctOption: 0, modelAnswer: "", explanation: "", points: 1, position, isActive: true };
}

function fromQuestion(question: PracticeTestQuestion): FormState {
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    options: question.type === "mcq" ? question.options : ["", "", "", ""],
    correctOption: question.correctOption ?? 0,
    modelAnswer: question.modelAnswer ?? "",
    explanation: question.explanation ?? "",
    points: question.points,
    position: question.position,
    isActive: question.isActive,
    updatedAt: question.updatedAt,
  };
}

function requestBody(testId: number, form: FormState) {
  return { id: form.id, testId, type: form.type, prompt: form.prompt, options: form.type === "mcq" ? form.options : [], correctOption: form.type === "mcq" ? form.correctOption : undefined, modelAnswer: form.type === "frq" ? form.modelAnswer : undefined, explanation: form.explanation, points: form.points, position: form.position, isActive: form.isActive, updatedAt: form.updatedAt };
}

export function PracticeQuestionManager({ test, initialQuestions }: { test: TestInfo; initialQuestions: PracticeTestQuestion[] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const nextPosition = useMemo(() => Math.max(-1, ...questions.map((question) => question.position)) + 1, [questions]);
  const [form, setForm] = useState<FormState>(() => blank(Math.max(-1, ...initialQuestions.map((question) => question.position)) + 1));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setForm(blank(nextPosition));
    setError(null);
  }

  function updateOption(index: number, value: string) {
    setForm((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? value : option) }));
  }

  function persist(next: FormState) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/practice-questions", { method: next.id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody(test.id, next)) });
        const payload = await response.json() as PracticeQuestionMutationResponse;
        if (!response.ok || !payload.ok || !payload.question) throw new Error(payload.error ?? "Could not save this question.");
        setQuestions((current) => next.id ? current.map((question) => question.id === payload.question?.id ? payload.question : question) : [...current, payload.question!]);
        setMessage(payload.message ?? "Question saved.");
        setForm(blank(Math.max(nextPosition, payload.question.position + 1)));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save this question.");
      }
    });
  }

  function remove(question: PracticeTestQuestion) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/practice-questions", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: question.id, updatedAt: question.updatedAt }) });
        const payload = await response.json() as PracticeQuestionMutationResponse;
        if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Could not remove this question.");
        setQuestions((current) => current.map((entry) => entry.id === question.id ? payload.question ?? { ...entry, isActive: false, updatedAt: new Date().toISOString() } : entry));
        if (form.id === question.id) reset();
        setMessage(payload.message ?? "Question removed.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not remove this question.");
      }
    });
  }

  const ordered = [...questions].sort((left, right) => left.position - right.position || left.id - right.id);

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/library" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-cyan-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to library</Link>
        <Link href={`/practice/tests/${test.id}`} className="inline-flex min-h-11 items-center rounded-md border border-court-line px-4 text-sm font-medium text-zinc-600 hover:border-cyan-400 hover:text-white">Preview test</Link>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-md border border-court-line bg-court-panel p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm font-medium text-cyan-300">{test.eventName}</p><h2 className="mt-1 text-xl font-semibold text-white">{form.id ? "Edit question" : "Add a question"}</h2></div>
            {form.id ? <button type="button" onClick={reset} className="grid h-11 w-11 place-items-center rounded-md border border-court-line text-zinc-500 hover:text-white" aria-label="Cancel editing"><X className="h-4 w-4" /></button> : null}
          </div>

          <div className="mt-5 grid min-w-0 gap-4">
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Question type">
              {(["mcq", "frq"] as const).map((type) => <button key={type} type="button" onClick={() => setForm((current) => ({ ...current, type }))} className={cn("min-h-11 rounded-md border px-3 text-sm font-semibold", form.type === type ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-court-line text-zinc-500")}>{type === "mcq" ? "Multiple choice" : "Free response"}</button>)}
            </div>
            <label className="grid gap-2 text-sm font-medium text-zinc-600">Question<textarea rows={5} maxLength={8000} value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} className="min-w-0 resize-y rounded-md border border-court-control bg-court-panel p-3 text-white outline-none focus:border-cyan-400" /></label>

            {form.type === "mcq" ? (
              <fieldset className="grid gap-3">
                <legend className="text-sm font-medium text-zinc-600">Choices <span className="font-normal text-zinc-500">(select the correct one)</span></legend>
                {form.options.map((option, index) => (
                  <div key={index} className="flex min-w-0 items-center gap-2">
                    <input type="radio" name="correct-option" checked={form.correctOption === index} onChange={() => setForm({ ...form, correctOption: index })} className="h-4 w-4 shrink-0 accent-cyan-400" aria-label={`Mark choice ${index + 1} correct`} />
                    <input value={option} maxLength={1000} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Choice ${index + 1}`} className="h-11 min-w-0 flex-1 rounded-md border border-court-control bg-court-panel px-3 text-white outline-none focus:border-cyan-400" />
                    {form.options.length > 2 ? <button type="button" onClick={() => setForm((current) => ({ ...current, options: current.options.filter((_, optionIndex) => optionIndex !== index), correctOption: current.correctOption === index ? 0 : current.correctOption > index ? current.correctOption - 1 : current.correctOption }))} className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-red-300 hover:bg-red-300/10" aria-label={`Remove choice ${index + 1}`}><Trash2 className="h-4 w-4" /></button> : null}
                  </div>
                ))}
                {form.options.length < 6 ? <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ""] })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-dashed border-court-control text-sm font-medium text-cyan-300"><Plus className="h-4 w-4" /> Add choice</button> : null}
              </fieldset>
            ) : (
              <label className="grid gap-2 text-sm font-medium text-zinc-600">Model answer<textarea rows={6} maxLength={12000} value={form.modelAnswer} onChange={(event) => setForm({ ...form, modelAnswer: event.target.value })} placeholder="A strong answer members can compare with their response after submitting" className="min-w-0 resize-y rounded-md border border-court-control bg-court-panel p-3 text-white outline-none focus:border-cyan-400" /></label>
            )}

            <label className="grid gap-2 text-sm font-medium text-zinc-600">Explanation <span className="font-normal text-zinc-500">(shown after submission)</span><textarea rows={4} maxLength={12000} value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} className="min-w-0 resize-y rounded-md border border-court-control bg-court-panel p-3 text-white outline-none focus:border-cyan-400" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-zinc-600">Points<input type="number" min={1} max={100} value={form.points} onChange={(event) => setForm({ ...form, points: Number(event.target.value) })} className="h-11 rounded-md border border-court-control bg-court-panel px-3 text-white" /></label>
              <label className="grid gap-2 text-sm font-medium text-zinc-600">Order<input type="number" min={0} max={1000} value={form.position} onChange={(event) => setForm({ ...form, position: Number(event.target.value) })} className="h-11 rounded-md border border-court-control bg-court-panel px-3 text-white" /></label>
            </div>
          </div>

          <button type="button" disabled={isPending || !form.prompt.trim() || (form.type === "frq" && !form.modelAnswer.trim()) || (form.type === "mcq" && form.options.some((option) => !option.trim()))} onClick={() => persist(form)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black hover:bg-cyan-200 disabled:border disabled:border-court-line disabled:bg-court-elevated disabled:text-zinc-500">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{form.id ? "Save question" : "Add question"}</button>
          {message ? <p role="status" className="mt-3 rounded-md border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm text-emerald-300">{message}</p> : null}
          {error ? <p role="alert" className="mt-3 rounded-md border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-300">{error}</p> : null}
        </section>

        <section className="min-w-0 overflow-hidden rounded-md border border-court-line bg-court-panel">
          <div className="border-b border-court-line p-4 sm:p-5"><h2 className="text-xl font-semibold text-white">{test.title}</h2><p className="mt-1 text-sm text-zinc-500">{ordered.filter((question) => question.isActive).length} active questions · MCQs score automatically; free responses use model-answer self-review.</p></div>
          <div className="grid gap-3 p-4 sm:p-5">
            {ordered.map((question, index) => (
              <article key={question.id} className={cn("min-w-0 rounded-md border p-4", question.isActive ? "border-court-line bg-court-elevated" : "border-red-300/30 bg-red-300/5")}>
                <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium uppercase text-cyan-300">Question {index + 1} · {question.type.toUpperCase()} · {question.points} pt{question.points === 1 ? "" : "s"}</p><h3 className="mt-2 break-words font-semibold leading-6 text-white">{question.prompt}</h3></div><span className={cn("shrink-0 rounded-full px-2 py-1 text-xs", question.isActive ? "bg-emerald-300/10 text-emerald-300" : "bg-red-300/10 text-red-300")}>{question.isActive ? "Active" : "Removed"}</span></div>
                {question.type === "mcq" ? <div className="mt-3 grid gap-1 text-sm text-zinc-500">{question.options.map((option, optionIndex) => <div key={optionIndex} className={cn("flex gap-2", optionIndex === question.correctOption && "text-emerald-300")}><span>{String.fromCharCode(65 + optionIndex)}.</span><span className="break-words">{option}</span>{optionIndex === question.correctOption ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}</div>)}</div> : <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-500">Model: {question.modelAnswer}</p>}
                <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => { setForm(fromQuestion(question)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-court-line px-3 text-xs font-medium text-zinc-600 hover:border-cyan-400 hover:text-white"><Pencil className="h-3.5 w-3.5" /> Edit</button>{question.isActive ? <button type="button" disabled={isPending} onClick={() => remove(question)} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium text-red-300 hover:bg-red-300/10"><Trash2 className="h-3.5 w-3.5" /> Remove</button> : <button type="button" disabled={isPending} onClick={() => persist({ ...fromQuestion(question), isActive: true })} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-300/10 px-3 text-xs font-medium text-emerald-300"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>}</div>
              </article>
            ))}
            {ordered.length === 0 ? <div className="rounded-md border border-dashed border-court-control px-5 py-12 text-center"><p className="font-medium text-white">No questions yet</p><p className="mt-1 text-sm text-zinc-500">Add the first MCQ or free-response question using the editor.</p></div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
