"use client";

import { Address } from "@/types";
import { savedAddresses } from "@/services/mockData";

export const SavedAddresses = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Saved Addresses</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {savedAddresses.map((address) => (
          <div
            key={address.id}
            className="relative rounded-lg border-2 border-border p-4 transition hover:border-brand hover:bg-brand/5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">
                  {address.label}
                </h3>
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  {address.address}
                </p>
              </div>
              {address.isDefault && (
                <span className="rounded-full bg-brand px-2 py-1 text-xs font-semibold text-white">
                  Default
                </span>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-border transition">
                Edit
              </button>
              <button className="flex-1 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-border transition">
                Delete
              </button>
            </div>
          </div>
        ))}

        <button className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center transition hover:border-brand hover:bg-brand/5">
          <div>
            <div className="text-2xl mb-2">➕</div>
            <p className="font-medium text-foreground">Add new address</p>
            <p className="text-xs text-muted mt-1">Save time on delivery</p>
          </div>
        </button>
      </div>
    </div>
  );
};
