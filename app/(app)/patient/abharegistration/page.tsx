"use client";

import React, { useState } from "react";
import AadhaarStep from "@/components/abha/AadhaarStep";
import ConsentStep from "@/components/abha/ConsentStep";
import OtpStep from "@/components/abha/OtpStep";
import AddressStep from "@/components/abha/AddressStep";
import CompareStep from "@/components/abha/CompareStep";
import ConfirmStep from "@/components/abha/ConfirmStep";
import ProgressBar from "@/components/abha/ProgressBar";

const STEPS = ["Aadhaar", "Consent", "OTP", "Address", "Compare", "Confirm"];

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

export default function AbhaRegistrationPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AbhaRegistrationData>({
    aadhaar: "",
    patientName: "",
    staffName: "Reception User", // TODO: inject session user
    otp: "",
    mobile: "",
    chosenAddress: "",
    abhaAddress: "",
    uhid: "",
  });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const update = (patch: Partial<AbhaRegistrationData>) =>
    setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">ABHA Registration Wizard</h1>
      <ProgressBar step={step} total={STEPS.length} />

      <div className="rounded-lg border bg-white shadow p-6">
        {step === 0 && <AadhaarStep data={form} onChange={update} onNext={next} />}
        {/* {step === 1 && <ConsentStep data={form} onChange={update} onNext={next} onBack={back} />} */}
        {step === 1 && <OtpStep data={form} onChange={update} onNext={next} onBack={back} />}
        {step === 2 && <AddressStep data={form} onChange={update} onNext={next} onBack={back} />}
        {step === 3 && <CompareStep data={form} onChange={update} onNext={next} onBack={back} />}
        {step === 4 && <ConfirmStep data={form} />}
      </div>
    </div>
  );
}
