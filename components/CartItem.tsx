"use client";

import Image from "next/image";
import { CartItem as CartItemType } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/format";

export const CartItem = ({ item }: { item: CartItemType }) => {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const itemTotal = item.price * item.quantity;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-4 hover:border-brand hover:shadow-sm transition">
      <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-gray-200 shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-sm md:text-base">
          {item.name}
        </h3>
        <p className="text-sm text-muted">{formatCurrency(item.price)} each</p>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() =>
              item.quantity > 1
                ? updateQuantity(item.id, item.quantity - 1)
                : removeItem(item.id)
            }
            className="h-7 w-7 rounded-full border border-border hover:border-brand hover:bg-brand/5 transition text-sm font-semibold"
          >
            −
          </button>
          <span className="w-6 text-center font-semibold text-sm">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="h-7 w-7 rounded-full border border-border hover:border-brand hover:bg-brand/5 transition text-sm font-semibold"
          >
            +
          </button>
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-2">
        <p className="font-bold text-lg text-brand">
          {formatCurrency(itemTotal)}
        </p>
        <button
          onClick={() => removeItem(item.id)}
          className="text-xs font-medium text-error hover:underline"
        >
          Remove
        </button>
      </div>
    </div>
  );
};
