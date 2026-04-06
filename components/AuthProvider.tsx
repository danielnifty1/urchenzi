"use client";

import { useEffect } from "react";
import { readOAuthTokenFromLocation, stripOAuthParamsFromUrl } from "@/lib/auth/oauthCallback";
import { getPostAuthRedirectPath } from "@/lib/auth/postAuthRedirect";
import { setAccessToken } from "@/lib/auth/token";
import { me, refreshSession } from "@/services/authApi";
import { useUserStore } from "@/store/userStore";

const AUTH_RESTORE_TIMEOUT_MS = 12_000;

/** Restores session from refresh-token cookie after reload. */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    let mounted = true;
    let settled = false;

    const markResolved = () => {
      if (!mounted || settled) return;
      settled = true;
      useUserStore.getState().setAuthResolved(true);
    };

    const restore = async () => {
      useUserStore.getState().setAuthResolved(false);
      settled = false;

      const safetyTimer = window.setTimeout(() => {
        if (!mounted || settled) return;
        useUserStore.setState({ user: null });
        markResolved();
      }, AUTH_RESTORE_TIMEOUT_MS);

      try {
        // Google / OAuth redirect: token in query or hash — then clean URL.
        if (typeof window !== "undefined") {
          const token = readOAuthTokenFromLocation(window.location.href);
          if (token) {
            setAccessToken(token);
            window.history.replaceState({}, "", stripOAuthParamsFromUrl(window.location.href));
            const fromToken = await me();
            if (!mounted) return;
            useUserStore.getState().login(fromToken);
            const next = getPostAuthRedirectPath(fromToken);
            const here = new URL(window.location.href);
            const dest = new URL(next, here.origin);
            if (dest.pathname !== here.pathname || here.search) {
              window.clearTimeout(safetyTimer);
              markResolved();
              window.location.replace(dest.toString());
              return;
            }
            window.clearTimeout(safetyTimer);
            markResolved();
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
        window.clearTimeout(safetyTimer);
        if (!mounted) return;
        markResolved();
      }
    };
    void restore();
    return () => {
      mounted = false;
    };
  }, []);

  return <>{children}</>;
};
