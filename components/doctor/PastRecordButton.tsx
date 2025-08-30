// components/ui/PastRecordButton.tsx
"use client";

import React from "react";

/**
 * A sleek, text-like control that sits at the top-right of the preview panel.
 * - Not a toggle switch UI; looks like compact text with subtle arrows.
 * - When "active", we show a tiny "×" to close the past view (optional).
 */
export default function PastRecordButton({
  active,
  index,      // 0-based day index
  total,      // total days
  onOpen,     // open past-records view (called when inactive and user clicks)
  onPrev,     // go to previous day index
  onNext,     // go to next day index
  onClose,    // close past view (optional; only rendered when active)
}: {
  active: boolean;
  index: number;
  total: number;
  onOpen: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose?: () => void;
}) {
  const label = total > 0 ? `${index + 1}/${total}` : "0/0";

  return (
    <div className="inline-flex items-center gap-2 text-xs select-none">
      {/* Left arrow */}
      <button
        type="button"
        onClick={active ? onPrev : onOpen}
        className={[
          "inline-flex items-center justify-center w-6 h-6 rounded-md",
          "text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-transparent",
        ].join(" ")}
        title={active ? "Previous day" : "Show past records"}
        aria-label="Previous"
      >
        ‹
      </button>

      {/* Center text-like button */}
      <button
        type="button"
        onClick={onOpen}
        className={[
          "px-1.5 py-0.5 rounded",
          "text-gray-700 hover:text-gray-900 hover:underline",
        ].join(" ")}
        title={active ? "Past records" : "Show past records"}
        aria-pressed={active}
      >
        {label}
      </button>

      {/* Right arrow */}
      <button
        type="button"
        onClick={active ? onNext : onOpen}
        className={[
          "inline-flex items-center justify-center w-6 h-6 rounded-md",
          "text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-transparent",
        ].join(" ")}
        title={active ? "Next day" : "Show past records"}
        aria-label="Next"
      >
        ›
      </button>

      {/* Tiny close, only when active */}
      {active && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          title="Close past records"
          aria-label="Close past records"
        >
          ×
        </button>
      )}
    </div>
  );
}
