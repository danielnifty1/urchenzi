"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { startRepeatingRing, stopRepeatingRing } from "@/lib/sounds/playNotificationSound";

type Params = {
  enabled: boolean;
  ringWhile: boolean;
  kind: "assignment" | "alert";
  attentionIds: string[];
};

/**
 * Repeats the ring sound while {@link ringWhile} is true and the user has not
 * pressed “stop for now”. Clears mute when a new id appears in {@link attentionIds}.
 */
export function useRepeatingOrderRing({ enabled, ringWhile, kind, attentionIds }: Params) {
  const [muted, setMuted] = useState(false);
  const prevAttentionRef = useRef<Set<string>>(new Set());
  const attentionKey = useMemo(() => [...attentionIds].sort().join("|"), [attentionIds]);

  useEffect(() => {
    const nextSet = new Set(attentionKey ? attentionKey.split("|") : []);
    let hasNew = false;
    for (const id of nextSet) {
      if (!prevAttentionRef.current.has(id)) {
        hasNew = true;
        break;
      }
    }
    prevAttentionRef.current = nextSet;
    if (hasNew) setMuted(false);
  }, [attentionKey]);

  useEffect(() => {
    if (!enabled) {
      stopRepeatingRing();
      return;
    }
    if (ringWhile && !muted) {
      startRepeatingRing(kind);
    } else {
      stopRepeatingRing();
    }
    return () => stopRepeatingRing();
  }, [enabled, ringWhile, muted, kind]);

  const silenceRingingForNow = () => {
    setMuted(true);
    stopRepeatingRing();
  };

  return { silenceRingingForNow, muted };
}
