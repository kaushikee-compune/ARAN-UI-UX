"use client";

import React, { useState } from "react";
import AadhaarStep from "@/components/abha/AadhaarStep";
import OtpStep from "@/components/abha/OtpStep";
import AddressStep from "@/components/abha/AddressStep";
import CompareStep from "@/components/abha/CompareStep";
import ConfirmStep from "@/components/abha/ConfirmStep";
import ProgressBar from "@/components/abha/ProgressBar";
import { RotateCcw } from "lucide-react";

const STEPS = ["Aadhaar", "OTP", "Address", "Compare", "Confirm"];

export type AbhaRegistrationData = {
  aadhaar: string;
  patientName: string;
  staffName: string;
  otp: string;
  mobile: string;
  chosenAddress: string;
  abhaAddress: string;
  uhid: string;
};

const initialForm: AbhaRegistrationData = {
  aadhaar: "",
  patientName: "",
  staffName: "Reception User", // TODO: inject from session later
  otp: "",
  mobile: "",
  chosenAddress: "",
  abhaAddress: "",
  uhid: "",
};

export default function AbhaRegistrationPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AbhaRegistrationData>(initialForm);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const restart = () => {
    setStep(0);
    setForm(initialForm); // reset all data
  };
  const update = (patch: Partial<AbhaRegistrationData>) =>
    setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">ABHA Registration Wizard</h1>
      <ProgressBar step={step} total={STEPS.length} />

      <div className="relative rounded-lg drop-shadow-lg bg-white shadow p-6">
        {/* Restart button: only show from step > 0 */}
        {step > 0 && (
          <button
            type="button"
            onClick={restart}
            className="absolute top-3 right-3 text-gray-500 hover:text-[#02066b]"
            title="Restart from Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {step === 0 && <AadhaarStep data={form} onChange={update} onNext={next} />}
        {step === 1 && <OtpStep data={form} onChange={update} onNext={next} onBack={back} />}
        {step === 2 && <AddressStep data={form} onChange={update} onNext={next} onBack={back} />}
        {step === 3 && <CompareStep data={form} onChange={update} onNext={next} onBack={back} />}
        {step === 4 && <ConfirmStep data={form} />}
      </div>
    </div>
  );
}
