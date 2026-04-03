"use client";

import type { StorePageData } from "@/types/storePage";

type StoreHeroProps = {
  store: StorePageData;
};

export function StoreHero({ store }: StoreHeroProps) {
  return (
    <section className="space-y-4">
      <div className="relative aspect-[21/9] min-h-[160px] w-full overflow-hidden rounded-2xl bg-border md:aspect-[3/1]">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote vendor URLs; avoids next/image SSR/runtime edge cases */}
        <img
          src={store.bannerImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{store.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
              Price match ›
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Promo on some items
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-[#00A082]">{store.ratingPercent}%</div>
            <div className="text-xs text-muted">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{store.deliveryTime}</div>
            <div className="text-xs text-muted">Delivery</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {store.deliveryFeeFree ? (
                <span className="text-[#00A082]">Free</span>
              ) : (
                <>₦{store.deliveryFee.toLocaleString("en-NG")}</>
              )}
            </div>
            <div className="text-xs text-muted">Fee</div>
          </div>
        </div>
      </div>

      <div
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          store.isOpen
            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
            : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
        }`}
      >
        {store.isOpen ? "Open" : "Temporarily closed"}
      </div>
    </section>
  );
}
