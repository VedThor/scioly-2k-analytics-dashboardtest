import { NextResponse } from "next/server";
import { getAuthenticatedStudent } from "@/lib/auth";
import { getSupabaseAdmin, isDemoMode } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getAuthenticatedStudent();
  if (!currentUser && !isDemoMode()) {
    return NextResponse.json({ ok: false, error: "Sign in before checking updates." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: true, version: "demo" }, { headers: { "cache-control": "private, no-store" } });
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id,created_at")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: "Could not check for updates." }, { status: 500 });

  return NextResponse.json(
    { ok: true, version: data ? `${String(data.id)}:${String(data.created_at)}` : "empty" },
    { headers: { "cache-control": "private, no-store" } }
  );
}
