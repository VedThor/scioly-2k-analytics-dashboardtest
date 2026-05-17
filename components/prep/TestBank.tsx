import type { TestBankItem } from "@/lib/prep-types";

type TestBankProps = {
  tests: TestBankItem[];
};

export function TestBank({ tests }: TestBankProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Test Bank
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Timed sets and longer practice
          </h2>
        </div>

        <p className="text-sm font-bold text-zinc-500">
          {tests.length} test{tests.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tests.map((test) => (
          <a
            key={test.id}
            href={test.url}
            className="block min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:-translate-y-0.5 hover:border-cyan-400"
          >
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-rose-300">
                {test.difficulty}
              </span>

              <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-400">
                {test.format}
              </span>

              {test.answerKeyAvailable && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-300">
                  Key Available
                </span>
              )}
            </div>

            <h3 className="break-words text-lg font-black text-white">
              {test.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {test.description}
            </p>

            <p className="mt-4 text-sm font-black text-cyan-300">
              Estimated time: {test.estimatedTime}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {test.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-bold text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>

      {tests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-6 text-center">
          <p className="font-black text-white">No tests yet</p>
          <p className="mt-2 text-sm text-zinc-400">
            Add mini-tests, PDFs, packets, and answer keys later.
          </p>
        </div>
      )}
    </section>
  );
}
