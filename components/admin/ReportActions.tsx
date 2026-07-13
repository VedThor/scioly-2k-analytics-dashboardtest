"use client";

import { Download, Printer } from "lucide-react";

export function ReportActions({ csvHref }: { csvHref: string }) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <a
        href={csvHref}
        download
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-court-line bg-court-panel px-4 text-sm font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-300"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download CSV
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-cyan-200"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        Print report
      </button>
    </div>
  );
}
