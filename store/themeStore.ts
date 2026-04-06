"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark";

type ThemeStore = {
  mode: ThemeMode;
  hasHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: "light",
      hasHydrated: false,
      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === "light" ? "dark" : "light" }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "urchenzi-theme",
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn("[theme] persist rehydrate failed", error);
          useThemeStore.getState().setHasHydrated(true);
        }
      },
    },
  ),
);
