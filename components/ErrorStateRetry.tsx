"use client";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorStateRetry({ message, onRetry }: Props) {
  return (
    <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 dark:border-rose-700 dark:bg-transparent dark:text-rose-100"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
