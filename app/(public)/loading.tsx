export default function Loading() {
  return (
    <div className="animate-pulse py-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-8">
        {/* Hero placeholder */}
        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-10 w-2/3 rounded bg-muted" />
          <div className="h-5 w-1/2 rounded bg-muted" />
          <div className="flex gap-3">
            <div className="h-10 w-32 rounded bg-muted" />
            <div className="h-10 w-28 rounded bg-muted" />
          </div>
        </div>

        {/* Cards placeholder */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted" />
              <div className="h-5 w-3/4 mx-auto rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </div>
          ))}
        </div>

        {/* Content placeholder */}
        <div className="space-y-3">
          <div className="h-5 w-full rounded bg-muted" />
          <div className="h-5 w-5/6 rounded bg-muted" />
          <div className="h-5 w-4/6 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
