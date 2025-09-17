"use client";
import React, { useState } from "react";
import type { AbhaRegistrationData } from "@/app/(app)/patient/abharegistration/page";

export default function AddressStep({
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
  const suggestions = [
    `${data.patientName.toLowerCase()}_1990@sbx`,
    `${data.patientName.toLowerCase()}_01@sbx`,
    `demo123@sbx`,
  ];
  const [choice, setChoice] = useState("9123456789@sbx");

  return (
    <div className="space-y-4">
      <div>
        <div className="font-semibold">System Generated</div>
        <label>
          <input
            type="radio"
            checked={choice === "9123456789@sbx"}
            onChange={() => setChoice("9123456789@sbx")}
          />{" "}
          9123456789@sbx
        </label>
      </div>
      <div>
        <div className="font-semibold">Suggestions</div>
        {suggestions.map((s) => (
          <label key={s} className="block">
            <input
              type="radio"
              checked={choice === s}
              onChange={() => setChoice(s)}
            />{" "}
            {s}
          </label>
        ))}
      </div>
      <div>
        <label className="text-sm">Custom</label>
        <input
          className="ui-input"
          onChange={(e) => setChoice(`${e.target.value}@sbx`)}
        />
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 border rounded-md">
          Back
        </button>
        <button
          disabled={!choice}
          onClick={() => {
            onChange({ chosenAddress: choice });
            onNext();
          }}
          className="px-4 py-2 rounded-md text-white bg-[#02066b] hover:bg-[#1a1f91]"
        >
          Create ABHA
        </button>
      </div>
    </div>
  );
}
