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
    <article className="flex gap-3 rounded-2xl border border-border bg-surface p-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        <Image src={product.image} alt={product.name} fill className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4 className="font-semibold text-foreground">{product.name}</h4>
          <p className="line-clamp-2 text-sm text-muted">{product.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">{formatCurrency(product.price)}</span>
          <button
            onClick={onAdd}
            className="rounded-full bg-brand-strong px-3 py-1.5 text-sm text-white"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
};
