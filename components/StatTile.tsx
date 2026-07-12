import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <div className="rounded-md border border-court-line bg-court-panel p-4 shadow-sm">
      <div className="text-sm font-medium text-zinc-500">{label}</div>
      <div className="mt-2 min-h-9 text-2xl font-semibold tabular-nums text-white">{value}</div>
      {detail ? <div className="mt-1 text-xs leading-5 text-zinc-500">{detail}</div> : null}
    </div>
  );
}
