"use client";

type StoreOption = { id: string; name: string };

type Props = {
  value: string;
  stores: StoreOption[];
  onChange: (next: string) => void;
  includeAll?: boolean;
  label?: string;
};

export function StoreFilterDropdown({ value, stores, onChange, includeAll = true, label = "Store" }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
      >
        {includeAll ? <option value="">All stores</option> : null}
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}
