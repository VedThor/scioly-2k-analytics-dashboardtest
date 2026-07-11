import { NextResponse } from "next/server";
import { parseTournamentInput, placementScoresForPreview } from "@/lib/tournament-import";
import { getAuthenticatedStudent } from "@/lib/auth";
import { getCurrentDemoUser } from "@/lib/analytics";
import { schoolName } from "@/lib/seed";
import { getSupabaseAdmin, isDemoMode } from "@/lib/supabase";
import type { TournamentSourceType } from "@/lib/types";
import { normalizeName, roleMeets } from "@/lib/utils";

export const dynamic = "force-dynamic";

function schoolMatchesTracker(value: string) {
  const clean = (name: string) => normalizeName(name.replace(/\s+(team\s*)?[a-c]$/i, "").trim());
  const candidate = clean(value);
  const aliases = [
    schoolName,
    ...(process.env.TRACKED_SCHOOL_ALIASES ?? "")
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean)
  ].map(clean);

  return aliases.some(
    (alias) => candidate === alias || (alias.length >= 8 && candidate.includes(alias)) || (candidate.length >= 8 && alias.includes(candidate))
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    rawInput?: string;
    commit?: boolean;
    mode?: TournamentSourceType;
    tournamentName?: string;
    date?: string;
    medalCutoff?: number;
    participationPoints?: number;
  };

  if (!body.rawInput?.trim()) {
    return NextResponse.json({ ok: false, error: "Tournament input is required." }, { status: 400 });
  }

  const authenticatedUser = await getAuthenticatedStudent();
  const currentUser = authenticatedUser ?? (isDemoMode() ? getCurrentDemoUser() : null);

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Sign in before importing tournaments." }, { status: 401 });
  }
  const mode = body.mode === "manual" ? "manual" : "duosmium_csv";

  if (mode === "manual" && currentUser.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Manual tournament dumps are admin-only." }, { status: 403 });
  }

  if (body.commit && !roleMeets(currentUser.role, "officer")) {
    return NextResponse.json({ ok: false, error: "Tournament commits require officer access." }, { status: 403 });
  }

  const preview = await parseTournamentInput(body.rawInput, {
    mode,
    tournamentName: body.tournamentName,
    date: body.date,
    medalCutoff: body.medalCutoff,
    participationPoints: body.participationPoints
  });

  if (!body.commit) {
    return NextResponse.json({
      ok: true,
      preview,
      message: "Preview ready. Review missing fields and ambiguous names before committing."
    });
  }

  if (preview.missingFields.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        preview,
        error: "Commit blocked until required fields are complete."
      },
      { status: 422 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const localPerformances = placementScoresForPreview(preview).filter((performance) =>
      schoolMatchesTracker(performance.schoolName)
    );
    if (localPerformances.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          preview,
          error: `No rows matched ${schoolName}. Add an exact school alias with TRACKED_SCHOOL_ALIASES if the CSV uses a different name.`
        },
        { status: 422 }
      );
    }

    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert({
        name: preview.tournamentName,
        date: preview.date,
        avg_scioly_elo: preview.avgSciolyElo,
        sos_multiplier: preview.sosMultiplier,
        benchmark_school: preview.benchmarkComparison.benchmarkSchool,
        benchmark_elo: preview.benchmarkComparison.benchmarkElo,
        benchmark_source: preview.benchmarkComparison.source,
        relative_difficulty_multiplier: preview.benchmarkComparison.relativeDifficultyMultiplier,
        attending_schools: preview.attendingSchools,
        medal_cutoff: preview.medalCutoff,
        participation_points: preview.participationPoints,
        source_type: preview.sourceType
      })
      .select("id")
      .single();

    if (tournamentError) {
      return NextResponse.json({ ok: false, preview, error: tournamentError.message }, { status: 500 });
    }

    const { data: existingStudents, error: studentLoadError } = await supabase
      .from("students")
      .select("id,name");
    if (studentLoadError) {
      await supabase.from("tournaments").delete().eq("id", tournament.id);
      return NextResponse.json({ ok: false, preview, error: studentLoadError.message }, { status: 500 });
    }

    const studentsByName = new Map<string, Array<{ id: string; name: string }>>();
    for (const student of existingStudents ?? []) {
      const key = normalizeName(student.name);
      studentsByName.set(key, [...(studentsByName.get(key) ?? []), student]);
    }
    for (const performance of localPerformances) {
      const { data: event, error: eventError } = await supabase
        .from("events")
        .upsert({ name: performance.eventName, category: performance.category }, { onConflict: "name" })
        .select("id")
        .single();

      if (eventError || !event) {
        await supabase.from("tournaments").delete().eq("id", tournament.id);
        return NextResponse.json(
          { ok: false, preview, error: eventError?.message ?? `Could not create ${performance.eventName}.` },
          { status: 500 }
        );
      }

      for (const studentName of performance.studentNames) {
        const normalizedStudentName = normalizeName(studentName);
        const matches = studentsByName.get(normalizedStudentName) ?? [];
        if (matches.length > 1) {
          await supabase.from("tournaments").delete().eq("id", tournament.id);
          return NextResponse.json(
            { ok: false, preview, error: `Multiple roster members are named ${studentName}; resolve the duplicate before importing.` },
            { status: 409 }
          );
        }

        const studentId = matches[0]?.id;
        if (!studentId) {
          await supabase.from("tournaments").delete().eq("id", tournament.id);
          return NextResponse.json(
            {
              ok: false,
              preview,
              error: `No roster account matched ${studentName}. Invite or create that student before importing results.`
            },
            { status: 422 }
          );
        }

        const { error: performanceError } = await supabase.from("performances").upsert(
          {
            student_id: studentId,
            tournament_id: tournament.id,
            event_id: event.id,
            rank: performance.rank,
            placement_score: performance.placementScore,
            participant_names: performance.studentNames,
            is_medal: performance.isMedal,
            medal_cutoff: performance.medalCutoff,
            participation_points: performance.participationPoints,
            medal_points: performance.medalPoints,
            event_points: performance.eventPoints,
            team_designation: performance.teamDesignation
          },
          { onConflict: "student_id,tournament_id,event_id" }
        );
        if (performanceError) {
          await supabase.from("tournaments").delete().eq("id", tournament.id);
          return NextResponse.json({ ok: false, preview, error: performanceError.message }, { status: 500 });
        }
      }
    }

    await supabase.from("audit_logs").insert({
      actor_id: currentUser.id,
      action: "tournament.import",
      target: preview.tournamentName,
      reason: preview.sourceType === "manual" ? "Manual tournament dump committed" : "Duosmium CSV committed",
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      entity_table: "tournaments",
      entity_id: String(tournament.id),
      payload_after: preview,
      undo_action: "tournament.delete",
      is_reversible: true
    });
  }

  return NextResponse.json({
    ok: true,
    preview,
    message: supabase
      ? "Tournament committed. Database triggers will recalculate OVR and teams."
      : "Demo commit complete. Add Supabase credentials to persist imports."
  });
}
