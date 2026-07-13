export default function Loading() {
  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-court-black px-4 py-20 sm:px-6 lg:pl-72 lg:pr-8" aria-label="Loading page" role="status">
      <div className="mx-auto w-full min-w-0 max-w-[1220px] animate-pulse space-y-5">
        <div className="h-8 w-48 max-w-full rounded-md bg-court-elevated" />
        <div className="h-4 w-full max-w-md rounded-md bg-court-elevated" />
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 min-w-0 rounded-md border border-court-line bg-court-panel" />)}
        </div>
        <div className="h-72 min-w-0 rounded-md border border-court-line bg-court-panel" />
        <span className="sr-only">Loading SciOly Tracker</span>
      </div>
    </div>
  );
}
