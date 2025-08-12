"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeKey = "t1" | "t2" | "t3" | "t4";
export type UIStyle = "material" | "skeuo" | "neumorph" | "paper";

type ThemeContextType = {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  ui: UIStyle;
  setUi: (u: UIStyle) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "aran_theme";
const UI_STORAGE_KEY = "aran_ui";

const VALID_THEMES: ThemeKey[] = ["t1", "t2", "t3", "t4"];
const VALID_UIS: UIStyle[] = ["material", "skeuo", "neumorph", "paper"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeKey>("t1");
  const [ui, setUi] = useState<UIStyle>("material");

  // Load persisted settings
  useEffect(() => {
    const savedTheme = (typeof window !== "undefined" && localStorage.getItem(THEME_STORAGE_KEY)) as ThemeKey | null;
    const initialTheme = savedTheme && VALID_THEMES.includes(savedTheme) ? savedTheme : "t1";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);

    const savedUi = (typeof window !== "undefined" && localStorage.getItem(UI_STORAGE_KEY)) as UIStyle | null;
    const initialUi = savedUi && VALID_UIS.includes(savedUi) ? savedUi : "material";
    setUi(initialUi);
    document.documentElement.setAttribute("data-ui", initialUi);
  }, []);

  // Persist/apply changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(UI_STORAGE_KEY, ui);
    document.documentElement.setAttribute("data-ui", ui);
  }, [ui]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, ui, setUi }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
