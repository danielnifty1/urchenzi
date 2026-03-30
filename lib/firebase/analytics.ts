"use client";

import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase/config";

export function initFirebaseAnalytics(): void {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return;
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return;

  void isSupported().then((supported) => {
    if (!supported) return;
    try {
      getAnalytics(getFirebaseApp());
    } catch {
      // duplicate init or unsupported environment
    }
  });
}
