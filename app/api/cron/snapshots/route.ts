import { NextResponse } from "next/server";
import { mockStudents } from "@/lib/seed";
import { invalidateAnalyticsCache } from "@/lib/analytics-cache";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (hasSupabaseConfig() && !secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured." }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron request." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  let studentsProcessed = mockStudents.length;
  if (supabase) {
    const { data, error } = await supabase.rpc("create_weekly_ovr_snapshots");
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    studentsProcessed = typeof data === "number" ? data : 0;
    invalidateAnalyticsCache();
  }

  return NextResponse.json({
    ok: true,
    message: supabase ? "Weekly snapshots created." : "Demo snapshot job completed.",
    studentsProcessed
  });
}

export async function GET(request: Request) {
  return POST(request);
}
