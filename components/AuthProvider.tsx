"use client";

import { useEffect } from "react";
import { setAccessToken } from "@/lib/auth/token";
import { me, refreshSession } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";

/** Restores session from refresh-token cookie after reload. */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      useUserStore.getState().setAuthResolved(false);
      try {
        // Handle backend redirects like "/?accessToken=..." then clean URL.
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          const token = url.searchParams.get("accessToken");
          if (token) {
            setAccessToken(token);
            url.searchParams.delete("accessToken");
            window.history.replaceState({}, "", url.toString());
            const fromToken = await me();
            if (!mounted) return;
            useUserStore.getState().login(fromToken);
            return;
          }
        }
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
