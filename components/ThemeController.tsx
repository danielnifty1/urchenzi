"use client";

import { useEffect, useLayoutEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

function applyDarkClass(mode: "light" | "dark") {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export const ThemeController = () => {
  const mode = useThemeStore((state) => state.mode);
  const themeUiReady = useThemeStore((state) => state.hasHydrated);

  // React hydrates `<html className="...">` without `dark`, which wipes the
  // inline script that read localStorage. Re-apply before paint.
  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem("urchenzi-theme");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { state?: { mode?: string } };
      const m = parsed?.state?.mode;
      if (m === "dark" || m === "light") {
        applyDarkClass(m as "light" | "dark");
      }
    } catch {
      // ignore
    }
  }, []);

  // After theme store has marked hydration complete, keep `html.dark` in sync.
  useEffect(() => {
    if (!themeUiReady) return;
    applyDarkClass(mode);
  }, [mode, themeUiReady]);

  // `persist` APIs are not available during SSR; register on the client only.
  useEffect(() => {
    const p = useThemeStore.persist;
    if (!p?.onFinishHydration) return;
    const markReady = () => {
      useThemeStore.getState().setHasHydrated(true);
    };
    if (p.hasHydrated()) {
      markReady();
    }
    return p.onFinishHydration(markReady);
  }, []);

  return null;
};
