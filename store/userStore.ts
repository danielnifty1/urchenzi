"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { firebaseSignOut } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { UserSession } from "@/types";

type UserStore = {
  user: UserSession | null;
  login: (payload: UserSession) => void;
  logout: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      login: (payload) => set({ user: payload }),
      logout: () => {
        if (isFirebaseConfigured()) {
          void firebaseSignOut();
        }
        set({ user: null });
      },
    }),
    { name: "urchenzi-user" },
  ),
);
