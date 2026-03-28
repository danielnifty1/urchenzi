"use client";

import { Rider } from "@/types";

interface RiderCardProps {
  rider: Rider;
}

export const RiderCard = ({ rider }: RiderCardProps) => {
  const riderRating = (4.5 + Math.random() * 0.5).toFixed(1);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
          🚗
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground">{rider.name}</h3>
          <p className="text-sm text-muted">{rider.vehicle}</p>

          <div className="mt-1 flex items-center gap-2">
            <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
              {riderRating} ★
            </span>
            <span className="text-xs text-muted">{rider.phone}</span>
          </div>
        </div>

        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition">
          Call
        </button>
      </div>
    </div>
  );
};
