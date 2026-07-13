import Link from "next/link";
import { ChevronDown, Medal, Trophy, UsersRound } from "lucide-react";
import type { TournamentResultInsights } from "@/lib/types";
import { searchAnchor } from "@/lib/search-utils";
import { formatNumber } from "@/lib/utils";

interface TournamentInsightsPanelProps {
  insights: TournamentResultInsights;
}

function placementLabel(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function TournamentInsightsPanel({ insights }: TournamentInsightsPanelProps) {
  const events = insights.eventSummaries.slice(0, 4);
  const partnerships = insights.partnershipSummaries.slice(0, 4);

  if (insights.uniqueResultCount === 0) return null;

  return (
    <details open className="group/disclosure overflow-hidden rounded-md border border-court-line bg-court-panel shadow-sm" aria-labelledby="tournament-insights-heading">
      <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 p-4 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400 sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-cyan-300">
            <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
            Tournament results
          </div>
          <h2 id="tournament-insights-heading" className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            Best events and partnerships
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            {formatNumber(insights.uniqueResultCount)} unique event result{insights.uniqueResultCount === 1 ? "" : "s"}; partner credits from the same result are counted once here.
          </p>
        </div>
        <span className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-court-line px-3 text-sm font-medium text-zinc-600 transition-colors group-open/disclosure:text-white">
          <span className="hidden sm:inline">Result details</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open/disclosure:rotate-180" aria-hidden="true" />
        </span>
      </summary>

      <div className="grid min-w-0 gap-0 border-t border-court-line lg:grid-cols-2">
        <div className="min-w-0 p-4 sm:p-5 lg:border-r lg:border-court-line">
          <div className="mb-3 flex items-center gap-2">
            <Medal className="h-4 w-4 text-amber-200" aria-hidden="true" />
            <h3 className="font-semibold text-white">Best event results</h3>
          </div>
          {events.length > 0 ? (
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {events.map((event) => (
                <Link key={event.eventId} href={`/resources/${searchAnchor(event.eventName)}`} className="group min-w-0 rounded-md border border-court-line bg-court-elevated p-3 transition-colors hover:border-cyan-400">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{event.category}</div>
                      <div className="mt-0.5 break-words font-semibold leading-5 text-white group-hover:text-cyan-300">{event.eventName}</div>
                    </div>
                    <div className="shrink-0 rounded bg-cyan-400/10 px-2 py-1 text-xs font-semibold tabular-nums text-cyan-300">
                      best #{event.bestFinish}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div><div className="text-zinc-500">Avg.</div><div className="mt-0.5 font-semibold tabular-nums text-white">#{placementLabel(event.avgPlacement)}</div></div>
                    <div><div className="text-zinc-500">Medals</div><div className="mt-0.5 font-semibold tabular-nums text-amber-200">{event.medals}</div></div>
                    <div><div className="text-zinc-500">Results</div><div className="mt-0.5 font-semibold tabular-nums text-white">{event.resultCount}</div></div>
                  </div>
                  <div className="mt-2 break-words text-xs leading-5 text-zinc-500">
                    Team {event.teamDesignations.join(", ") || "—"} · {event.participantNames.length} competitor{event.participantNames.length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-2 text-xs font-medium text-cyan-300">Open event library →</div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-court-line p-4 text-sm text-zinc-500">No event results have been matched yet.</p>
          )}
        </div>

        <div className="min-w-0 border-t border-court-line p-4 sm:p-5 lg:border-t-0">
          <div className="mb-3 flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            <h3 className="font-semibold text-white">Top partnerships</h3>
          </div>
          {partnerships.length > 0 ? (
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              {partnerships.map((partnership) => {
                const partnershipKey = partnership.participantNames.map((name) => name.toLowerCase()).join("|");
                return (
                  <article key={partnershipKey} className="min-w-0 rounded-md border border-court-line bg-court-elevated p-3">
                    <div className="flex flex-wrap gap-x-1 break-words font-semibold leading-5 text-white">
                      {partnership.participantNames.map((name, index) => (
                        <span key={`${partnership.participantIds[index] ?? name}-${index}`}>
                          {index > 0 ? <span className="mr-1 text-zinc-500">+</span> : null}
                          {partnership.participantIds[index] ? <Link href={`/profile/${partnership.participantIds[index]}`} className="hover:text-cyan-300">{name}</Link> : name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 break-words text-xs leading-5 text-zinc-500">
                      {partnership.eventNames.join(", ") || "Event unavailable"}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div><div className="text-zinc-500">Best</div><div className="mt-0.5 font-semibold tabular-nums text-cyan-300">#{partnership.bestFinish}</div></div>
                      <div><div className="text-zinc-500">Avg.</div><div className="mt-0.5 font-semibold tabular-nums text-white">#{placementLabel(partnership.avgPlacement)}</div></div>
                      <div><div className="text-zinc-500">Medals</div><div className="mt-0.5 font-semibold tabular-nums text-amber-200">{partnership.medals}</div></div>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {partnership.resultCount} result{partnership.resultCount === 1 ? "" : "s"} across {partnership.tournamentCount} tournament{partnership.tournamentCount === 1 ? "" : "s"}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-court-line p-4">
              <p className="text-sm font-medium text-white">No partnerships recorded yet</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">When an import matches two or more teammates to the same event result, their partnership will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
