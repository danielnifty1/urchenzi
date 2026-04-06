export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-900/80" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return <div className="h-[240px] animate-pulse rounded-2xl bg-zinc-900/80" />;
}

export function StoreGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-zinc-800/90">
          <div className="aspect-[16/10] animate-pulse bg-zinc-900" />
          <div className="space-y-2 p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
            <div className="mt-4 h-10 animate-pulse rounded-xl bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
