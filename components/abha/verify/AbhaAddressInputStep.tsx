"use client";
import React, { useState } from "react";
import { RestartButton } from "@/components/abha/restart";

export default function AbhaAddressInputStep({
  onNext,
  onBack,
  onRestart,
}: {
  onNext: () => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [address, setAddress] = useState("");

  // Basic validation: must contain "@" with text before & after
  const isValidAddress = (() => {
    const trimmed = address.trim();
    const parts = trimmed.split("@");
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  })();

  return (
    <div className="ui-card relative drop-shadow-lg p-4 space-y-4">
      <RestartButton onRestart={onRestart} />
      <h2 className="text-lg font-semibold">Enter ABHA Address</h2>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="username@sbx"
        className="ui-input"
      />

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline">
          Back
        </button>
        <button
          onClick={onNext}
          className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
            isValidAddress
              ? "bg-[#66ad45] hover:bg-[#79b35e]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
          disabled={!isValidAddress}
        >
          Generate OTP
        </button>
      </div>
    </div>
  );
}
