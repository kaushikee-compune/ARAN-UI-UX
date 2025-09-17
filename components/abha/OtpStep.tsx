"use client";
import React, { useState } from "react";
import type { AbhaRegistrationData } from "@/app/(app)/patient/abharegistration/page";

export default function OtpStep({
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
  const [otp, setOtp] = useState("");
  const valid = otp.length === 6 && /^\d{10}$/.test(data.mobile);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            maxLength={1}
            className="w-10 h-10 border rounded text-center"
            value={otp[i] || ""}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "");
              setOtp((prev) => {
                const arr = prev.split("");
                arr[i] = d;
                return arr.join("");
              });
            }}
          />
        ))}
      </div>
      <div>
        <label className="text-sm">Mobile</label>
        <input
          className="ui-input"
          value={data.mobile}
          onChange={(e) => onChange({ mobile: e.target.value.replace(/\D/g, "") })}
        />
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 border rounded-md">
          Back
        </button>
        <button
          disabled={!valid}
          onClick={() => {
            onChange({ otp });
            onNext();
          }}
          className="px-4 py-2 rounded-md text-white bg-[#02066b] hover:bg-[#1a1f91]"
        >
          Verify
        </button>
      </div>
    </div>
  );
}
