"use client";

import { useCallback, useState } from "react";
import { CartSidebar } from "@/components/store/CartSidebar";
import { FAQAccordion } from "@/components/store/FAQAccordion";
import { Header } from "@/components/store/Header";
import { ProductGrid } from "@/components/store/ProductGrid";
import { SidebarCategories } from "@/components/store/SidebarCategories";
import { StoreHero } from "@/components/store/StoreHero";
import { WidgetBoundary } from "@/components/store/WidgetBoundary";
import { storeProductToCartProduct } from "@/lib/store/productAdapter";
import { useCartStore } from "@/store/cartStore";
import type { StoreCategoryNode, StorePageData } from "@/types/storePage";
import toast from "react-hot-toast";

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
  const addItem = useCartStore((s) => s.addItem);

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

  return (
    <div className="min-h-screen bg-background pb-16">
      <WidgetBoundary>
        <Header />
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

        <WidgetBoundary>
          <StoreHero store={store} />
        </WidgetBoundary>

        {!store.isOpen ? (
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

            <div className="space-y-12">
              {store.sections.map((section) => {
                const list = section.productIds
                  .map((id) => store.products[id])
                  .filter(Boolean);
                return (
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
                );
              })}
            </div>

            <div className="mt-12">
              <WidgetBoundary>
                <FAQAccordion />
              </WidgetBoundary>
            </div>
          </div>

          <div className="hidden lg:block">
            <WidgetBoundary>
              <CartSidebar
                vendorId={store.vendorId}
                storeClosed={!store.isOpen}
                storeName={store.name}
              />
            </WidgetBoundary>
          </div>
        </div>

        <div className="mt-8 lg:hidden">
          <WidgetBoundary>
            <CartSidebar
              vendorId={store.vendorId}
              storeClosed={!store.isOpen}
              storeName={store.name}
            />
          </WidgetBoundary>
        </div>
      </div>
    </div>
  );
}
