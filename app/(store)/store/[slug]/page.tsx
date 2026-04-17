"use client";

import { useParams } from "next/navigation";
import { StorePageShell } from "@/components/store/StorePageShell";
import { StorefrontSkeleton } from "@/components/store/StorefrontSkeleton";
import { useStorePage } from "@/hooks/useMarketplace";
import { getApiErrorMessage } from "@/lib/auth/apiErrors";

export default function StoreDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, error } = useStorePage(String(slug ?? ""));

  if (isLoading) return <StorefrontSkeleton />;
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="rounded-xl border border-rose-300 bg-rose-100/70 p-4 text-rose-700">
          {getApiErrorMessage(error)}
        </p>
      </div>
    );
  }
  return <StorePageShell store={data} />;
}
