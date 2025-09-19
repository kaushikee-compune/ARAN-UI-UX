"use client";
import React, { useRef, useState } from "react";
import { RestartButton } from "@/components/abha/restart";


export default function AadhaarInputStep({
  onNext,
  onBack,
  onRestart,
}: {
  onNext: () => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [aadhaar, setAadhaar] = useState(["", "", ""]); // 3 segments
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4); // only 4 digits
    const newAadhaar = [...aadhaar];
    newAadhaar[index] = digits;
    setAadhaar(newAadhaar);

    if (digits.length === 4 && index < 2) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && aadhaar[index].length === 0 && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const ready = aadhaar.join("").length === 12;

  return (
    <div className="ui-card drop-shadow-lg relative p-4 space-y-4">
       <RestartButton onRestart={onRestart} />
      <label className="text-xs text-gray-600">Aadhaar Number</label>

      {/* Segmented input */}
      <div className="flex gap-2">
        {aadhaar.map((segment, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type={i < 2 ? "password" : "text"} // mask first 2 segments
            inputMode="numeric"
            maxLength={4}
            className="ui-input w-16 text-center tracking-widest"
            value={segment}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline">
          Back
        </button>
       
        <button
          onClick={onNext}
          disabled={!ready}
          className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
            ready
              ? "bg-[#66ad45] hover:bg-[#8dd869]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Generate OTP
        </button>
      </div>
    </div>
  );
}
