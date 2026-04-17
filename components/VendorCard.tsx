import Image from "next/image";
import Link from "next/link";
import { Vendor } from "@/types";

export const VendorCard = ({ vendor }: { vendor: Vendor }) => {
  const href = vendor.storeSlug ? `/store/${vendor.storeSlug}` : `/vendor/${vendor.id}`;
  const shouldShowFreeDelivery =
    vendor.freeDeliveryThreshold && vendor.deliveryFee > 0;
  const discountPercent = vendor.discount ? `${vendor.discount}%` : null;

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,0.14)]"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gray-200">
        <Image
          src={vendor.image}
          alt={vendor.name}
          fill
          className="object-cover transition group-hover:scale-105"
        />
        {!vendor.isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <span className="font-semibold text-white">Closed</span>
          </div>
        )}

        {discountPercent && (
          <div className="absolute right-3 top-3 rounded-lg bg-accent px-2 py-1 text-sm font-bold text-black">
            {discountPercent} off
          </div>
        )}

        {shouldShowFreeDelivery && (
          <div className="absolute left-3 top-3 rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-white">
            Free delivery
          </div>
        )}
      </div>

      <div className="space-y-2 bg-gradient-to-b from-transparent to-background/20 p-4">
        <div>
          <h3 className="text-base font-bold text-foreground group-hover:text-brand">{vendor.name}</h3>
          <p className="text-xs text-muted capitalize">{vendor.category}</p>
        </div>

        <p className="line-clamp-1 text-sm text-muted">{vendor.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="rounded-full bg-brand px-2 py-1 text-xs font-semibold text-white">
              {vendor.rating.toFixed(1)} ★
            </span>
            <span className="text-xs text-muted">({vendor.reviewCount})</span>
          </div>
          <span className="text-xs font-semibold text-muted">
            {vendor.deliveryFee === 0 ? "Free" : `$${vendor.deliveryFee}`}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-xs font-medium text-muted">
            {vendor.estimatedDelivery}
          </span>
          <span className="text-xs text-muted">
            Min: ${vendor.minOrder.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
};
