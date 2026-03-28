"use client";

import { useState } from "react";
import { Address } from "@/types";
import { savedAddresses } from "@/services/mockData";

export const LocationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Address>(savedAddresses[0]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-border transition"
      >
        <span>📍</span>
        <span className="hidden sm:inline max-w-xs truncate">{selected.label}</span>
        <span className="text-xs text-muted">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-surface shadow-lg z-50">
            {savedAddresses.map((address) => (
              <button
                key={address.id}
                onClick={() => {
                  setSelected(address);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm transition hover:bg-background ${
                  selected.id === address.id ? "bg-brand/10 text-brand font-medium" : ""
                }`}
              >
                <div className="font-medium">{address.label}</div>
                <div className="text-xs text-muted truncate">{address.address}</div>
              </button>
            ))}
            <button className="w-full border-t border-border px-4 py-3 text-left text-sm font-medium text-brand hover:bg-background">
              + Add new address
            </button>
          </div>
        </>
      )}
    </div>
  );
};
