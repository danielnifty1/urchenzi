"use client";

export function VendorFormCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/70 to-zinc-950/90 p-6 shadow-xl shadow-black/25">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function VendorField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-400">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-zinc-600">{hint}</p> : null}
    </div>
  );
}

export const vendorInputClass =
  "w-full rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";
