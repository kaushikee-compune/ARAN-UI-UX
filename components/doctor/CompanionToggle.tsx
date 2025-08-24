// components/doctor/CompanionToggle.tsx
"use client";
import * as React from "react";

type Props = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (next: boolean) => void;
  onChange?: (next: boolean) => void;
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

  // track: 2.5rem x 1rem (w-10 h-4)
  // thumb: 1rem x 1rem (w-4 h-4)
  // OFF left offset 0.125rem (left-0.5), ON translate 1.25rem (translate-x-5)
  const dims =
    size === "md"
      ? { track: "w-10 h-4", thumb: "w-3 h-3", offLeft: "left-0.5", onTranslate: "translate-x-5" }
      : { track: "w-9 h-4", thumb: "w-3 h-3", offLeft: "left-0.5", onTranslate: "translate-x-4" };

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
        isOn ? "bg-emerald-600 border-emerald-700" : "bg-gray-400 border-gray-400",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:brightness-105",
        className,
      ].join(" ")}
      {...aria}
      title={isOn ? "Turn off Companion Mode" : "Turn on Companion Mode"}
    >
      {/* OFF label */}
      <span
        className={[
          "absolute left-2 text-[10px] font-semibold tracking-wide transition-opacity select-none",
          isOn ? "opacity-0" : "opacity-100 text-gray-600",
        ].join(" ")}
      >
        OFF
      </span>

      {/* ON label */}
      <span
        className={[
          "absolute right-2 text-[10px] font-semibold tracking-wide transition-opacity select-none",
          isOn ? "opacity-100 text-white" : "opacity-0",
        ].join(" ")}
      >
        ON
      </span>

      {/* Thumb (centered vertically) */}
      <span
        className={[
          "absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform",
          dims.thumb,
          dims.offLeft, // 0.125rem inset when OFF
          isOn ? dims.onTranslate : "translate-x-0", // slide to the right when ON
        ].join(" ")}
      />
    </button>
  );
}
