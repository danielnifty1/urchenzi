"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export const ThemeController = () => {
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
  }, [mode]);

  return null;
};
