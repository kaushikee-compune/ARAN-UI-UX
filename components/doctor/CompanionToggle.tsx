// components/doctor/CompanionToggle.tsx
"use client";

import * as React from "react";

type Props = {
  checked?: boolean;                 // controlled
  defaultChecked?: boolean;          // uncontrolled
  disabled?: boolean;
  onCheckedChange?: (next: boolean) => void;
  onChange?: (next: boolean) => void; // compat with your page.tsx
  className?: string;
  size?: "sm" | "md";
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export default function CompanionToggle({
  checked,
  defaultChecked,
  disabled,
  onCheckedChange,
  onChange,
  className = "",
  size = "md",
  ...aria
}: Props) {
  const isControlled = typeof checked === "boolean";
  const [internal, setInternal] = React.useState<boolean>(defaultChecked ?? false);
  const isOn = isControlled ? !!checked : internal;

  const toggle = React.useCallback(() => {
    if (disabled) return;
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
    onChange?.(next);
  }, [disabled, isOn, isControlled, onCheckedChange, onChange]);

  const dims =
    size === "sm"
      ? { track: "w-14 h-7", thumb: "w-5 h-5", translate: "translate-x-7" }
      : { track: "w-16 h-8", thumb: "w-6 h-6", translate: "translate-x-8" };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      onClick={toggle}
      className={[
        "relative inline-flex items-center rounded-full border transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500",
        dims.track,
        isOn ? "bg-emerald-600 border-emerald-700" : "bg-gray-200 border-gray-300",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:brightness-105",
        className,
      ].join(" ")}
      {...aria}
      title={isOn ? "Turn off Companion Mode" : "Turn on Companion Mode"}
    >
      {/* OFF label (left) */}
      <span
        className={[
          "absolute left-2 text-[10px] font-semibold tracking-wide transition-opacity select-none",
          isOn ? "opacity-0" : "opacity-100 text-gray-600",
        ].join(" ")}
      >
        OFF
      </span>

      {/* ON label (right) */}
      <span
        className={[
          "absolute right-2 text-[10px] font-semibold tracking-wide transition-opacity select-none",
          isOn ? "opacity-100 text-white" : "opacity-0",
        ].join(" ")}
      >
        ON
      </span>

      {/* Thumb */}
      <span
        className={[
          "absolute left-1 top-1 rounded-full bg-white shadow transform transition-transform",
          dims.thumb,
          isOn ? dims.translate : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
