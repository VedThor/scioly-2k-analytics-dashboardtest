"use client";

import { Search, Sparkles } from "lucide-react";

export function DashboardSearch() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("scioly:open-search"))}
      className="flex min-h-14 w-full min-w-0 items-center gap-3 rounded-md border border-court-control bg-court-panel px-4 text-left shadow-sm transition hover:border-cyan-400 hover:bg-court-elevated"
      aria-label="Search features, students, events, and resources"
      data-tour="search"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-cyan-400/10 text-cyan-300">
        <Search className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">What do you want to do?</span>
        <span className="mt-0.5 block truncate text-xs text-zinc-500">Search features, students, teams, events, resources, and admin tools</span>
      </span>
      <span className="hidden items-center gap-1.5 text-xs font-medium text-cyan-300 sm:inline-flex">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Search
      </span>
    </button>
  );
}
