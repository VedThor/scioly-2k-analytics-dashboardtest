import type { ResourceItem } from "@/lib/prep-types";

type ResourceLockerProps = {
  resources: ResourceItem[];
};

const typeStyles: Record<string, string> = {
  Rules: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  Notes: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  "Cheat Sheet": "border-amber-400/40 bg-amber-400/10 text-amber-300",
  "Study Guide": "border-violet-400/40 bg-violet-400/10 text-violet-300",
  Practice: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300",
  Test: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  "Build Guide": "border-orange-400/40 bg-orange-400/10 text-orange-300",
};

export function ResourceLocker({ resources }: ResourceLockerProps) {
  const featured = resources.filter((resource) => resource.featured);
  const normalResources = resources.filter((resource) => !resource.featured);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Resource Locker
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Notes, cheat sheets, guides, and links
          </h2>
        </div>

        <p className="text-sm font-bold text-zinc-500">
          {resources.length} resource{resources.length === 1 ? "" : "s"}
        </p>
      </div>

      {featured.length > 0 && (
        <div className="mb-5">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-zinc-500">
            Featured
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} featured />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {normalResources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>

      {resources.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-6 text-center">
          <p className="font-black text-white">No resources yet</p>
          <p className="mt-2 text-sm text-zinc-400">
            Admins can add notes, links, cheat sheets, and tests later.
          </p>
        </div>
      )}
    </section>
  );
}

function ResourceCard({
  resource,
  featured = false,
}: {
  resource: ResourceItem;
  featured?: boolean;
}) {
  const style =
    typeStyles[resource.type] ??
    "border-zinc-700 bg-zinc-900 text-zinc-300";

  return (
    <a
      href={resource.url}
      className={`block min-w-0 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-cyan-400 ${
        featured
          ? "border-cyan-400/40 bg-cyan-400/10"
          : "border-zinc-800 bg-zinc-900/70"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${style}`}
        >
          {resource.type}
        </span>

        {resource.featured && (
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-300">
            Featured
          </span>
        )}
      </div>

      <h3 className="break-words text-lg font-black text-white">
        {resource.title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-zinc-400">
        {resource.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {resource.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-bold text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
}
