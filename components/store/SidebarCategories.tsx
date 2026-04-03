"use client";

import { useState } from "react";
import type { StoreCategoryNode } from "@/types/storePage";

type SidebarCategoriesProps = {
  categories: StoreCategoryNode[];
  activeId: string;
  onSelect: (id: string) => void;
};

function CategoryBranch({
  nodes,
  depth,
  activeId,
  onSelect,
  openSet,
  toggle,
}: {
  nodes: StoreCategoryNode[];
  depth: number;
  activeId: string;
  onSelect: (id: string) => void;
  openSet: Set<string>;
  toggle: (id: string) => void;
}) {
  return (
    <ul className={depth === 0 ? "space-y-1" : "ml-3 mt-1 space-y-1 border-l border-border pl-3"}>
      {nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length);
        const isOpen = openSet.has(node.id);
        const isActive = activeId === node.id;

        return (
          <li key={node.id}>
            <div className="flex items-center gap-1">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggle(node.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted hover:bg-background"
                  aria-expanded={isOpen}
                >
                  {isOpen ? "▼" : "▶"}
                </button>
              ) : (
                <span className="w-8" />
              )}
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                className={`flex-1 rounded-lg px-2 py-2 text-left text-sm transition ${
                  isActive
                    ? "bg-[#00A082]/15 font-semibold text-[#00A082]"
                    : "text-foreground hover:bg-background"
                }`}
              >
                {node.label}
              </button>
            </div>
            {hasChildren && isOpen ? (
              <CategoryBranch
                nodes={node.children!}
                depth={depth + 1}
                activeId={activeId}
                onSelect={onSelect}
                openSet={openSet}
                toggle={toggle}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function SidebarCategories({ categories, activeId, onSelect }: SidebarCategoriesProps) {
  const [openSet, setOpenSet] = useState(() => new Set<string>(["dairy", "eggs-butter"]));

  const toggle = (id: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav
      aria-label="Categories"
      className="sticky top-[72px] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-border bg-surface p-4 shadow-md"
    >
      <h2 className="mb-3 text-sm font-bold text-foreground">Categories</h2>
      <CategoryBranch
        nodes={categories}
        depth={0}
        activeId={activeId}
        onSelect={onSelect}
        openSet={openSet}
        toggle={toggle}
      />
    </nav>
  );
}
