"use client";

import { Promotion } from "@/types";

interface PromoCardProps {
  promo: Promotion;
}

export const PromoCard = ({ promo }: PromoCardProps) => {
  const isPercentage = promo.discountType === "percentage";

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/10 to-accent/10 p-5 shadow-sm transition hover:shadow-md hover:border-brand">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 inline-block rounded-lg bg-brand px-3 py-1 text-lg font-bold text-white">
            {isPercentage ? `${promo.discount}%` : `$${promo.discount}`}
          </div>
          <h3 className="text-sm font-bold text-foreground">{promo.description}</h3>
          <p className="mt-2 text-xs text-muted">
            Code: <span className="font-mono font-semibold">{promo.code}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="text-xs text-muted">
          Min order: <span className="font-semibold">${promo.minOrder}</span>
        </div>
        <button className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark transition">
          Copy Code
        </button>
      </div>

      <div className="mt-2 h-1 w-full rounded-full bg-border">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{
            width: `${(promo.currentUses / promo.maxUses) * 100}%`,
          }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {promo.maxUses - promo.currentUses} uses remaining
      </p>
    </div>
  );
};
