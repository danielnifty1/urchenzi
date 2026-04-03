import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorePageShell } from "@/components/store/StorePageShell";
import { getStorePageData } from "@/data/storePageMock";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = getStorePageData(slug);
  if (!store) return { title: "Store" };
  return {
    title: `${store.name} · ${store.city}`,
    description: `Order from ${store.name} on UrchenziConnect.`,
  };
}

export default async function StoreDetailPage({ params }: Props) {
  const { slug } = await params;
  const store = getStorePageData(slug);
  if (!store) notFound();

  return <StorePageShell store={store} />;
}
