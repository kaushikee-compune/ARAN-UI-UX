"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Common reusable ActionMenu
 * - Renders a 3-dot trigger button.
 * - Shows a floating menu (using your global `ui-card` style).
 * - Menu items are passed dynamically as {label, icon?, onClick}.
 * - Auto-closes on outside click or Escape.
 */

export type ActionItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

export default function ActionMenu({
  items,
  align = "right",
  size = "sm",
}: {
  items: ActionItem[];
  align?: "left" | "right";
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative inline-block text-left bottom-2.5">
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className={`rounded-full hover:bg-gray-100 ${
          size === "sm" ? "p-1" : "p-1.5"
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="w-5 h-5 text-gray-900"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className={[
            "absolute z-50 min-w-[140px] ui-card p-1 text-sm shadow-lg border border-gray-200",
            align === "right" ? "right-0" : "left-0",
              "top-1/2 -translate-y-1/2", // ⬅️ center vertically
          ].join(" ")}
        >
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => {
                it.onClick();
                setOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-700"
            >
              {it.icon && <span className="w-4 h-4 text-gray-500">{it.icon}</span>}
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
