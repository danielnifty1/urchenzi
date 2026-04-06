"use client";

import dynamic from "next/dynamic";
import type { StorePageData } from "@/types/storePage";
import { StorefrontSkeleton } from "@/components/store/StorefrontSkeleton";

/**
 * Next still pre-renders client components on the server. Some deps touch `location`,
 * which throws in Node and trips the store error boundary. Skip SSR for this subtree.
 */
const StorePageClient = dynamic(
  () => import("./StorePageClient").then((m) => ({ default: m.StorePageClient })),
  { ssr: false, loading: () => <StorefrontSkeleton /> },
);

export function StorePageShell({ store }: { store: StorePageData }) {
  return <StorePageClient store={store} />;
}
