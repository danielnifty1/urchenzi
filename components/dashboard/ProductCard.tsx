import type { VendorDashboardProduct } from "@/types/vendorDashboard";
import { formatCurrency } from "@/utils/format";
import clsx from "clsx";

type Props = {
  product: VendorDashboardProduct;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
};

export function ProductCard({
  product,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: Props) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/40 shadow-sm">
      <div className="relative aspect-[4/3] bg-zinc-950">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-700">📦</div>
        )}
        <span
          className={clsx(
            "absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            product.inStock ? "bg-emerald-500/90 text-emerald-950" : "bg-rose-500/90 text-rose-950",
          )}
        >
          {product.inStock ? "In stock" : "Out of stock"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-white">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{product.description}</p>
        <p className="mt-2 text-sm text-zinc-400">{product.category}</p>
        <p className="mt-1 text-lg font-bold text-emerald-400">{formatCurrency(product.price)}</p>
        {(canEdit || canDelete) && (
          <div className="mt-3 flex gap-2">
            {canEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="flex-1 rounded-lg border border-zinc-700 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Edit
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 rounded-lg border border-rose-900/50 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40"
              >
                Delete
              </button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
