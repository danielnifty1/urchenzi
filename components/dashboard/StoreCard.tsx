import Link from "next/link";
import type { AccessibleStoreRow } from "@/services/storeDirectoryApi";
import { formatCurrency } from "@/utils/format";
import clsx from "clsx";

type Props = {
  store: AccessibleStoreRow;
  manageHref: string;
};

export function StoreCard({ store, manageHref }: Props) {
  const pending = store.status === "pending";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/40 shadow-sm transition hover:border-emerald-500/30 hover:shadow-emerald-950/20">
      <div className="relative aspect-[16/10] bg-zinc-950">
        {store.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- API URLs
          <img src={store.image} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-zinc-700">🏪</div>
        )}
        <span
          className={clsx(
            "absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
            pending ? "bg-amber-500/90 text-amber-950" : "bg-emerald-500/90 text-emerald-950",
          )}
        >
          {pending ? "Pending" : "Active"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-white">{store.name}</h3>
        {store.slug ? (
          <p className="mt-0.5 font-mono text-xs text-zinc-500">/{store.slug}</p>
        ) : null}
        {store.address ? (
          <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{store.address}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-400">
          {store.orderCount != null ? (
            <span>
              <span className="text-zinc-600">Orders</span>{" "}
              <span className="font-medium text-zinc-200">{store.orderCount}</span>
            </span>
          ) : null}
          {store.revenue != null ? (
            <span>
              <span className="text-zinc-600">Revenue</span>{" "}
              <span className="font-medium text-zinc-200">{formatCurrency(store.revenue)}</span>
            </span>
          ) : null}
        </div>
        <Link
          href={manageHref}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Manage store
        </Link>
      </div>
    </article>
  );
}
