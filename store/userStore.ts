"use client";

import { create } from "zustand";
import { setAccessToken } from "@/lib/auth/token";
import { logoutSession } from "@/services/authApi";
import type { UserRole, UserSession, UserStatus } from "@/types";

type UserStore = {
  user: UserSession | null;
  authResolved: boolean;
  login: (payload: UserSession) => void;
  logout: () => Promise<void>;
  setAuthResolved: (value: boolean) => void;
  updateUserRole: (role: UserRole, status: UserStatus) => void;
};

/**
 * User is kept in memory only. Persisting `user` to localStorage races with
 * Zustand persist rehydration and can overwrite a fresh OAuth / cookie session
 * with a stale `null`. Session continuity uses httpOnly cookies + AuthProvider.
 */
export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  authResolved: false,
  login: (payload) => set({ user: payload }),
  logout: async () => {
    try {
      await logoutSession();
    } catch {
      // Clear client session even if backend logout fails.
    } finally {
      setAccessToken(null);
      set({ user: null });
    }
  },
  setAuthResolved: (value) => set({ authResolved: value }),
  updateUserRole: (role, status) =>
    set((state) => ({
      user: state.user ? { ...state.user, role, status } : null,
    })),
}));
