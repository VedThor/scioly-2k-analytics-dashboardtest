import { NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/app-url";
import { getSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { ok: false, error: "Google sign-in requires Supabase configuration." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { next?: string };
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Auth client unavailable." }, { status: 500 });
  }

  // OAuth's PKCE verifier is stored in a cookie on the host that starts the
  // flow. Keep the callback on that same host so custom domains and preview
  // deployments can exchange the returned code successfully.
  const origin = new URL(request.url).origin;
  const next = safeInternalPath(body.next);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo
    }
  });

  if (error || !data.url) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Could not start Google sign-in." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, redirectTo: data.url });
}
