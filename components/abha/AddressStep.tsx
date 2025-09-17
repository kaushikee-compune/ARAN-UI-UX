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
  const existing = ["9123456789@sbx", "9988776655@sbx"];
  const suggestions = [
    `${data.patientName.toLowerCase() || "demo"}_1990@sbx`,
    `${data.patientName.toLowerCase() || "demo"}_01@sbx`,
    `health123@sbx`,
    `patient_demo@sbx`,
  ];
  const [choice, setChoice] = useState(existing[0]);
  const [customInput, setCustomInput] = useState("");

  const customPreview = customInput ? `${customInput}@sbx` : "";

  return (
    <div className="space-y-6">
      {/* Section 1: Existing ABHA addresses */}
      <div>
        <h2 className="text-md font-semibold text-gray-700 mb-2">
          Your existing ABHA addresses
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {existing.map((addr, idx) => (
            <label
              key={addr}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                choice === addr
                  ? "border-[#02066b] bg-blue-50"
                  : "border-gray-300 hover:border-[#02066b]"
              }`}
            >
              <input
                type="radio"
                name="abhaChoice"
                value={addr}
                checked={choice === addr}
                onChange={() => setChoice(addr)}
                className="h-4 w-4 text-[#02066b] focus:ring-[#02066b]"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">
                  {addr}
                </span>
                {idx === 0 && (
                  <span className="text-xs text-green-600 font-medium">
                    Preferred ABHA address
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Section 2: Suggested ABHA addresses */}
      <div>
        <h2 className="text-md font-semibold text-gray-700 mb-2">
          Suggested ABHA addresses
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {suggestions.map((s) => (
            <label
              key={s}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                choice === s
                  ? "border-[#02066b] bg-blue-50"
                  : "border-gray-300 hover:border-[#02066b]"
              }`}
            >
              <input
                type="radio"
                name="abhaChoice"
                value={s}
                checked={choice === s}
                onChange={() => setChoice(s)}
                className="h-4 w-4 text-[#02066b] focus:ring-[#02066b]"
              />
              <span className="text-sm font-medium text-gray-800">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Section 3: Custom ABHA address */}
      <div>
        <h2 className="text-md font-semibold text-gray-700 mb-2">
          Custom ABHA address
        </h2>
        <input
          className="ui-input"
          placeholder="Enter your custom ABHA (without @sbx)"
          value={customInput}
          onChange={(e) => {
            setCustomInput(e.target.value);
            setChoice(`${e.target.value}@sbx`);
          }}
        />
        {/* Live preview */}
        {customPreview && (
          <p className="mt-2 text-sm text-gray-700">
            Preview:{" "}
            <span className="font-semibold text-[#02066b]">
              {customPreview}
            </span>
          </p>
        )}
        {/* Rules */}
        <div className="mt-3 text-xs text-gray-600 space-y-1">
          <p className="font-semibold">ABHA Address Requirements:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Minimum length - 8 characters</li>
            <li>Maximum length - 18 characters</li>
            <li>
              Special characters allowed - 1 dot (.) and/or 1 underscore (_)
            </li>
            <li>
              Dot and underscore must be in between (not at start or end)
            </li>
            <li>
              Alphanumeric - only numbers, only letters, or combination of both
            </li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
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
