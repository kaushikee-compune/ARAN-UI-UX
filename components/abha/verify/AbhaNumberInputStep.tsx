"use client";
import React, { useState } from "react";
import { RestartButton } from "@/components/abha/restart";

export default function AbhaNumberInputStep({
  onNext,
  onBack,
  onRestart,
}: {
  onNext: () => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [parts, setParts] = useState(["", "", "", ""]);

  const handleChange = (i: number, v: string) => {
    const digits = v.replace(/\D/g, ""); // allow only numbers
    const maxLen = i === 0 ? 2 : 4;
    const next = [...parts];
    next[i] = digits.slice(0, maxLen); // enforce max length
    setParts(next);
  };

  // Check if total digits = 14
  const totalLength = parts.join("").length;
  const isValid = totalLength === 14;

  return (
    <div className="ui-card drop-shadow-lg relative p-4 space-y-4">
      <RestartButton onRestart={onRestart} />
      <h2 className="text-lg font-semibold">Enter ABHA Number</h2>

      {/* Segmented Input */}
      <div className="flex gap-2">
        {parts.map((p, i) => (
          <input
            key={i}
            value={p}
            onChange={(e) => handleChange(i, e.target.value)}
            maxLength={i === 0 ? 2 : 4}
            inputMode="numeric"
            className="ui-input w-16 text-center tracking-widest"
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
            isValid
              ? "bg-[#66ad45] hover:bg-[#79b35e]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Generate OTP
        </button>
      </div>
    </div>
  );
}
