"use client";
import React from "react";
import type { AbhaRegistrationData } from "@/app/(app)/patient/abharegistration/page";

export default function CompareStep({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: AbhaRegistrationData;
  onChange: (patch: Partial<AbhaRegistrationData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const abdmData = {
    name: "Rahul Sharma",
    gender: "Male",
    dob: "1990-01-01",
    phone: "9xxxxxxxxx",
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="border p-3 bg-gray-50">
        <div className="font-semibold">ABDM Data</div>
        <div>{abdmData.name}</div>
        <div>{abdmData.gender}</div>
        <div>{abdmData.dob}</div>
        <div>{abdmData.phone}</div>
      </div>
      <div className="border p-3 bg-gray-50">
        <div className="font-semibold">System Records</div>
        <div>No match found</div>
        <button
          onClick={() => {
            const newUhid = "UHID-" + Math.floor(100000 + Math.random() * 900000);
            onChange({ uhid: newUhid });
            onNext();
          }}
          className="mt-3 px-4 py-2 rounded-md text-white bg-[#02066b] hover:bg-[#1a1f91]"
        >
          Register New
        </button>
      </div>
    </div>
  );
}
