"use client";

import { useEffect } from "react";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[store error boundary]", error.message, error.stack ?? "");
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-foreground">Store page error</h1>
      <p className="max-w-md text-sm text-muted">
        Something went wrong loading this storefront. You can try again or return home.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="max-w-full overflow-x-auto rounded-lg bg-background p-3 text-left text-xs text-rose-600">
          {error.message}
        </pre>
      ) : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[#00A082] px-5 py-2 text-sm font-semibold text-white"
        >
          Reload
        </button>
        <a
          href="/"
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground"
        >
          Back home
        </a>
      </div>
    </div>
  );
}
