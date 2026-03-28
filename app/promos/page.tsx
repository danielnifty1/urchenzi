"use client";

import { useState } from "react";
import { PromoCard } from "@/components/PromoCard";
import { promotions } from "@/services/mockData";

export default function PromosPage() {
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const handleApplyPromo = (code: string) => {
    setPromoCode(code);
    setAppliedPromo(code);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-accent to-brand p-8 text-black">
        <h1 className="text-4xl font-bold mb-2">Special Offers</h1>
        <p className="text-black/80">Exclusive deals and promotions for you</p>
      </div>

      <div className="rounded-2xl bg-surface p-8 border border-border shadow-sm">
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Have a promo code?</h2>
          <div className="flex gap-3">
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
            />
            <button
              onClick={() => setAppliedPromo(promoCode)}
              className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark transition"
            >
              Apply
            </button>
          </div>
          {appliedPromo && (
            <p className="text-sm text-success font-semibold">
              ✓ Promo code "{appliedPromo}" applied successfully!
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Active Promotions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-8 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-4">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: 1,
              title: "Find a Promo",
              description: "Browse our available promotions and offers.",
            },
            {
              step: 2,
              title: "Copy the Code",
              description: "Copy the promo code for your favorite offer.",
            },
            {
              step: 3,
              title: "Apply & Save",
              description: "Apply the code at checkout and enjoy your discount!",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-xl font-bold text-white mx-auto">
                {item.step}
              </div>
              <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
