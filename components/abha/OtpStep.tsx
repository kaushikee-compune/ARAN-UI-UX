"use client";

import React, { useRef } from "react";
import type { AbhaRegistrationData } from "@/app/(app)/patient/abharegistration/page";


type OtpStepProps = {
  data: AbhaRegistrationData;
  onChange: (patch: Partial<AbhaRegistrationData>) => void;
  onNext: () => void;
  onBack: () => void;
  
};




export default function OtpStep({ data, onChange, onNext, onBack}: OtpStepProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "").slice(-1); // only last digit
    const otpArray = data.otp.split("").concat(Array(6).fill("")).slice(0, 6);
    otpArray[index] = digits;
    const newOtp = otpArray.join("").slice(0, 6);
    onChange({ otp: newOtp });

    if (digits && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !data.otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isMobileValid = /^[0-9]{10}$/.test(data.mobile);
  const ready = data.otp.length === 6 && isMobileValid;

  return (
    <div className="space-y-6">
      
      <div>
        <label className="text-sm font-medium text-gray-700">Enter 6-digit OTP sent to your Aadhaar linked mobile number</label>
        <div className="flex gap-2 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="w-10 h-12 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-[#66ad45] focus:outline-none"
              value={data.otp[i] || ""}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Mobile Number</label>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          className="ui-input mt-1"
          placeholder="Enter 10-digit mobile number"
          value={data.mobile}
          onChange={(e) => onChange({ mobile: e.target.value.replace(/\D/g, "") })}
        />
        {!isMobileValid && data.mobile.length > 0 && (
          <p className="text-xs text-red-500 mt-1">
            Enter your preferred mobile number
          </p>
        )}
        <label className="text-sm text-gray-500">This number will be used for communication.</label>
       
      </div>

      <div className="flex justify-between mt-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 hover:bg-gray-200 text-sm"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={onNext}
          className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
            ready
              ?  "bg-[#66ad45] hover:bg-[#79b35e]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Verify OTP
        </button>
      </div>
    </div>
  );
}
