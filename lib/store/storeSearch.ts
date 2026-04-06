import type { StorePageProduct } from "@/types/storePage";

/** Whitespace-normalized tokens; every token must appear in the product name (order-independent). */
export function productMatchesStoreSearch(product: StorePageProduct, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const name = product.name.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => name.includes(t));
}
