"use client";

import type { StorePageProduct } from "@/types/storePage";

type ProductCardProps = {
  product: StorePageProduct;
  storeClosed: boolean;
  onAdd: () => void;
};

export function ProductCard({ product, storeClosed, onAdd }: ProductCardProps) {
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  return (
    <div className="group relative flex flex-col rounded-xl bg-surface p-3 shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg dark:bg-surface">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-background">
        {discount ? (
          <span className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-[#1a1a1a]">
            -{discount}%
          </span>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary product image URLs */}
        <img
          src={product.image}
          alt={product.name}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
        />
        <button
          type="button"
          disabled={storeClosed}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!storeClosed) onAdd();
          }}
          className="absolute bottom-2 right-2 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-xl font-bold text-[#00A082] shadow-md transition hover:bg-[#E9F8F5] active:scale-95 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Add ${product.name}`}
        >
          +
        </button>
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold uppercase leading-snug text-foreground">
        {product.name}
      </h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-base font-bold text-foreground">
          ₦{product.price.toLocaleString("en-NG")}
        </span>
        {product.originalPrice ? (
          <span className="text-sm text-muted line-through">
            ₦{product.originalPrice.toLocaleString("en-NG")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
