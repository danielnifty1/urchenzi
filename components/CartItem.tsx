"use client";

import Image from "next/image";
import { CartItem as CartItemType } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/format";

export const CartItem = ({ item }: { item: CartItemType }) => {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <div className="relative h-16 w-16 overflow-hidden rounded-lg">
        <Image src={item.image} alt={item.name} fill className="object-cover" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-foreground">{item.name}</h3>
        <p className="text-sm text-muted">{formatCurrency(item.price)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="h-8 w-8 rounded-full border border-border"
        >
          -
        </button>
        <span className="w-6 text-center">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="h-8 w-8 rounded-full border border-border"
        >
          +
        </button>
      </div>
      <button onClick={() => removeItem(item.id)} className="text-sm text-rose-600">
        Remove
      </button>
    </div>
  );
};
