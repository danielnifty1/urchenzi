"use client";

import { useEffect } from "react";
import { refreshSession } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";

/** Restores session from refresh-token cookie after reload. */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      useUserStore.getState().setAuthResolved(false);
      try {
        const session = await refreshSession();
        if (!mounted) return;
        useUserStore.getState().login(session);
      } catch {
        if (!mounted) return;
        useUserStore.setState({ user: null });
      } finally {
        if (!mounted) return;
        useUserStore.getState().setAuthResolved(true);
      }
    };
    void restore();
    return () => {
      mounted = false;
    };
  }, []);

  return <>{children}</>;
};
