"use client";

import React, { useState, useEffect } from "react";

/* ------------------------- THEME LOGIC ------------------------- */
const THEMES = [
  { key: "t1", name: "Green / Yellow", secondary: "#84994F", tertiary: "#FFE797" },
  { key: "t2", name: "Blue / Navy", secondary: "#11224E", tertiary: "#F87B1B" },
  { key: "t3", name: "Lavender / Plum", secondary: "#CAABD5", tertiary: "#83749F" },
  { key: "t4", name: "Violet / Cyan", secondary: "#7C3AED", tertiary: "#0EA5E9" },
];

export default function TestThemePage() {
  const [theme, setTheme] = useState("t1");

  // Apply theme data attribute + persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("aran_theme", theme);
  }, [theme]);

  // Restore previous theme on load
  useEffect(() => {
    const saved = localStorage.getItem("aran_theme");
    if (saved && THEMES.some((t) => t.key === saved)) setTheme(saved);
  }, []);

  /* ---------- CSS variables for each theme ---------- */
  const themeVars = `
    [data-theme="t1"] { 
      --secondary: #11224E; 
      --tertiary: #F87B1B; 
      --on-tertiary: #000; 
      --bg-page: linear-gradient(135deg, #FAF7F6, #FAF7F6);
    }
    [data-theme="t2"] { 
      --secondary: #11224E; 
      --tertiary: #F87B1B; 
      --on-tertiary: #fff; 
      --bg-page: linear-gradient(135deg, #E9EEF9, #FFF3E8);
    }
    [data-theme="t3"] { 
      --secondary: #CAABD5; 
      --tertiary: #83749F; 
      --on-tertiary: #fff; 
      --bg-page: linear-gradient(135deg, #F6F2FA, #EAE6F5);
    }
    [data-theme="t4"] { 
      --secondary: #7C3AED; 
      --tertiary: #0EA5E9; 
      --on-tertiary: #fff; 
      --bg-page: linear-gradient(135deg, #F3F0FF, #E0F7FF);
    }
  `;

  return (
    <>
      <style>{themeVars}</style>
      <div
        className="min-h-screen p-10 transition-colors duration-700"
        style={{
          background: "var(--bg-page)",
          color: "var(--on-tertiary)",
        }}
      >
        <div className="max-w-5xl mx-auto space-y-8 bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-[--secondary]">Theme Preview</h1>

            {/* Theme Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {THEMES.map((t) => {
                const active = theme === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition ${
                      active
                        ? "border-[--secondary] bg-[--secondary] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    title={t.name}
                  >
                    <span className="inline-flex">
                      <span
                        className="inline-block w-3.5 h-3.5 rounded-full"
                        style={{ background: t.secondary }}
                      />
                      <span
                        className="inline-block w-3.5 h-3.5 rounded-full ml-1"
                        style={{ background: t.tertiary }}
                      />
                    </span>
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Blocks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl text-white" style={{ background: "var(--secondary)" }}>
              Secondary
            </div>
            <div className="p-6 rounded-xl text-black" style={{ background: "var(--tertiary)" }}>
              Tertiary
            </div>
            <div className="p-6 rounded-xl bg-[--on-tertiary] text-gray-900 border">
              On-Tertiary
            </div>
            <div className="p-6 rounded-xl bg-gray-50 text-gray-800 border">
              Background
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">
              Outline Button
            </button>
            <button
              className="px-4 py-2 rounded-md text-white shadow-sm"
              style={{ background: "var(--secondary)" }}
            >
              Primary Button
            </button>
            <button
              className="px-4 py-2 rounded-md text-white shadow-sm"
              style={{ background: "var(--tertiary)" }}
            >
              Accent Button
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
