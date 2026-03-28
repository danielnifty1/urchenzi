"use client";

import Image from "next/image";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/format";

export const ProductCard = ({ product }: { product: Product }) => {
  const addItem = useCartStore((state) => state.addItem);
  const vendorId = useCartStore((state) => state.vendorId);
  const clearCart = useCartStore((state) => state.clearCart);

  const onAdd = () => {
    if (vendorId && vendorId !== product.vendorId) {
      clearCart();
      toast("Cart reset to switch vendor.", { icon: "⚠️" });
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <article className="flex gap-3 rounded-2xl border border-border bg-surface p-3 hover:border-brand hover:shadow-md transition group">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-200 group-hover:scale-105 transition">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h4 className="font-semibold text-foreground text-sm md:text-base line-clamp-1">
            {product.name}
          </h4>
          <p className="line-clamp-2 text-xs md:text-sm text-muted">
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base font-bold text-brand">
            {formatCurrency(product.price)}
          </span>
          <button
            onClick={onAdd}
            className="rounded-lg bg-brand px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-brand-dark transition shrink-0"
          >
            + Add
          </button>
        </div>
      </div>
    </article>
  );
};
