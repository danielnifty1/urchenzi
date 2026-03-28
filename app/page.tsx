"use client";

import { useMemo, useState } from "react";
import { VendorCard } from "@/components/VendorCard";
import { useVendors } from "@/hooks/useMarketplace";
import { VendorCategory } from "@/types";

const CATEGORIES = [
  { id: "all", label: "All", icon: "🏪" },
  { id: "restaurants", label: "Restaurants", icon: "🍽️" },
  { id: "food", label: "Food", icon: "🍕" },
  { id: "groceries", label: "Groceries", icon: "🛒" },
  { id: "pharmacy", label: "Pharmacy", icon: "💊" },
  { id: "shops", label: "Shops", icon: "🛍️" },
  { id: "flowers", label: "Flowers", icon: "🌹" },
  { id: "quick-commerce", label: "Quick", icon: "⚡" },
] as const;

export default function HomePage() {
  const { data: vendors, isLoading, isError } = useVendors();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VendorCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"rating" | "delivery" | "fee">("rating");

  const filtered = useMemo(
    () => {
      let result = (vendors ?? []).filter(
        (vendor) =>
          (category === "all" || vendor.category === category) &&
          vendor.name.toLowerCase().includes(search.toLowerCase()),
      );

      if (sortBy === "rating") {
        result.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === "delivery") {
        result.sort(
          (a, b) =>
            parseInt(a.deliveryTime.split("-")[0]) -
            parseInt(b.deliveryTime.split("-")[0]),
        );
      } else if (sortBy === "fee") {
        result.sort((a, b) => a.deliveryFee - b.deliveryFee);
      }

      return result;
    },
    [vendors, category, search, sortBy],
  );

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark px-6 py-12 md:px-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
              Welcome to UrchenziConnect
            </p>
            <h1 className="text-balance text-4xl font-bold leading-tight text-white md:text-5xl">
              Everything delivered in minutes
            </h1>
            <p className="text-lg text-white/90">
              Food, groceries, flowers, and more from your favorite local shops.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl bg-white p-6 shadow-lg">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                📍 Enter your delivery address
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search vendors or items..."
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Browse by category</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as VendorCategory | "all")}
                className={`flex min-w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  cat.id === category
                    ? "bg-brand text-white shadow-md"
                    : "bg-surface border border-border text-foreground hover:border-brand hover:bg-background"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-surface p-4">
          <h2 className="text-xl font-bold text-foreground">Available now</h2>
          <div className="flex gap-2">
            {(["rating", "delivery", "fee"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition ${
                  sortBy === option
                    ? "bg-brand text-white"
                    : "bg-background text-muted hover:bg-border"
                }`}
              >
                {option === "rating" && "⭐ Top rated"}
                {option === "delivery" && "⚡ Fastest"}
                {option === "fee" && "💰 Cheapest"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface px-6 py-8">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Featured vendors</h2>
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
