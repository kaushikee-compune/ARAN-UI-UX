"use client";

import React, { useRef, useState } from "react";
import type { AbhaRegistrationData } from "@/app/(app)/patient/abharegistration/page";

export default function AadhaarStep({
  data,
  onChange,
  onNext,
}: {
  data: AbhaRegistrationData;
  onChange: (patch: Partial<AbhaRegistrationData>) => void;
  onNext: () => void;
}) {
  const [consents, setConsents] = useState({
    point1: true,
    point2: false,
    point3: true,
    point4: true,
    point5: true,
    point6: true,
    point7: true,
  });

  // Split Aadhaar into 3 segments
  const [aadhaarParts, setAadhaarParts] = useState(["", "", ""]);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4); // only digits, max 4
    const newParts = [...aadhaarParts];
    newParts[index] = digits;
    setAadhaarParts(newParts);

    // Update parent state as combined Aadhaar
    onChange({ aadhaar: newParts.join("") });

    if (digits.length === 4 && index < 2) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && aadhaarParts[index].length === 0 && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const allConsented = Object.values(consents).every(Boolean);
  const ready = data.aadhaar.length === 12 && data.patientName && consents.point2 == false;

  return (
    <div className="space-y-6">
      {/* Aadhaar Row */}
      <div className="grid gap-4">
        <div className="grid gap-1">
          <label className="text-xs text-gray-600">Aadhaar Number</label>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type={i < 2 ? "password" : "text"} // first 2 masked
                inputMode="numeric"
                maxLength={4}
                className="ui-input w-20 text-center border  tracking-widest"
                value={aadhaarParts[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Beneficiary Name Row */}
      <div className="grid gap-1">
        <label className="text-xs text-gray-600">Beneficiary Name</label>
        <input
          type="text"
          className="ui-input border-3"
          value={data.patientName}
          onChange={(e) => onChange({ patientName: e.target.value })}
          placeholder="Enter beneficiary name"
        />
      </div>

      {/* Consent points */}
      <div className="ui-card p-4 space-y-2 bg-gray-50">
        {Object.keys(consents).map((key) => (
          <label
            key={key}
            className="flex items-start gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              className="accent-green-600"
              checked={consents[key as keyof typeof consents]}
              onChange={(e) =>
                setConsents((c) => ({
                  ...c,
                  [key]: e.target.checked,
                }))
              }
            />
            <span>
              {key === "point6"
                ? `I, ${data.staffName}, confirm I have explained the consent.`
                : key === "point7"
                ? `${data.patientName || "Patient"} confirms the consent.`
                : `Consent ${key.replace("point", "")}`}
            </span>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          disabled={!ready}
          onClick={onNext}
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
