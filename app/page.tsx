"use client";

import { useMemo, useState } from "react";
import { VendorCard } from "@/components/VendorCard";
import { useVendors } from "@/hooks/useMarketplace";
import { VendorCategory } from "@/types";

export default function HomePage() {
  const { data: vendors, isLoading, isError } = useVendors();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VendorCategory | "all">("all");

  const filtered = useMemo(
    () =>
      (vendors ?? []).filter(
        (vendor) =>
          (category === "all" || vendor.category === category) &&
          vendor.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [vendors, category, search],
  );

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] bg-brand px-5 py-8 md:px-10 md:py-12">
        <div className="mx-auto grid items-center gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
              UrchenziConnect
            </p>
            <h1 className="text-4xl font-extrabold leading-tight text-[#10131a] md:text-6xl">
              Food delivery and more
            </h1>
            <p className="text-base font-medium text-[#10131a]/80 md:text-lg">
              Groceries, shops, pharmacies, anything!
            </p>
          </div>
          <div className="space-y-3 rounded-2xl bg-white/80 p-3 backdrop-blur">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#10131a]/70">
              Enter your address
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vendors or what you need..."
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none ring-brand-strong/40 focus:ring"
            />
            <div className="flex flex-wrap gap-2">
              {(["all", "food", "groceries", "pharmacy", "shops"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${
                    item === category
                      ? "bg-brand-strong text-white"
                      : "bg-white text-foreground/80"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] bg-surface px-5 py-8 md:px-8">
        <h2 className="mb-5 text-3xl font-bold">Top restaurants and more</h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-2xl bg-background" />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-xl border border-rose-300 bg-rose-100/80 p-4 text-rose-700">
            Failed to load vendors. Please refresh.
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-border bg-background p-6 text-muted">
            No vendors match your search.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
