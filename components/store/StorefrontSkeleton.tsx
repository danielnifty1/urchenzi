/** Shared pulse layout for `/store/*` route `loading.tsx` and client-only store bootstrap. */
export function StorefrontSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-background">
      <div className="h-16 bg-surface shadow" />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <div className="h-4 w-64 rounded bg-border" />
        <div className="aspect-[3/1] w-full rounded-2xl bg-border" />
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
          <div className="hidden h-96 rounded-xl bg-border lg:block" />
          <div className="space-y-4">
            <div className="h-8 w-40 rounded bg-border" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-border" />
              ))}
            </div>
          </div>
          <div className="hidden h-72 rounded-xl bg-border lg:block" />
        </div>
      </div>
    </div>
  );
}
