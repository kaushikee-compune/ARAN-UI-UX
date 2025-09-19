"use client";
import React, { useState } from "react";
import { RestartButton } from "@/components/abha/restart";


type Candidate = {
  name: string;
  gender: string;
  abhaNumberMasked: string;
};

export default function MobileInputStep({
  onNext,
  onBack,
  onRestart,
}: {
  onNext: () => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [mobile, setMobile] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  // Mock candidates (would come from backend)
  const candidates: Candidate[] = [
    {
      name: "Ravi Sharma",
      gender: "Male",
      abhaNumberMasked: "XX-XXXX-XXXX-1234",
    },
    {
      name: "Anita Kumari",
      gender: "Female",
      abhaNumberMasked: "XX-XXXX-XXXX-5678",
    },
  ];

  const isMobileValid = /^[0-9]{10}$/.test(mobile);
  const canProceed = isMobileValid && captcha && selected !== null;

  return (
    <div className="ui-card drop-shadow-lg relative p-4 space-y-4">
       <RestartButton onRestart={onRestart} />
      <h2 className="text-lg font-semibold">Verify with Mobile Number</h2>

      <input
        type="tel"
        value={mobile}
        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
        placeholder="10-digit mobile"
        maxLength={10}
        className="ui-input"
      />

      

      {/* Show candidates only when mobile is valid */}
      {isMobileValid && (
        <div className="space-y-2">
          <p>Found 2 ABHA profile(s) linked to this mobile number</p>
          {candidates.map((c, idx) => (
            <label
              key={idx}
              className={`block border p-2 rounded-md cursor-pointer ${
                selected === idx ? "border-[#66ad45] bg-blue-50" : "border-gray-300"
              }`}
            >
              <input
                type="radio"
                checked={selected === idx}
                onChange={() => setSelected(idx)}
                className="mr-2"
              />
              <span className="font-medium">{c.name}</span>, {c.gender}<br></br> 
               <span className="text-gray-600">{c.abhaNumberMasked}</span>
              
             
            </label>
          ))}
        </div>
      )}

      <input
        type="text"
        value={captcha}
        onChange={(e) => setCaptcha(e.target.value)}
        placeholder="Captcha box will come here."
        className="ui-input"
      />

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline">
          Back
        </button>
        <button onClick={onNext} 
        className={`px-4 py-2 rounded-md text-white  text-sm font-medium ${
            canProceed
              ? "bg-[#66ad45] hover:bg-[#79b35e]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        
        disabled={!canProceed}>
          Generate OTP
        </button>
      </div>
    </div>
  );
}
