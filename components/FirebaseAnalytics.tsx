"use client";

import { useEffect } from "react";
import { initFirebaseAnalytics } from "@/lib/firebase/analytics";

export const FirebaseAnalytics = () => {
  useEffect(() => {
    initFirebaseAnalytics();
  }, []);
  return null;
};
