"use client";

import { useThemeStore } from "@/store/themeStore";

type ThemeToggleProps = {
  variant?: "default" | "faji";
};

export const ThemeToggle = ({ variant = "default" }: ThemeToggleProps) => {
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={
        variant === "faji"
          ? "relative z-[1] inline-flex cursor-pointer touch-manipulation items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-2 text-xs font-semibold text-[#1a1a1a] shadow-sm [-webkit-tap-highlight-color:transparent] hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white"
          : "relative z-[1] inline-flex cursor-pointer touch-manipulation items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground [-webkit-tap-highlight-color:transparent] hover:opacity-90"
      }
      aria-label="Toggle theme"
    >
      {/* <span>{mode === "light" ? "Light" : "Dark"}</span> */}
      <span>{mode === "light" ? "☀️" : "🌙"}</span>
    </button>
  );
};
