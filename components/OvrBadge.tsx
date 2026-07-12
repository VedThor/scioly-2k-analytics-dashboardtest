import { getRatingTier } from "@/lib/rating";
import { cn } from "@/lib/utils";

interface OvrBadgeProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showTier?: boolean;
}

const sizes = {
  sm: "min-w-11 px-2 py-1 text-sm",
  md: "min-w-12 px-2.5 py-1.5 text-base",
  lg: "min-w-20 px-4 py-2.5 text-3xl"
};

export function OvrBadge({ value, size = "md", showTier = false }: OvrBadgeProps) {
  const tier = getRatingTier(value);

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md border font-semibold tabular-nums leading-none",
          sizes[size],
          tier.className
        )}
        title={tier.name}
      >
        {Math.round(value)}
      </span>
      {showTier ? (
        <span className="hidden text-xs font-medium text-zinc-500 sm:inline">{tier.name}</span>
      ) : null}
    </div>
  );
}
