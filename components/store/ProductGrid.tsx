"use client";

import { ProductCard } from "@/components/store/ProductCard";
import type { StorePageProduct } from "@/types/storePage";

type ProductGridProps = {
  products: StorePageProduct[];
  storeClosed: boolean;
  onAdd: (product: StorePageProduct) => void;
};

export function ProductGrid({ products, storeClosed, onAdd }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          storeClosed={storeClosed}
          onAdd={() => onAdd(p)}
        />
      ))}
    </div>
  );
}
