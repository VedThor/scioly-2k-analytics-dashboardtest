import type { ResourceItem, StarterPathStep, TestBankItem } from "@/lib/prep-types";

type StarterPathProps = {
  steps: StarterPathStep[];
  resources: ResourceItem[];
  tests: TestBankItem[];
};

const phaseStyles: Record<string, string> = {
  Start: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  Foundation: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  Practice: "border-violet-400/40 bg-violet-400/10 text-violet-300",
  Review: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  Test: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  Advanced: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300",
};

export function StarterPath({ steps, resources, tests }: StarterPathProps) {
  const resourceMap = new Map(resources.map((resource) => [resource.id, resource]));
  const testMap = new Map(tests.map((test) => [test.id, test]));

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Starter Path
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Event onboarding roadmap
          </h2>
        </div>

        <p className="max-w-xl text-sm leading-6 text-zinc-400">
          A practical path for rookies and returning competitors: learn the rules,
          build fundamentals, practice, review mistakes, then test under pressure.
        </p>
      </div>

      <div className="grid gap-4">
        {steps.map((step, index) => {
          const linkedResources =
            step.resourceIds
              ?.map((resourceId) => resourceMap.get(resourceId))
              .filter(Boolean) ?? [];

          const linkedTests =
            step.testIds?.map((testId) => testMap.get(testId)).filter(Boolean) ??
            [];

          const style =
            phaseStyles[step.phase] ??
            "border-zinc-700 bg-zinc-900 text-zinc-300";

          return (
            <article
              key={step.id}
              className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex items-center gap-3 md:w-52 md:shrink-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-sm font-black text-cyan-300">
                    {index + 1}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${style}`}
                    >
                      {step.phase}
                    </span>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                      {step.estimatedTime}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {step.description}
                  </p>

                  {(linkedResources.length > 0 ||
                    linkedTests.length > 0 ||
                    step.quizIds?.length) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {linkedResources.map((resource) =>
                        resource ? (
                          <a
                            key={resource.id}
                            href={resource.url}
                            className="max-w-full truncate rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-bold text-zinc-300 hover:border-cyan-400 hover:text-cyan-300"
                          >
                            Resource: {resource.title}
                          </a>
                        ) : null
                      )}

                      {step.quizIds?.map((quizId) => (
                        <span
                          key={quizId}
                          className="rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-300"
                        >
                          Quiz linked
                        </span>
                      ))}

                      {linkedTests.map((test) =>
                        test ? (
                          <a
                            key={test.id}
                            href={test.url}
                            className="max-w-full truncate rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-300"
                          >
                            Test: {test.title}
                          </a>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
