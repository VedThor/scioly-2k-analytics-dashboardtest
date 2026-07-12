import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ResourceDirectory } from "@/components/resources/ResourceDirectory";
import { StatTile } from "@/components/StatTile";
import { getCurrentUser } from "@/lib/data";
import { getFeaturedResources, getResourceStats, resourceAnnouncements, sciolyEvents } from "@/lib/resource-data";

export default async function ResourcesPage() {
  const currentUser = await getCurrentUser();
  const stats = getResourceStats();
  const featuredResources = getFeaturedResources();

  return (
    <AppShell currentUser={currentUser}>
      <div className="space-y-6">
        <PageHeader
          label="Preparation"
          title="Event resources"
          description="Choose an event to find starter steps, topic guides, practice questions, and test sets in one place."
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Event libraries" value={stats.events} detail="Active events" />
          <StatTile label="Resources" value={stats.resources} detail="Notes, guides, and sheets" />
          <StatTile label="Practice questions" value={stats.questions} detail="With answers and explanations" />
          <StatTile label="Practice tests" value={stats.tests} detail="Mini, full, and testoff sets" />
        </section>

        <ResourceDirectory events={sciolyEvents} />

        <section className="rounded-md border border-court-line bg-court-panel p-4 shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Recommended starting points</h2>
            <p className="mt-1 text-sm text-zinc-500">Useful resources for getting oriented quickly.</p>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {featuredResources.map((resource) => (
              <Link
                key={`${resource.eventSlug}-${resource.title}`}
                href={`/resources/${resource.eventSlug}`}
                className="rounded-md border border-court-line p-4 transition-colors hover:border-cyan-400 hover:bg-court-elevated"
              >
                <div className="text-xs font-medium text-cyan-300">{resource.eventName}</div>
                <div className="mt-1 font-semibold text-white">{resource.title}</div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{resource.description}</p>
                <div className="mt-3 text-xs text-zinc-500">{resource.type} · {resource.topic} · {resource.difficulty}</div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Using the resource library</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {resourceAnnouncements.map((item) => (
              <div key={item.title} className="rounded-md border border-court-line bg-court-panel p-4 shadow-sm">
                <div className="text-xs font-medium text-cyan-300">{item.label}</div>
                <div className="mt-1 font-semibold text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
