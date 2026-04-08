"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { VendorCard } from "@/components/VendorCard";
import { DownloadAppSection } from "@/components/DownloadAppSection";
import { LetsDoTogetherSection } from "@/components/LetsDoTogetherSection";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { HomeGlovoHero } from "@/components/HomeGlovoHero";
import { useVendors } from "@/hooks/useMarketplace";
import { DEMO_STORE_SLUG, DEMO_STORE_SLUG_CLOSED } from "@/data/storePageMock";
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
    const result = (vendors ?? []).filter(
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
    <div className="space-y-0">
      <HomeGlovoHero search={search} onSearchChange={setSearch} />

      <section className="relative z-[1] mt-0 rounded-t-[2rem] border-x border-t border-border/60 bg-white/95 px-4 pb-10 pt-8 shadow-[0_-8px_32px_rgba(0,0,0,0.07)] dark:bg-surface/90 max-md:backdrop-blur-none md:-mt-8 md:rounded-t-[2.5rem] md:px-6 md:pb-12 md:pt-10 md:backdrop-blur-sm">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="text-center">
            <p className="mx-auto mb-3 inline-flex rounded-full border border-[#00A082]/20 bg-[#00A082]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#00866f] dark:border-brand/30 dark:bg-brand/15 dark:text-brand">
              Discover in minutes
            </p>
            <h2 className="text-2xl font-bold text-[#10131a] dark:text-foreground md:text-3xl">
              Top restaurants and more in UrchenziConnect
            </h2>
            <p className="mt-2 text-sm text-[#4a5568] dark:text-muted md:text-base">
              Browse by category and discover vendors near you.
            </p>
          </div>

          <div className="rounded-2xl border border-[#00A082]/35 bg-gradient-to-br from-[#00A082]/10 via-white to-accent/15 p-5 shadow-[0_8px_28px_rgba(0,160,130,0.12)] dark:from-[#00A082]/15 dark:via-surface dark:to-background/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#00866f] dark:text-[#7dffc8]">
                  Live demo storefront
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground md:text-xl">
                  The Mart — full menu, cart &amp; checkout flow
                </h3>
                <p className="mt-1 max-w-xl text-sm text-muted">
                  Opens the Glovo-style store UI at{" "}
                  <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
                    /store/{DEMO_STORE_SLUG}
                  </code>
                  . Mock data only; cart persists in your browser.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:shrink-0 sm:items-end">
                <Link
                  href={`/store/${DEMO_STORE_SLUG}`}
                  className="inline-flex items-center justify-center rounded-full bg-[#00A082] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#00A082]/25 transition hover:bg-[#008f72]"
                >
                  Open demo store →
                </Link>
                <Link
                  href={`/store/${DEMO_STORE_SLUG_CLOSED}`}
                  className="text-center text-xs font-medium text-muted underline-offset-2 hover:text-foreground hover:underline sm:text-right"
                >
                  Also try: closed-store UI (Medplus mock)
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 bg-gradient-to-br from-white to-background p-4 shadow-sm dark:from-surface dark:to-background/20">
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

          <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-gradient-to-r from-brand/5 via-accent/5 to-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-background/30">
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
            <div className="mb-6 flex items-end justify-between gap-4">
              <h3 className="text-xl font-bold text-foreground">Featured vendors</h3>
              <p className="text-sm font-medium text-muted">{filtered.length} places found</p>
            </div>
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
