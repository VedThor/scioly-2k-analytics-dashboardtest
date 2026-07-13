import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { PracticeTestQuestion } from "@/lib/practice-types";

type DbRow = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function options(value: unknown) {
  return Array.isArray(value)
    ? value.filter((option): option is string => typeof option === "string")
    : [];
}

function missingPracticeSchema(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export function practiceQuestionFromRow(row: DbRow): PracticeTestQuestion {
  const correctOption = row.correct_option === null || row.correct_option === undefined
    ? undefined
    : number(row.correct_option);
  return {
    id: number(row.id),
    testId: number(row.test_id),
    type: row.question_type === "frq" ? "frq" : "mcq",
    prompt: text(row.prompt),
    options: options(row.options),
    correctOption,
    modelAnswer: text(row.model_answer) || undefined,
    explanation: text(row.explanation) || undefined,
    points: number(row.points, 1),
    position: number(row.position),
    isActive: row.is_active !== false,
    createdAt: text(row.created_at, new Date(0).toISOString()),
    updatedAt: text(row.updated_at, new Date(0).toISOString()),
  };
}

export async function getPracticeQuestions(testId: number, includeInactive = false) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  let query = supabase
    .from("practice_test_questions")
    .select("*")
    .eq("test_id", testId)
    .order("position", { ascending: true })
    .order("id", { ascending: true });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  // A pre-migration deployment can still render the existing library. Other
  // failures stay visible instead of masquerading as an empty question set.
  if (missingPracticeSchema(error)) return [];
  if (error) throw new Error(`Could not load practice questions: ${error.message}`);
  return (data ?? []).map((row) => practiceQuestionFromRow(row as DbRow));
}

export async function getPracticeTestRecord(testId: number, includeInactive = false) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  let query = supabase
    .from("library_items")
    .select("id,event_slug,event_name,title,description,difficulty,test_format,body,url,is_active,kind")
    .eq("id", testId)
    .eq("kind", "test");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return {
    id: Number(data.id),
    eventSlug: String(data.event_slug),
    eventName: String(data.event_name),
    title: String(data.title),
    description: typeof data.description === "string" ? data.description : undefined,
    difficulty: typeof data.difficulty === "string" ? data.difficulty : undefined,
    format: typeof data.test_format === "string" ? data.test_format : undefined,
    body: typeof data.body === "string" ? data.body : undefined,
    url: typeof data.url === "string" ? data.url : undefined,
    isActive: data.is_active !== false,
  };
}
