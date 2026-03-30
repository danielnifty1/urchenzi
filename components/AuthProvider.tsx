"use client";

import { useEffect } from "react";
import { getAccessToken } from "@/lib/auth/token";
import { useUserStore } from "@/store/userStore";

/** Drops persisted user if there is no in-memory access token (e.g. after full page reload). */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const { user } = useUserStore.getState();
    if (user && !getAccessToken()) {
      useUserStore.setState({ user: null });
    }
  }, []);

  return <>{children}</>;
};
