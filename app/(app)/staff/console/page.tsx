"use client";

import React, { useState } from "react";
import Image from "next/image";
import StaffVitalsForm from "@/components/staff/StaffVitalsForm";

/**
 * STAFF CONSOLE LAYOUT
 * Layout only — mirrors doctor’s console UI (top bar, right toolbar, preview paper)
 * No form logic or hooks yet. We’ll add Digital Rx (Vitals only) later.
 */

export default function StaffConsolePage() {
  const [activeTop, setActiveTop] = useState<
    "Vitals" | "consent" | "queue"
  >("Vitals");

  const [vitals, setVitals] = useState({});

  const patient = {
    name: "Ms Shampa Goswami",
    age: "52 yrs",
    gender: "Female",
    abhaNumber: "91-5510-2061-4469",
    abhaAddress: "shampa.go@sbx",
  };

  return (
    <div className="space-y-3">
      {/* ------------------------------- Header Panel ------------------------------- */}
      {/* <div className="ui-card px-5 py-1 mt-2 mx-4">
        <div className="flex items-center gap-2">
          <TopMenuButton
            active={activeTop === "Vitals"}
            onClick={() => setActiveTop("Vitals")}
          >
            Record Vitals
          </TopMenuButton>
          <TopMenuButton
            active={activeTop === "consent"}
            onClick={() => setActiveTop("consent")}
          >
            Consent
          </TopMenuButton>
          <TopMenuButton
            active={activeTop === "queue"}
            onClick={() => setActiveTop("queue")}
          >
            OPD Queue
          </TopMenuButton>

          <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
            <span>Staff Console</span>
          </div>
        </div>
      </div> */}

      {/* ------------------------------- Main Layout ------------------------------- */}
      <div className="mt-2 px-1 md:px-6 lg:px-8">
        <div className="grid gap-2 items-start grid-cols-1 md:grid-cols-[minmax(0,1fr)_72px]">
          {/* LEFT — Patient Preview Paper (with vitals inside) */}
          <PreviewPaper patient={patient}>
            <StaffVitalsForm value={vitals} onChange={setVitals} />
          </PreviewPaper>

          {/* RIGHT — Sticky Toolbar */}
          <aside className="hidden md:block sticky top-20 self-start w-[72px]">
            <div className="flex flex-col items-center gap-4">
              <div className="ui-card p-1.5 w-[58px] flex flex-col items-center gap-2">
                <RoundPill
                  img="/icons/digitalrx.png"
                  label="Digital Rx"
                  variant="green"
                />
                <RoundPill img="/icons/save.png" label="Save" variant="gray" />
                <RoundPill
                  img="/icons/print.png"
                  label="Print"
                  variant="gray"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Patient Preview Paper --------------------------- */
function PreviewPaper({
  patient,
  children,
}: {
  patient: typeof mockPatient;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 md:sticky md:top-20 self-start">
      <div
        className="relative mx-auto bg-white border border-gray-300 rounded-xl shadow-sm overflow-visible"
        style={{
          minHeight: 680,
          background: "linear-gradient(180deg,#ffffff 0%,#fcfcfc 100%)",
        }}
      >
        <div className="relative z-0 p-4 md:p-6">
          {/* Patient Header */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-start">
            <div className="min-w-0 pr-3">
              <div className="text-xs text-gray-500 mb-1">Patient</div>
              <div className="text-sm font-semibold">{patient.name}</div>
              <div className="text-xs text-gray-700 mt-0.5">
                {patient.gender} • {patient.age}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                ABHA No: {patient.abhaNumber}
              </div>
              <div className="text-xs text-gray-600">
                ABHA Address: {patient.abhaAddress}
              </div>
            </div>

            <Image
              src="/icons/logo.png"
              alt="Clinic Logo"
              width={40}
              height={40}
            />

            <div className="flex items-start justify-end pl-3">
              
            </div>
          </div>

          <div className="my-3 border-t border-gray-200" />

          {/* Vitals or other form content */}
          {children ? (
            <div className="space-y-4">{children}</div>
          ) : (
            <div className="ui-card p-4 text-sm text-gray-500 min-h-[320px]">
              (Digital Rx – Vitals section will appear here.)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- UI Utilities ------------------------------- */
function TopMenuButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={[
        "px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition",
        active ? "bg-gray-900 text-white" : "hover:bg-gray-100",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

type PillVariant = "green" | "gray";

const VARIANT = {
  green:
    "border-green-500 text-green-700 hover:bg-green-50 focus-visible:ring-green-400",
  gray: "border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400",
} as const;

function RoundPill({
  img,
  label,
  variant = "gray",
}: {
  img: string;
  label: string;
  variant?: PillVariant;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      type="button"
      className={[
        "group relative grid place-items-center overflow-visible",
        "w-9 h-9 rounded-xl border-1 bg-white shadow-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        VARIANT[variant],
      ].join(" ")}
    >
      <Image
        src={img}
        alt={label}
        width={18}
        height={18}
        className="pointer-events-none"
      />
      <span
        className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[11px] text-black font-medium 
                   opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-20"
      >
        {label}
      </span>
    </button>
  );
}

/* Mock patient for demo */
const mockPatient = {
  name: "Ms Shampa Goswami",
  age: "52 yrs",
  gender: "Female",
  abhaNumber: "91-5510-2061-4469",
  abhaAddress: "shampa.go@sbx",
};
