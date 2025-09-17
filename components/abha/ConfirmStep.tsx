"use client";
import React from "react";
import type { AbhaRegistrationData } from "@/app/(app)/patient/abharegistration/page";

export default function ConfirmStep({ data }: { data: AbhaRegistrationData }) {
  return (
    <div className="text-center space-y-4">
      <div className="text-lg font-semibold">ABHA Created & Patient Registered</div>
      <div>UHID: <b>{data.uhid}</b></div>
      <div>ABHA Address: <b>{data.chosenAddress}</b></div>
      <div className="text-sm text-gray-600">Proceed to next steps (Rx, Appointment, Payment…)</div>
    </div>
  );
}
