"use client";

import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export function useFirebaseConfigured(): boolean | null {
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    setReady(isFirebaseConfigured());
  }, []);
  return ready;
}
