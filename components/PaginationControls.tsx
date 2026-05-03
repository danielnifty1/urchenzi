"use client";

type Props = {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (nextPage: number) => void;
  busy?: boolean;
  alwaysShow?: boolean;
};

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPageChange,
  busy,
  alwaysShow,
}: Props) {
  const canPrev = page > 1 && !busy;
  const canNext = page < totalPages && !busy;

  if (!alwaysShow && totalPages <= 1) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
      <p className="text-muted">
        Page <span className="font-semibold text-foreground">{page}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
        {typeof totalItems === "number" ? (
          <>
            {" "}
            ({totalItems} total)
          </>
        ) : null}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-background disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-background disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
