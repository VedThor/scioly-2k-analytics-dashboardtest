import { NextResponse } from "next/server";
import { getCurrentDemoUser } from "@/lib/analytics";
import { buildAdminReport, adminReportCsv, adminReportFilename } from "@/lib/admin-reports";
import { getAuthenticatedStudent } from "@/lib/auth";
import { isDemoMode } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const currentUser = (await getAuthenticatedStudent()) ?? (isDemoMode() ? getCurrentDemoUser() : null);
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Sign in before generating reports." }, { status: 401 });
  }
  if (currentUser.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only admins can generate full team reports." }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const report = await buildAdminReport({
      type: url.searchParams.get("type") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      student: url.searchParams.get("student") ?? undefined,
      team: url.searchParams.get("team") ?? undefined
    });

    if (url.searchParams.get("format") === "csv") {
      return new NextResponse(`\uFEFF${adminReportCsv(report)}`, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${adminReportFilename(report)}"`,
          "cache-control": "private, no-store"
        }
      });
    }

    return NextResponse.json(
      { ok: true, report },
      { headers: { "cache-control": "private, no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not generate this report." },
      { status: 500 }
    );
  }
}
