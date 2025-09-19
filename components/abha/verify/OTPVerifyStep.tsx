"use client";
import React, { useRef, useState } from "react";
import { RestartButton } from "@/components/abha/restart";

export default function OTPVerifyStep({
  onNext,
  onBack,
  onRestart,
}: {
  onNext: () => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1); // only 1 digit
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const otpValue = otp.join("");
  const ready = otpValue.length === 6 && otp.every((d) => d !== "");

  return (
    <div className="ui-card p-4 relative drop-shadow-2xl space-y-6">
        <RestartButton onRestart={onRestart} />
      <label className="text-sm font-medium text-gray-700">Enter 6-digit OTP sent to your Aadhaar linked mobile number</label>
      {/* OTP boxes */}
      <div className="flex gap-2 mt-2 justify-left">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="w-10 h-12 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-[#66ad45] focus:outline-none"
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-left gap-6 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100  hover:bg-gray-200 text-sm"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={onNext}
          className={`px-4 py-2 rounded-md text-white  text-sm font-medium ${
            ready
              ? "bg-[#66ad45] hover:bg-[#79b35e]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Verify OTP
        </button>
      </div>
    </div>
  );
}
