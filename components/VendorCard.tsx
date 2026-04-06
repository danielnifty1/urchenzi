import Image from "next/image";
import Link from "next/link";
import { Vendor } from "@/types";

export const VendorCard = ({ vendor }: { vendor: Vendor }) => {
  const shouldShowFreeDelivery =
    vendor.freeDeliveryThreshold && vendor.deliveryFee > 0;
  const discountPercent = vendor.discount ? `${vendor.discount}%` : null;

  return (
    <Link
      href={`/vendor/${vendor.id}`}
      className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,0.14)]"
    >
      <div className="relative h-32 sm:h-40 w-full overflow-hidden bg-gray-200">
        <Image
          src={vendor.image}
          alt={vendor.name}
          fill
          className="object-cover transition group-hover:scale-105"
        />
        {!vendor.isOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <span className="font-semibold text-white text-xs sm:text-sm">Closed</span>
          </div>
        )}

        {discountPercent && (
          <div className="absolute right-2 sm:right-3 top-2 sm:top-3 rounded-lg bg-accent px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-bold text-black">
            {discountPercent} off
          </div>
        )}

        {shouldShowFreeDelivery && (
          <div className="absolute left-2 sm:left-3 top-2 sm:top-3 rounded-lg bg-brand px-2 py-0.5 sm:py-1 text-xs font-semibold text-white">
            Free delivery
          </div>
        )}
      </div>

      <div className="space-y-1.5 sm:space-y-2 bg-gradient-to-b from-transparent to-background/20 p-3 sm:p-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-brand line-clamp-1">{vendor.name}</h3>
          <p className="text-xs text-muted capitalize">{vendor.category}</p>
        </div>

        <p className="line-clamp-1 text-xs sm:text-sm text-muted">{vendor.description}</p>

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
            <span className="rounded-full bg-brand px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-white whitespace-nowrap">
              {vendor.rating.toFixed(1)} ★
            </span>
            <span className="text-xs text-muted">({vendor.reviewCount})</span>
          </div>
          <span className="text-xs font-semibold text-muted shrink-0">
            {vendor.deliveryFee === 0 ? "Free" : `$${vendor.deliveryFee}`}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-1.5 sm:pt-2">
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
