"use client";

import React from "react";
import CompareStep from "@/components/abha/CompareStep";
import type { AbhaVerificationData } from "./VerifyAbhaFlow";
import { RestartButton } from "@/components/abha/restart";

/**
 * Wrapper for CompareStep, shielding VerifyAbhaFlow from registration types.
 * Adds a Restart button at the top-right corner and makes it wider.
 */
export default function VerifyCompareStep(props: {
  data: AbhaVerificationData;
  onChange: (patch: Partial<AbhaVerificationData>) => void;
  onNext: () => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="ui-card  relative drop-shadow-2xl space-y-6 p-6 w-[800px] h-[600px] mx-auto">
      {/* Restart button */}
      <RestartButton onRestart={props.onRestart} />

      {/* Compare content */}
          
          <div className="max-w-4xl mx-auto w-full">
            <CompareStep
              data={props.data as any}
              onChange={props.onChange as any}
              onNext={props.onNext}
              onBack={props.onBack}
            />
          </div>
    </div>
  );
}
