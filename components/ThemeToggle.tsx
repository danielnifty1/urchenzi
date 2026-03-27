"use client";

import { useThemeStore } from "@/store/themeStore";

export const ThemeToggle = () => {
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);

  return (
    <button
      onClick={toggleMode}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:opacity-90"
      aria-label="Toggle theme"
    >
      <span>{mode === "light" ? "Light" : "Dark"}</span>
      <span>{mode === "light" ? "☀️" : "🌙"}</span>
    </button>
  );
};
