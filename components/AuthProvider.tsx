"use client";

import { useEffect } from "react";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { subscribeAuth } from "@/lib/firebase/auth";
import { useUserStore } from "@/store/userStore";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsubscribe = subscribeAuth((session) => {
      if (session) {
        useUserStore.getState().login(session);
      } else {
        useUserStore.setState({ user: null });
      }
    });
    return unsubscribe;
  }, []);

  return <>{children}</>;
};
