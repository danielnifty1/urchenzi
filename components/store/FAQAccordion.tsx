"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "How can I order from this store?",
    a: "Browse categories, add items to your order, then proceed to checkout. You can schedule delivery or order for now when the store is open.",
  },
  {
    q: "How much does delivery cost?",
    a: "Delivery fees vary by distance and promotions. The fee shown on the store page applies before checkout. Some orders may qualify for free delivery.",
  },
  {
    q: "How long does delivery take?",
    a: "Estimated delivery time is shown on the store page. You will see a more precise time at checkout based on your address.",
  },
];

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-md">
      <h2 className="text-xl font-bold text-foreground">Frequently asked questions</h2>
      <div className="mt-4 divide-y divide-border">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="py-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left font-semibold text-foreground"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                {item.q}
                <span className="text-muted">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen ? <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
