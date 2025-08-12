"use client";

import React from "react";
import { useTheme, ThemeKey } from "./theme-provider";

type ThemeMeta = {
  key: ThemeKey;
  name: string;
  secondary: string;
  tertiary: string;
};

const THEMES: ThemeMeta[] = [
  { key: "t1", name: "Teal/Aqua",     secondary: "#02c39a", tertiary: "#028090" },
  { key: "t2", name: "Blue/Navy",     secondary: "#0189bb", tertiary: "#014576" },
  { key: "t3", name: "Lavender/Plum", secondary: "#caabd5", tertiary: "#83749f" },
  { key: "t4", name: "Violet/Cyan",   secondary: "#7c3aed", tertiary: "#0ea5e9" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Theme selector">
      {THEMES.map((t) => {
        const active = theme === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => setTheme(t.key)}
            className={[
              "inline-flex items-center gap-2 rounded-xl border px-2 py-1.5 text-xs",
              active
                ? "border-[--secondary] bg-[--secondary] text-[--on-secondary]"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
            ].join(" ")}
            aria-pressed={active}
            title={t.name}
          >
            <span className="relative inline-flex items-center">
              <span className="theme-chip" style={{ background: t.secondary }} />
              <span className="theme-chip ml-1" style={{ background: t.tertiary }} />
            </span>
            <span className="hidden sm:inline">{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}
