"use client";

import React from "react";
import CompareStep from "@/components/abha/CompareStep";
import type { AbhaVerificationData } from "./VerifyAbhaFlow";
import { RestartButton } from "@/components/abha/restart";

/**
 * Wrapper for CompareStep, shielding VerifyAbhaFlow from registration types.
 * Adds a Restart button at the top-right corner.
 */
export default function VerifyCompareStep(props: {
  data: AbhaVerificationData;
  onChange: (patch: Partial<AbhaVerificationData>) => void;
  onNext: () => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  return (
     <div className="ui-card relative drop-shadow-2xl space-y-6 max-w-5xl mx-auto p-6">
  <RestartButton onRestart={props.onRestart} />

  <div className="max-w-4xl mx-auto w-full">
          {/* Restart button */}
        

          {/* Compare content */}
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
