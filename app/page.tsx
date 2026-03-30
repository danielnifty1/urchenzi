"use client";

import { useMemo, useState } from "react";
import { VendorCard } from "@/components/VendorCard";
import { DownloadAppSection } from "@/components/DownloadAppSection";
import { LetsDoTogetherSection } from "@/components/LetsDoTogetherSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { HomeGlovoHero } from "@/components/HomeGlovoHero";
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

const SORT_OPTIONS = [
  { value: "rating" as const, label: "Top rated", icon: "⭐" },
  { value: "delivery" as const, label: "Fastest", icon: "⚡" },
  { value: "fee" as const, label: "Cheapest", icon: "💰" },
];

export default function HomePage() {
  const { data: vendors, isLoading, isError } = useVendors();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<VendorCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"rating" | "delivery" | "fee">("rating");

  const filtered = useMemo(() => {
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
  }, [vendors, category, search, sortBy]);

  return (
    <div className="-mt-6 space-y-0 md:-mt-8">
      <HomeGlovoHero search={search} onSearchChange={setSearch} />

      <section className="relative z-10 -mt-8 rounded-t-[2rem] bg-white px-4 pb-10 pt-8 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:bg-surface md:-mt-10 md:rounded-t-[2.5rem] md:px-6 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#10131a] dark:text-foreground md:text-3xl">
              Top restaurants and more in UrchenziConnect
            </h2>
            <p className="mt-2 text-sm text-[#4a5568] dark:text-muted md:text-base">
              Browse by category and discover vendors near you.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Browse by category</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as VendorCategory | "all")}
                  className={`flex min-w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    cat.id === category
                      ? "bg-[#00A082] text-white shadow-md dark:bg-brand"
                      : "border border-border bg-background text-foreground hover:border-[#00A082]/40 dark:hover:border-brand/40"
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-background/30">
            <h3 className="text-xl font-bold text-foreground">Available now</h3>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    sortBy === option.value
                      ? "bg-[#00A082] text-white dark:bg-brand"
                      : "bg-surface text-muted hover:bg-border dark:bg-surface"
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-xl font-bold text-foreground">Featured vendors</h3>
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
        </div>
      </section>

      <div className="relative z-10 bg-background pt-6">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <DownloadAppSection />
        </div>
      </div>

      <div className="relative z-10">
        <LetsDoTogetherSection />
      </div>

      <div className="relative z-10 bg-background px-4 pb-8 pt-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <WhyChooseUsSection />
        </div>
      </div>
    </div>
  );
}
