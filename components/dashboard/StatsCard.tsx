import clsx from "clsx";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "emerald" | "violet" | "amber";
  /** Default dark (slate) for global dashboard; light for store workspace main panel. */
  variant?: "dark" | "light";
};

const accentBorder: Record<NonNullable<Props["accent"]>, string> = {
  default: "border-zinc-800/90",
  emerald: "border-emerald-500/20",
  violet: "border-violet-500/20",
  amber: "border-amber-500/20",
};

export function StatsCard({ label, value, hint, accent = "default", variant = "dark" }: Props) {
  const light = variant === "light";
  return (
    <div
      className={clsx(
        "rounded-2xl border p-5 shadow-sm",
        light
          ? clsx("border-border bg-surface ring-1 ring-black/5 dark:ring-white/5", accentBorder[accent])
          : clsx("bg-zinc-900/50 ring-1 ring-white/5", accentBorder[accent]),
      )}
    >
      <p
        className={clsx(
          "text-xs font-medium uppercase tracking-wide",
          light ? "text-muted" : "text-zinc-500",
        )}
      >
        {label}
      </p>
      <p
        className={clsx(
          "mt-2 text-2xl font-bold tabular-nums tracking-tight md:text-3xl",
          light ? "text-foreground" : "text-white",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className={clsx("mt-1 text-xs", light ? "text-muted" : "text-zinc-500")}>{hint}</p>
      ) : null}
    </div>
  );
}
