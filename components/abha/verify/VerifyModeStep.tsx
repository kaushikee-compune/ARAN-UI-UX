"use client";
import React, { useState } from "react";
import {
  IdCard,       // sleeker Aadhaar icon
  Smartphone,   // modern phone icon
  HeartPlus,       // better than Hash for ABHA Number
  AtSign,       // ABHA Address still works
} from "lucide-react";

export default function VerifyModeStep({
  onNext,
  onBack,
  
}: {
  onNext: (mode: "aadhaar" | "mobile" | "abhaNumber" | "abhaAddress") => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<
    "aadhaar" | "mobile" | "abhaNumber" | "abhaAddress" | null
  >(null);

  const options = [
  {
    key: "aadhaar",
    label: "Aadhaar Number",
    text: "Use your 12-digit Aadhaar number for verification",
    icon: IdCard,
  },
  {
    key: "mobile",
    label: "Mobile Number",
    text: "Verify using your registered mobile number",
    icon: Smartphone,
  },
  {
    key: "abhaNumber",
    label: "ABHA Number",
    text: "Enter your 14-digit ABHA number",
    icon: HeartPlus,
  },
  {
    key: "abhaAddress",
    label: "ABHA Address",
    text: "Provide your ABHA address (username@sbx)",
    icon: AtSign,
  },
] as const;

  return (
    <div className="ui-card p-4 drop-shadow-lg space-y-4">
      {/* <h2 className="text-lg font-semibold">Select Verification Mode</h2> */}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <label
      key={opt.key}
      className={`flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition ${
        selected === opt.key
          ? "border-[#66ad45] bg-blue-50"
          : "border-gray-300 hover:border-[#66ad45]"
      }`}
    >
      <input
        type="radio"
        name="verifyMode"
        checked={selected === opt.key}
        onChange={() => setSelected(opt.key)}
        className="accent-[#66ad45] mt-1"
      />
      <div className="flex gap-3">
        <Icon className="w-6 h-6 text-[#66ad45] shrink-0 mt-0.5" />
        <div>
          <div className="font-medium">{opt.label}</div>
          <div className="text-xs text-gray-500">{opt.text}</div> {/* 👈 render text here */}
        </div>
      </div>
    </label>
          );
        })}
      </div>

      <div className="flex gap-3">
       
        <button
          onClick={() => selected && onNext(selected)}
          className="px-4 py-2 rounded-md text-white bg-[#66ad45] hover:bg-[#8dd869] text-sm font-medium"
          disabled={!selected}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
