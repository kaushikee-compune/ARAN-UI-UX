"use client";
import React from "react";
import Image from "next/image";
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
  // Mocked ABDM data
  const abdmData = {
    name: "Kaushikee Priya Pal",
    gender: "Female",
    dob: "1973-01-09",
    age: 52,
    abhaNumber: "91-4106-1760-7727",
    abhaAddress: "aran.comp2@sbx",
    address: "Bangalore, Karnataka - 560037",
  };

  // Mocked system record (already registered)
  const systemPatient = {
    name: "Kaushikee Priya Pal",
    gender: "Female",
    dob: "1973-01-09",
    phone: "9972826000",
    address: "Bangalore, Karnataka - 560037",
    abhaNumber: "91-4106-1760-7727",
    abhaAddress: "aran.comp2@sbx",
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left Panel: ABDM Data */}
      <div className="border rounded-lg p-4 bg-gray-50 space-y-4 shadow-sm">
        <div className="font-semibold text-lg mb-2">ABDM Data</div>

        {/* ABHA Card Preview */}
        <div className="flex justify-center">
          <Image
            src="/ABHA-Card.png" // put your uploaded file into /public as ABHA-Card.png
            alt="ABHA Card"
            width={300}
            height={180}
            className="rounded-lg border shadow"
          />
        </div>

        <div className="flex justify-center">
          <button
            className="mt-2 px-4 py-2 rounded-md bg-[#02066b] text-white hover:bg-[#1a1f91] text-sm"
            onClick={() => alert("Download ABHA card")}
          >
            Download ABHA Card
          </button>
        </div>

        {/* ABDM Demographics */}
        <div className="text-sm space-y-1">
          <div><strong>Name:</strong> {abdmData.name}</div>
          <div><strong>Gender:</strong> {abdmData.gender}</div>
          <div><strong>Date of Birth:</strong> {abdmData.dob} ({abdmData.age} yrs)</div>
          <div><strong>ABHA Number:</strong> {abdmData.abhaNumber}</div>
          <div><strong>ABHA Address:</strong> {abdmData.abhaAddress}</div>
          <div><strong>Address:</strong> {abdmData.address}</div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => {
              const newUhid =
                "UHID-" + Math.floor(100000 + Math.random() * 900000);
              onChange({ uhid: newUhid });
              onNext();
            }}
            className="mt-3 px-4 py-2 rounded-md text-white bg-[#66ad45] hover:bg-green-700"
          >
            Register as New
          </button>
        </div>
      </div>

      {/* Right Panel: System Records */}
      <div className="border rounded-lg p-4 bg-gray-50 space-y-4 shadow-sm">
        <div className="font-semibold text-lg mb-2">System Records</div>
        <div className="text-sm space-y-1">
          <div><strong>Name:</strong> {systemPatient.name}</div>
          <div><strong>Gender:</strong> {systemPatient.gender}</div>
          <div><strong>Date of Birth:</strong> {systemPatient.dob}</div>
          <div><strong>Phone:</strong> {systemPatient.phone}</div>
          <div><strong>ABHA Number:</strong> {systemPatient.abhaNumber}</div>
          <div><strong>ABHA Address:</strong> {systemPatient.abhaAddress}</div>
          <div><strong>Address:</strong> {systemPatient.address}</div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => {
              onChange({ uhid: "UHID-EXISTING-123456" }); // mock link
              onNext();
            }}
            className="mt-3 px-4 py-2 rounded-md text-white bg-[#02066b] hover:bg-[#1a1f91]"
          >
            Link to Existing
          </button>
        </div>
      </div>
    </div>
  );
}
