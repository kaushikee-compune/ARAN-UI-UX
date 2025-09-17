"use client";

import React from "react";
import { AbhaRegistrationData } from "@/app/(app)/patient/abharegistration/page";

type AadhaarStepProps = {
  data: AbhaRegistrationData;
  onChange: (patch: Partial<AbhaRegistrationData>) => void;
  onNext: () => void;
};

export default function AadhaarStep({ data, onChange, onNext }: AadhaarStepProps) {
  const ready = data.aadhaar.length === 12 && data.patientName.trim() !== "";

  return (
    <div className="space-y-4">
      <div className="grid gap-1">
        <label className="text-[12px] text-gray-600">Aadhaar Number (first 8 masked)</label>
        <input
          type="text"
          className="ui-input"
          maxLength={12}
          value={data.aadhaar}
          onChange={(e) => onChange({ aadhaar: e.target.value })}
          placeholder="XXXXXXXX1234"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-[12px] text-gray-600">Patient Name</label>
        <input
          type="text"
          className="ui-input"
          value={data.patientName}
          onChange={(e) => onChange({ patientName: e.target.value })}
          placeholder="Enter patient name"
        />
      </div>

      {/* Consent block */}
      <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
        <p className="font-semibold">Consent (auto-checked)</p>
        <label><input type="checkbox" checked readOnly /> 1. I consent to use Aadhaar for ABHA creation<br></br></label>
        <label><input type="checkbox" readOnly /> 2. I consent to use Aadhaar for ABHA creation<br></br></label>
        <label><input type="checkbox" checked readOnly /> 3. Data will be used only for ABHA<br></br></label>
        <label><input type="checkbox" checked readOnly /> 4. I authorize government systems for verification<br></br></label>
        <label><input type="checkbox" checked readOnly /> 5. I understand the risks of sharing Aadhaar<br></br></label>
        <label><input type="checkbox" checked readOnly /> 6. Verified by {data.staffName}<br></br></label>
        <label><input type="checkbox" checked readOnly /> 7. For patient {data.patientName || "______"}<br></br></label>
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={onNext}
        className={`px-4 py-2 rounded-md text-white ${
          ready ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Generate OTP
      </button>
    </div>
  );
}
