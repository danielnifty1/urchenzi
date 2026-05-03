"use client";

import { useEffect, useRef } from "react";
import { playNotificationSound } from "@/lib/sounds/playNotificationSound";

type Mode = "rider" | "vendor";

/**
 * When the order list updates from polling or cache invalidation, play a tone for
 * status changes on existing rows. New orders use repeating rings on dashboard pages.
 * Skips the first snapshot so initial load is silent.
 */
export function useOrderSnapshotSounds(
  rows: { id: string; status: string }[] | undefined,
  enabled: boolean,
  _mode: Mode,
): void {
  const prevRef = useRef<Map<string, string>>(new Map());
  const baselineDoneRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      baselineDoneRef.current = false;
      prevRef.current = new Map();
      return;
    }
    if (!rows) return;

    if (!baselineDoneRef.current) {
      baselineDoneRef.current = true;
      prevRef.current = new Map(rows.map((r) => [r.id, r.status]));
      return;
    }

    const prev = prevRef.current;
    const next = new Map(rows.map((r) => [r.id, r.status]));

    for (const [id, status] of next) {
      const old = prev.get(id);
      if (old === undefined) {
        /* new row: sustained ring is handled by useRepeatingOrderRing on vendor/rider */
      } else if (old !== status) {
        playNotificationSound("status");
      }
    }

    prevRef.current = next;
  }, [rows, enabled]);
}
