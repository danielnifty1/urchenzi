"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
      logout: () => set({ user: null }),
    }),
    { name: "urchenzi-user" },
  ),
);
