import Image from "next/image";
import Link from "next/link";
import { Vendor } from "@/types";

export const VendorCard = ({ vendor }: { vendor: Vendor }) => (
  <Link
    href={`/vendor/${vendor.id}`}
    className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="relative h-36 w-full">
      <Image src={vendor.image} alt={vendor.name} fill className="object-cover" />
    </div>
    <div className="space-y-1 p-4">
      <h3 className="text-base font-semibold text-foreground">{vendor.name}</h3>
      <p className="text-sm text-muted">{vendor.deliveryTime}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="rounded-full bg-brand px-2 py-1 text-[#10131a]">
          {vendor.rating.toFixed(1)} ★
        </span>
        <span className="capitalize text-muted">{vendor.category}</span>
      </div>
    </div>
  </Link>
);
