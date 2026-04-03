"use client";

import { useCallback, useMemo, useState } from "react";
import { CartSidebar } from "@/components/store/CartSidebar";
import { FAQAccordion } from "@/components/store/FAQAccordion";
import { Header } from "@/components/store/Header";
import { ProductGrid } from "@/components/store/ProductGrid";
import { SidebarCategories } from "@/components/store/SidebarCategories";
import { StoreHero } from "@/components/store/StoreHero";
import { WidgetBoundary } from "@/components/store/WidgetBoundary";
import { storeProductToCartProduct } from "@/lib/store/productAdapter";
import { productMatchesStoreSearch } from "@/lib/store/storeSearch";
import { useCartStore } from "@/store/cartStore";
import type { StoreCategoryNode, StorePageData } from "@/types/storePage";
import toast from "react-hot-toast";

/**
 * Progressive storefront UI for crash isolation. Start at 1; increase by one
 * until something breaks — the last working number points to the layer below.
 *
 * 1 = Header + breadcrumb only
 * 2 = + StoreHero
 * 3 = + closed-store alert (when applicable)
 * 4 = + category sidebar + mobile “jump” select (no product grid yet)
 * 5 = + product sections / ProductGrid
 * 6 = + FAQ
 * 7 = + CartSidebar (desktop + mobile)
 */
const STOREFRONT_UI_STAGE = 7;

function findNode(nodes: StoreCategoryNode[], id: string): StoreCategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const f = findNode(n.children, id);
      if (f) return f;
    }
  }
  return null;
}

function firstSectionInSubtree(
  node: StoreCategoryNode,
  sectionIds: Set<string>,
): string | null {
  if (sectionIds.has(node.id)) return node.id;
  if (!node.children) return null;
  for (const c of node.children) {
    const r = firstSectionInSubtree(c, sectionIds);
    if (r) return r;
  }
  return null;
}

function resolveScrollSectionId(categoryId: string, store: StorePageData): string {
  const sectionIds = new Set(store.sections.map((s) => s.id));
  if (sectionIds.has(categoryId)) return categoryId;
  const node = findNode(store.categories, categoryId);
  if (!node) return store.sections[0]?.id ?? categoryId;
  return firstSectionInSubtree(node, sectionIds) ?? store.sections[0]?.id ?? categoryId;
}

type StorePageClientProps = {
  store: StorePageData;
};

