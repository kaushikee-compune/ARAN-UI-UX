// components/appearance-panel.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import ThemeToggle from "./theme-toggle";
import StyleToggle from "./style-toggle";

/**
 * A small, collapsible "Appearance" window that contains:
 * - StyleToggle (Material / Skeuomorphism / Neumorphism / Paper)
 * - ThemeToggle (your 4 color palettes)
 *
 * - Opens via a button in the top bar
 * - Closes on outside click or Escape
 */
export default function AppearancePanel() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 btn-outline"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="appearance-panel"
      >
        <PaletteIcon className="w-4 h-4" />
        Appearance
        <ChevronDownIcon
          className={[
            "w-3 h-3 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div
          id="appearance-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Appearance settings"
          className="absolute right-0 mt-2 w-[min(92vw,420px)] ui-card p-4 z-50"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">Appearance</div>
              <div className="text-xs text-gray-600">
                Pick a UI style and color palette
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-outline text-xs"
              aria-label="Close appearance panel"
            >
              Close
            </button>
          </div>

          <div className="mt-3 grid gap-3">
            <section className="space-y-2">
              <h3 className="text-xs font-medium text-gray-700">UI Style</h3>
              <StyleToggle />
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-medium text-gray-700">
                Color Palette
              </h3>
              <ThemeToggle />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Inline Icons ---------- */
function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 3a9 9 0 1 0 0 18h2a3 3 0 0 0 3-3 2 2 0 0 0-2-2h-1a2 2 0 1 1 0-4h.5A3.5 3.5 0 0 0 18 8.5 5.5 5.5 0 0 0 12.5 3H12Z" />
      <circle cx="7.5" cy="10.5" r="1" />
      <circle cx="9.5" cy="6.5" r="1" />
      <circle cx="14.5" cy="6.5" r="1" />
    </svg>
  );
}
// replace the existing ChevronDownIcon with this
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
