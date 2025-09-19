"use client";
import React, { useState } from "react";

/* Import step modules */
import VerifyModeStep from "./VerifyModeStep";
import AadhaarInputStep from "./AadhaarInputStep";
import MobileInputStep from "./MobileInputStep";
import AbhaNumberInputStep from "./AbhaNumberInputStep";
import AbhaAddressInputStep from "./AbhaAddressInputStep";
import OtpVerifyStep from "./OTPVerifyStep";
import VerifyCompareStep from "./VerifyCompareStep";
import { RestartButton } from "@/components/abha/restart";
import ConfirmStep from "@/components/abha/ConfirmStep";


/* Shared type for flow state */
export type AbhaVerificationData = {
  mode?: "aadhaar" | "mobile" | "abhaNumber" | "abhaAddress";
  aadhaar?: string;
  mobile?: string;
  abhaNumber?: string;
  abhaAddress?: string;
  otp?: string;
  compare?: any; // replace with real type once backend shape is known
};

export default function VerifyAbhaFlow() {
  const [step, setStep] = useState<
    | "mode"
    | "aadhaar"
    | "mobile"
    | "abhaNumber"
    | "abhaAddress"
    | "otp"
    | "compare"
    | "confirm"
  >("mode");

  const [data, setData] = useState<AbhaVerificationData>({});

  const goBack = () => {
    if (step === "mode") return;
    if (step === "otp") {
      setStep(data.mode!); // back to selected mode
    } else if (step === "compare") {
      setStep("otp");
    } else {
      setStep("mode");
    }
  };

  const restart = () => {
  setData({
    aadhaar: "",
    mobile: "",
    abhaNumber: "",
    abhaAddress: "",
    otp: "",
  });
  setStep("mode");
};

  const goNext = (next?: typeof step) => {
    if (next) setStep(next);
    else if (
      step === "aadhaar" ||
      step === "mobile" ||
      step === "abhaNumber" ||
      step === "abhaAddress"
    ) {
      setStep("otp");
    } else if (step === "otp") {
      setStep("compare");
    }
  };

  
  const steps = ["ID Input", "OTP", "Compare"];
  let currentStepIndex = 0;

  if (["aadhaar", "mobile", "abhaNumber", "abhaAddress"].includes(step)) {
    currentStepIndex = 0;
  } else if (step === "otp") {
    currentStepIndex = 1;
  } else if (step === "compare") {
    currentStepIndex = 2;
  }

  return (
    <div className="max-w-lg mx-auto">
      {step !== "mode" && (
        <div className="flex items-center mb-6">
          {steps.map((label, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 ${
                  i <= currentStepIndex
                    ? "bg-[#66ad45] border-[#66ad45] text-white"
                    : "bg-white border-gray-300 text-gray-500"
                } ${
                  currentStepIndex ? "ring-2 ring-offset-2 ring-[#66ad45]" : ""
                }`}
              >
                {i + 1}
              </div>
              {/* <div className="ml-2 text-xs font-medium">{label}</div> */}
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    i < currentStepIndex ? "bg-[#66ad45]" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {step === "mode" && (
        <VerifyModeStep
          onNext={(mode) => {
            setData((d) => ({ ...d, mode }));
            setStep(mode);
          }}
          onBack={goBack}
          
        />
      )}

      {step === "aadhaar" && (
        <AadhaarInputStep onNext={() => goNext("otp")} onBack={goBack}  onRestart={restart} />
      )}

      {step === "mobile" && (
        <MobileInputStep onNext={() => goNext("otp")} onBack={goBack}  onRestart={restart} />
      )}

      {step === "abhaNumber" && (
        <AbhaNumberInputStep onNext={() => goNext("otp")} onBack={goBack} onRestart={restart}/>
      )}

      {step === "abhaAddress" && (
        <AbhaAddressInputStep onNext={() => goNext("otp")} onBack={goBack} onRestart={restart}/>
      )}

      {step === "otp" && (
        <OtpVerifyStep onNext={() => goNext("compare")} onBack={goBack} onRestart={restart} />
      )}

      {step === "compare" && (
        <VerifyCompareStep
          data={data}
          onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
          onNext={() => alert("✅ Verification Complete!")}
          onBack={goBack} 
          onRestart={restart}
        />
      )}
    </div>
  );
}
