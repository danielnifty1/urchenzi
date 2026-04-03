"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "urchenzi-user",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
