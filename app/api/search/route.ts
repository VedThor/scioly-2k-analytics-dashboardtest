import { NextResponse } from "next/server";
import { getCurrentDemoUser } from "@/lib/analytics";
import { getAuthenticatedStudent } from "@/lib/auth";
import { getSearchDirectory } from "@/lib/search-directory";
import { getLibraryEvents } from "@/lib/library-data";
import { searchDirectoryContent, searchResourceContent } from "@/lib/search-index";
import { pageSearchCandidatesForUser } from "@/lib/search-pages";
import type { SearchResponse } from "@/lib/search-types";
import { normalizeSearchText, scoreSearchCandidate } from "@/lib/search-utils";
import { isDemoMode } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const currentUser = (await getAuthenticatedStudent()) ?? (isDemoMode() ? getCurrentDemoUser() : null);
  if (!currentUser) {
    return NextResponse.json<SearchResponse>(
      { ok: false, query: "", results: [], error: "Sign in before searching." },
      { status: 401, headers: { "cache-control": "private, no-store" } }
    );
  }

  const rawQuery = new URL(request.url).searchParams.get("q") ?? "";
  const query = normalizeSearchText(rawQuery).slice(0, 64);
  if (query.length < 2) {
    return NextResponse.json<SearchResponse>(
      { ok: true, query, results: [] },
      { headers: { "cache-control": "private, no-store" } }
    );
  }

  try {
    const pageResults = pageSearchCandidatesForUser(currentUser.role, currentUser.id)
      .map((candidate) => ({ ...candidate, score: scoreSearchCandidate(candidate, query) }))
      .filter((candidate) => candidate.score > 0)
      .map(({ keywords: _keywords, minimumRole: _minimumRole, quickRank: _quickRank, ...result }) => result);
    let directoryResults: ReturnType<typeof searchDirectoryContent> = [];
    const libraryEvents = await getLibraryEvents();
    try {
      directoryResults = searchDirectoryContent(await getSearchDirectory(), query);
    } catch {
      directoryResults = [];
    }
    const results = [
      ...pageResults,
      ...directoryResults,
      ...searchResourceContent(query, libraryEvents)
    ]
      .sort((left, right) => (right.score ?? 0) - (left.score ?? 0) || left.title.localeCompare(right.title))
      .slice(0, 20);

    return NextResponse.json<SearchResponse>(
      { ok: true, query, results },
      { headers: { "cache-control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json<SearchResponse>(
      { ok: false, query, results: [], error: "Search could not load team data. Try again." },
      { status: 500, headers: { "cache-control": "private, no-store" } }
    );
  }
}
