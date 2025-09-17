"use client";
import React from "react";

export default function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-2 bg-[#02066b] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
