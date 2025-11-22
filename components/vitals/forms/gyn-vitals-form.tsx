"use client";

import { useState, useEffect } from "react";

export default function GynVitalsForm({ onSubmit }: { onSubmit: (v: any) => void }) {
  const [form, setForm] = useState({
    temperature: "",
    bp: "",
    weight: "",
    height: "",
    bmi: "",
    lmp: "",
  });

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
      <div className="text-sm font-semibold mb-2">Vitals (Gynecology)</div>

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Temperature (°C)" field="temperature" form={form} setForm={setForm} />
        <LabeledInput label="BP (mmHg)" field="bp" form={form} setForm={setForm} />
        <LabeledInput label="Weight (kg)" field="weight" form={form} setForm={setForm} />
        <LabeledInput label="Height (cm)" field="height" form={form} setForm={setForm} />
        <LabeledInput label="BMI" field="bmi" form={form} setForm={setForm} readOnly />
        <LabeledInput label="LMP" field="lmp" form={form} setForm={setForm} type="date" />
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

function LabeledInput({
  label,
  field,
  form,
  setForm,
  type = "text",
  readOnly,
}: any) {
  return (
    <div className="grid gap-1">
      <label className="text-[11px] text-gray-600">{label}</label>
      <input
        type={type}
        readOnly={readOnly}
        className="ui-input"
        value={form[field]}
        onChange={(e) => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
      />
    </div>
  );
}
