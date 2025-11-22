"use client";

import { useState, useEffect } from "react";

export default function GeneralVitalsForm({
  onSubmit,
}: {
  onSubmit: (v: any) => void;
}) {
  const [form, setForm] = useState({
    temperature: "",
    bp: "",
    pulse: "",
    spo2: "",
    weight: "",
    height: "",
    bmi: "",
  });

  // Auto BMI
  useEffect(() => {
    const h = Number(form.height || "");
    const w = Number(form.weight || "");
    if (h > 0 && w > 0) {
      const bmi = w / Math.pow(h / 100, 2);
      setForm((f) => ({ ...f, bmi: bmi.toFixed(1) }));
    }
  }, [form.height, form.weight]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold mb-2">Vitals (General Medicine)</div>

      <div className="grid grid-cols-2 gap-3">
        {["temperature", "pulse", "bp", "spo2", "weight", "height", "bmi"].map(
          (key) => (
            <div key={key} className="grid gap-1">
              <label className="text-[11px] text-gray-600">
                {label(key)}
              </label>
              <input
                className="ui-input"
                value={(form as any)[key]}
                readOnly={key === "bmi"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
              />
            </div>
          )
        )}
      </div>

      <button
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md"
        onClick={() => onSubmit(form)}
      >
        Submit Vitals
      </button>
    </div>
  );
}

const label = (k: string) =>
  ({
    temperature: "Temperature (°C)",
    pulse: "Pulse (bpm)",
    bp: "Blood Pressure",
    spo2: "SpO₂ (%)",
    weight: "Weight (kg)",
    height: "Height (cm)",
    bmi: "BMI",
  }[k]);
