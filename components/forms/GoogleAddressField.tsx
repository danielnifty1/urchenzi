"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import { geocodePlace, searchPlaces } from "@/lib/maps/googleMaps";

function hasGoogleMapsKey(): boolean {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return Boolean(raw?.trim());
}

export type GoogleAddressFieldProps = {
  id?: string;
  value: string;
  onChange: (address: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Light onboarding fields vs dark dashboard modal */
  variant?: "default" | "dark";
};

export function GoogleAddressField({
  id,
  value,
  onChange,
  disabled,
  placeholder = "Search for a street address",
  variant = "default",
}: GoogleAddressFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `addr-${autoId}`;
  const listId = `${fieldId}-predictions`;

  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Array<{ placeId: string; description: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [editing, setEditing] = useState(() => !value.trim());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      setEditing(true);
      setQuery("");
    } else {
      setEditing(false);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el?.contains(e.target as Node)) setPredictions([]);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const inputClass =
    variant === "dark"
      ? "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
      : "w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  const summaryClass =
    variant === "dark"
      ? "flex items-start justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100"
      : "flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground";

  const listWrapClass =
    variant === "dark"
      ? "absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-zinc-600 bg-zinc-900 py-1 shadow-xl"
      : "absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-xl";

  const itemClass =
    variant === "dark"
      ? "w-full px-3 py-2.5 text-left text-xs text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
      : "w-full px-3 py-2.5 text-left text-sm text-foreground hover:bg-brand/10 disabled:opacity-50";

  const runSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const trimmed = q.trim();
        if (!trimmed) {
          setPredictions([]);
          setSearching(false);
          return;
        }
        setSearching(true);
        try {
          const results = await searchPlaces(trimmed);
          setPredictions(results);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not load address suggestions.");
          setPredictions([]);
        } finally {
          setSearching(false);
        }
      }, 320);
    },
    [],
  );

  const onPick = async (placeId: string) => {
    setSelecting(true);
    try {
      const place = await geocodePlace(placeId);
      onChange(place.address);
      setQuery("");
      setPredictions([]);
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not use that address.");
    } finally {
      setSelecting(false);
    }
  };

  if (!hasGoogleMapsKey()) {
    return (
      <textarea
        id={fieldId}
        disabled={disabled}
        placeholder="Street, city (5–1000 characters)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={
          variant === "dark"
            ? "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            : "w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        }
      />
    );
  }

  if (!editing && value.trim()) {
    return (
      <div className={summaryClass}>
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">{value}</p>
        <button
          type="button"
          disabled={disabled || selecting}
          onClick={() => {
            onChange("");
            setEditing(true);
            setQuery("");
            setPredictions([]);
          }}
          className={
            variant === "dark"
              ? "shrink-0 text-xs font-semibold text-emerald-400 hover:underline"
              : "shrink-0 text-xs font-semibold text-brand hover:underline"
          }
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={fieldId}
        type="text"
        autoComplete="off"
        disabled={disabled || selecting}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          runSearch(v);
        }}
        aria-expanded={predictions.length > 0}
        aria-controls={predictions.length ? listId : undefined}
        aria-autocomplete="list"
        className={inputClass}
      />
      <p
        className={
          variant === "dark" ? "mt-1.5 text-xs text-zinc-500" : "mt-1.5 text-xs text-muted"
        }
      >
        {searching ? "Searching…" : "Start typing — pick an address from the list."}
      </p>
      {predictions.length > 0 ? (
        <ul id={listId} role="listbox" className={listWrapClass}>
          {predictions.map((p) => (
            <li key={p.placeId} role="option">
              <button
                type="button"
                disabled={selecting}
                className={itemClass}
                onClick={() => void onPick(p.placeId)}
              >
                {p.description}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
