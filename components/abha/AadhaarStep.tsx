"use client";

import React, { useState } from "react";
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

  const allConsented = Object.values(consents).every(Boolean);
  const ready = data.aadhaar.length === 12 && data.patientName && consents.point2 == false;

  const formatAadhaar = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 12);
    if (digits.length < 12) return digits; // only show plain until 12 entered
    return `XXXX-XXXX-${digits.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Aadhaar + Name Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-1">
          <label className="text-xs text-gray-600">Aadhaar Number</label>
          <input
            type="text"
            className="ui-input"
            value={formatAadhaar(data.aadhaar)}
            onChange={(e) => onChange({ aadhaar: e.target.value })}
            placeholder="Enter 12-digit Aadhaar number"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-xs text-gray-600">Beneficiary Name</label>
          <input
            type="text"
            className="ui-input border-3"
            value={data.patientName}
            onChange={(e) => onChange({ patientName: e.target.value })}
            placeholder="Enter benefiaciary name"
          />
        </div>
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
