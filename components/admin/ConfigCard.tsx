"use client";

import React from "react";

export type ConfigCardProps = {
  title: string;
  desc: string;
  onClick?: () => void;
  disabled?: boolean;
};

/**
 * A simple, reusable configuration card for Admin setup pages.
 * - Used in /admin/branch-setup, /admin/clinic-setup, etc.
 * - Matches the ui-card styling pattern.
 */
export default function ConfigCard({
  title,
  desc,
  onClick,
  disabled = false,
}: ConfigCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "ui-card text-left transition-all duration-200 p-4 rounded-xl border shadow-sm",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-md hover:-translate-y-0.5",
      ].join(" ")}
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
        <p className="text-sm text-gray-600 leading-snug">{desc}</p>
      </div>
      {!disabled && (
        <div className="mt-3 text-[--secondary] text-sm font-medium">
          Configure →
        </div>
      )}
    </button>
  );
}
