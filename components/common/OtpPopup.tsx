"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type OtpPopupProps = {
  open: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  contact: string;
  type?: "email" | "mobile";
};

export default function OtpPopup({
  open,
  onClose,
  onVerify,
  contact,
  type = "mobile",
}: OtpPopupProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  /* ------------------------------ Focus Logic ------------------------------ */
  useEffect(() => {
    if (open && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [open]);

  /* ------------------------------- Timer ------------------------------- */
  useEffect(() => {
    if (!open) return;
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, timer]);

  /* ---------------------------- Reset on open ---------------------------- */
  useEffect(() => {
    if (open) {
      setOtp(["", "", "", "", "", ""]);
      setTimer(60);
      setCanResend(false);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(""));
      inputsRef.current[5]?.focus();
    }
  };

  const handleVerify = () => {
    const entered = otp.join("");
    if (entered.length === 6) onVerify(entered);
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[min(90vw,380px)] bg-[#fffdf7] rounded-2xl shadow-lg border border-gray-200 p-6 relative">
        {/* Close */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close OTP popup"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h2 className="text-base font-semibold mb-1 text-gray-800">
          Enter OTP
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter the 6-digit OTP sent to your{" "}
          {type === "email" ? "email" : "mobile"}:{" "}
          <span className="font-medium">{contact}</span>
        </p>

        {/* OTP Inputs */}
        <div
          className="flex justify-between mb-5"
          onPaste={handlePaste}
          role="group"
          aria-label="OTP input boxes"
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
  inputsRef.current[i] = el;
}}

              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="w-10 h-10 text-center text-lg font-medium rounded-md border border-gray-300 focus:border-gray-700 focus:outline-none"
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-blue-600 hover:underline"
              >
                Resend OTP
              </button>
            ) : (
              <span>Resend in {timer}s</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-40"
              onClick={handleVerify}
              disabled={otp.join("").length < 6}
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