export function StorePageClient({ store }: StorePageClientProps) {
  const [activeId, setActiveId] = useState(store.sections[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  const searchTrimmed = searchQuery.trim();
  const hasSearch = searchTrimmed.length > 0;

  // Keep category navigation manual-only to avoid observer-triggered render loops.
  const scrollToSection = useCallback(
    (categoryId: string) => {
      const sectionId = resolveScrollSectionId(categoryId, store);
      setActiveId(sectionId);
      const el = document.getElementById(`section-${sectionId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [store],
  );

  const onAddProduct = useCallback(
    (p: import("@/types/storePage").StorePageProduct) => {
      if (!store.isOpen) return;
      const { items } = useCartStore.getState();
      const hadOtherVendor =
        items.length > 0 && items[0].vendorId !== store.vendorId;
      const product = storeProductToCartProduct(p, store.vendorId);
      addItem(product);
      toast.success(
        hadOtherVendor
          ? `Cart updated for ${store.name} (previous items removed)`
          : "Added to your order",
      );
    },
    [addItem, store.isOpen, store.vendorId, store.name],
  );

  const showHero = STOREFRONT_UI_STAGE >= 2;
  const showClosedBanner = STOREFRONT_UI_STAGE >= 3 && !store.isOpen;
  const showCategoryChrome = STOREFRONT_UI_STAGE >= 4;
  const showProductGrid = STOREFRONT_UI_STAGE >= 5;
  const showFaq = STOREFRONT_UI_STAGE >= 6;
  const showCart = STOREFRONT_UI_STAGE >= 7;

  const visibleSections = useMemo(() => {
    if (!showProductGrid) return [];
    return store.sections
      .map((section) => {
        const list = section.productIds
          .map((id) => store.products[id])
          .filter(Boolean)
          .filter((p) => !hasSearch || productMatchesStoreSearch(p, searchTrimmed));
        return { section, list };
      })
      .filter(({ list }) => !hasSearch || list.length > 0);
  }, [store, hasSearch, searchTrimmed, showProductGrid]);

  const searchMatchCount = useMemo(
    () => visibleSections.reduce((sum, { list }) => sum + list.length, 0),
    [visibleSections],
  );

  return (
    <div className="min-h-screen bg-background pb-16">
      {process.env.NODE_ENV === "development" ? (
        <div
          className="fixed bottom-4 right-4 z-[100] rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs text-foreground shadow-lg"
          title="Set STOREFRONT_UI_STAGE in StorePageClient.tsx to isolate crashes"
        >
          Store UI stage: {STOREFRONT_UI_STAGE}
        </div>
      ) : null}

      <WidgetBoundary>
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchDisabled={!showProductGrid}
        />
      </WidgetBoundary>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <span className="font-medium text-[#00A082]">{store.city}</span>
            </li>
            <li aria-hidden>/</li>
            <li>{store.breadcrumbCategory}</li>
            <li aria-hidden>/</li>
            <li className="text-foreground">{store.name}</li>
          </ol>
        </nav>

        {showHero ? (
          <WidgetBoundary>
            <StoreHero store={store} />
          </WidgetBoundary>
        ) : null}

        {showClosedBanner ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          >
            This store is closed at the moment.{" "}
            <a href="/" className="font-semibold underline">
              Explore stores near you
            </a>
          </div>
        ) : null}

        {showCategoryChrome ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,280px)]">
            <div className="hidden lg:block">
              <WidgetBoundary>
                <SidebarCategories
                  categories={store.categories}
                  activeId={activeId}
                  onSelect={scrollToSection}
                />
              </WidgetBoundary>
            </div>

            <div>
              <div className="mb-6 lg:hidden">
                <label className="mb-2 block text-xs font-semibold text-muted">Jump to category</label>
                <select
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                  value={activeId}
                  onChange={(e) => scrollToSection(e.target.value)}
                >
                  {store.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {showProductGrid ? (
                <div className="space-y-12">
                  {hasSearch && searchMatchCount > 0 ? (
                    <p className="text-sm text-muted" aria-live="polite">
                      {searchMatchCount}{" "}
                      {searchMatchCount === 1 ? "product" : "products"} match your search
                    </p>
                  ) : null}

                  {hasSearch && searchMatchCount === 0 ? (
                    <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
                      <p className="font-medium text-foreground">
                        No products match &ldquo;{searchTrimmed}&rdquo;
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        Try different words, or clear the search to browse all categories.
                      </p>
                      <button
                        type="button"
                        className="mt-6 rounded-full bg-[#00A082] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                        onClick={() => setSearchQuery("")}
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    visibleSections.map(({ section, list }) => (
                      <section
                        key={section.id}
                        id={`section-${section.id}`}
                        className="scroll-mt-28"
                      >
                        <h2 className="mb-4 text-xl font-bold text-foreground">{section.title}</h2>
                        <ProductGrid
                          products={list}
                          storeClosed={!store.isOpen}
                          onAdd={onAddProduct}
                        />
                      </section>
                    ))
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                  Product grid disabled — set <code className="font-mono">STOREFRONT_UI_STAGE</code>{" "}
                  to 5+ to enable.
                </p>
              )}

              {showFaq ? (
                <div className="mt-12">
                  <WidgetBoundary>
                    <FAQAccordion />
                  </WidgetBoundary>
                </div>
              ) : null}
            </div>

            {showCart ? (
              <div className="hidden lg:block">
                <WidgetBoundary>
                  <CartSidebar
                    vendorId={store.vendorId}
                    storeClosed={!store.isOpen}
                    storeName={store.name}
                  />
                </WidgetBoundary>
              </div>
            ) : (
              <div className="hidden lg:block" aria-hidden />
            )}
          </div>
        ) : null}

        {showCart && showCategoryChrome ? (
          <div className="mt-8 lg:hidden">
            <WidgetBoundary>
              <CartSidebar
                vendorId={store.vendorId}
                storeClosed={!store.isOpen}
                storeName={store.name}
              />
            </WidgetBoundary>
          </div>
        ) : null}
      </div>
    </div>
  );
}
