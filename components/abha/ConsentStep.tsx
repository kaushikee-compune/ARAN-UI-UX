"use client";
import React, { useState } from "react";
import type { AbhaRegistrationData } from "@/app/(app)/patient/abharegistration/page";

export default function ConsentStep({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: AbhaRegistrationData;
  onChange: (patch: Partial<AbhaRegistrationData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [checked, setChecked] = useState(Array(7).fill(false));
  const allAgreed = checked.every(Boolean);

  return (
    <div className="space-y-4">
      <div className="font-semibold">Consent</div>
      {Array.from({ length: 7 }).map((_, i) => (
        <label key={i} className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked[i]}
            onChange={() =>
              setChecked((c) => c.map((v, j) => (j === i ? !v : v)))
            }
          />
          {i === 5
            ? `I acknowledge ${data.staffName} is assisting me.`
            : i === 6
            ? `I, ${data.patientName || "____"}, consent to share my details.`
            : `Consent point ${i + 1}`}
        </label>
      ))}
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 border rounded-md">
          Back
        </button>
        <button
          disabled={!allAgreed}
          onClick={onNext}
          className="px-4 py-2 rounded-md text-white bg-[#02066b] hover:bg-[#1a1f91]"
        >
          Generate OTP
        </button>
      </div>
    </div>
  );
}
