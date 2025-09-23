"use client";

import React from "react";
import VerifyAbhaFlow from "@/components/abha/verify/VerifyAbhaFlow";

export default function AbhaVerificationPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
  <div className="max-w-lg mx-auto">
    <h1 className="text-xl font-semibold mb-4">ABHA Verification Wizard</h1>
    <VerifyAbhaFlow />
  </div>   
</div>
  );
}
