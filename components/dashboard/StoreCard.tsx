import Link from "next/link";
import type { AccessibleStoreRow } from "@/services/storeDirectoryApi";
import { formatCurrency } from "@/utils/format";
import clsx from "clsx";

type Props = {
  store: AccessibleStoreRow;
  manageHref: string;
  /** Pending (unattended) orders — shows a blinking badge when &gt; 0. */
  unattendedOrders?: number;
};

export function StoreCard({ store, manageHref, unattendedOrders = 0 }: Props) {
  const pending = store.status === "pending";
  const hasUnattended = unattendedOrders > 0;

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/40 shadow-sm transition hover:border-emerald-500/30 hover:shadow-emerald-950/20">
      {/* Fixed height so thumbnails of any aspect ratio don’t shift title / CTA alignment in the grid */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-zinc-950 sm:h-44">
        {store.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- API URLs
          <img
            src={store.image}
            alt=""
            className="h-full w-full object-cover object-center transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-zinc-700">🏪</div>
        )}
        {hasUnattended ? (
          <span
            className="absolute left-3 top-3 z-[1] inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white shadow-lg shadow-rose-950/50 ring-2 ring-rose-400/80 animate-[pulse_1.1s_ease-in-out_infinite]"
            title="Orders awaiting your action (pending)"
          >
            {unattendedOrders}
          </span>
        ) : null}
        <span
          className={clsx(
            "absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
            pending ? "bg-amber-500/90 text-amber-950" : "bg-emerald-500/90 text-emerald-950",
          )}
        >
          {pending ? "Pending" : "Active"}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold leading-snug text-white">{store.name}</h3>
        {store.slug ? (
          <p className="mt-0.5 font-mono text-xs text-zinc-500">/{store.slug}</p>
        ) : null}
        {store.address ? (
          <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs text-zinc-500">{store.address}</p>
        ) : (
          <div className="mt-2 min-h-[2.5rem]" aria-hidden />
        )}
        <div className="mt-3 flex min-h-[1.75rem] flex-wrap gap-3 text-sm text-zinc-400">
          {hasUnattended ? (
            <span className="rounded-md bg-rose-950/60 px-2 py-0.5 text-rose-200 ring-1 ring-rose-500/40">
              <span className="text-rose-300/90">Unattended</span>{" "}
              <span className="font-semibold text-white">{unattendedOrders}</span>
            </span>
          ) : null}
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
        <div className="mt-auto pt-4">
          <Link
            href={manageHref}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Manage store
          </Link>
        </div>
      </div>
    </article>
  );
}
