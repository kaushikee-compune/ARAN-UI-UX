"use client";

import React from "react";

type Props = {
  enabled: boolean;
  onChange: (val: boolean) => void;
  label?: string;            // default: "Companion mode"
  labelSide?: "left" | "right"; // default: "right"
};

export default function CompanionToggle({
  enabled,
  onChange,
  label = "Companion mode",
  labelSide = "right",
}: Props) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      {labelSide === "left" && (
        <span className="text-xs text-gray-600">{label}</span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={labelSide === "right" ? label : undefined}
        onClick={() => onChange(!enabled)}
        className={[
          // Track (sleek)
          "relative inline-flex items-center rounded-full transition-colors outline-none",
          "h-2 w-9",                        // slim track
          enabled ? "bg-gray-900" : "bg-gray-300",
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 focus-visible:ring-offset-white",
          "dark:focus-visible:ring-offset-red-900",
        ].join(" ")}
      >
        {/* Knob */}
        <span
          className={[
            "inline-block rounded-full bg-green-300 shadow-sm transform transition",
            "h-1 w-1",                       // small knob
            enabled ? "translate-x-4" : "translate-x-1",
          ].join(" ")}
        />
      </button>

      {labelSide === "right" && (
        <span className="text-xs text-gray-600">{label}</span>
      )}
    </label>
  );
}
