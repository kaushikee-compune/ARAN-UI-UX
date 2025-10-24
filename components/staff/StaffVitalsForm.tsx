"use client";

import React, { useState } from "react";
import Image from "next/image";

/**
 * StaffVitalsForm — lightweight vitals-only section
 * Same UI as doctor's DigitalRxForm vitals area, but no other medical fields.
 */

export type StaffVitals = {
  temperature?: string;
  bpSys?: string;
  bpDia?: string;
  spo2?: string;
  pulse?: string;
  weight?: string;
  height?: string;
  [key: string]: string | undefined;
};

export default function StaffVitalsForm({
  value,
  onChange,
}: {
  value: StaffVitals;
  onChange: (v: StaffVitals) => void;
}) {
  const [showVitalsConfig, setShowVitalsConfig] = useState(false);
  const [vitalConfig, setVitalConfig] = useState<Record<string, boolean>>({
    temperature: true,
    bpSys: true,
    bpDia: true,
    spo2: true,
    pulse: true,
    weight: true,
    height: true,
  });

  const vitalOptions: Record<string, { label: string; placeholder?: string }> = {
    temperature: { label: "Temperature (°C)", placeholder: "98.6" },
    bpSys: { label: "BP Systolic (mmHg)", placeholder: "120" },
    bpDia: { label: "BP Diastolic (mmHg)", placeholder: "80" },
    spo2: { label: "SpO₂ (%)", placeholder: "98" },
    pulse: { label: "Pulse (bpm)", placeholder: "80" },
    weight: { label: "Weight (kg)", placeholder: "65" },
    height: { label: "Height (cm)", placeholder: "165" },
  };

  const patch = (key: keyof StaffVitals, v: string) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <section className="ui-card p-5 bg-white shadow-sm rounded-md">
      {/* Header with Settings */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/lifeline-in-a-heart-outline.png"
            alt=""
            width={18}
            height={18}
            className="opacity-80"
          />
          <h3 className="text-sm font-semibold">Vitals</h3>
        </div>

        <button
          type="button"
          onClick={() => setShowVitalsConfig((v) => !v)}
          className="text-gray-500 hover:text-gray-800"
          title="Customize vitals fields"
        >
          <Image
            src="/icons/settings.png"
            alt="Settings"
            width={18}
            height={18}
          />
        </button>
      </div>

      {/* Vitals Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(vitalConfig)
          .filter(([_, show]) => show)
          .map(([key]) => {
            const option = vitalOptions[key];
            return (
              <LabeledInput
                key={key}
                label={option.label}
                value={value[key] || ""}
                placeholder={option.placeholder}
                onChange={(v) => patch(key as keyof StaffVitals, v)}
              />
            );
          })}
      </div>

      {/* ⚙️ Dropdown for adding/removing fields */}
      {showVitalsConfig && (
        <div className="absolute mt-2 right-3 z-50 w-64 bg-white border border-gray-200 rounded-md shadow-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600">
            Select fields to show:
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            {Object.keys(vitalOptions).map((key) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={vitalConfig[key]}
                  onChange={() =>
                    setVitalConfig((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                />
                {vitalOptions[key].label}
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------- Input Field ------------------------------- */
function LabeledInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex items-center border-gray-300 pb-0.5 gap-2">
      <label className="text-sm text-gray-600 w-40 shrink-0">{label}</label>
      <input
        className="flex-1 max-w-[80px] bg-transparent border-b border-gray-300 outline-none px-1 py-0.5 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-blue-500"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
