"use client";

import { useState } from "react";

export default function EyeVitalsForm({ onSubmit }: { onSubmit: (v: any) => void }) {
  const [form, setForm] = useState({
    vaLeft: "",
    vaRight: "",
    iopLeft: "",
    iopRight: "",
    colorVision: "",
  });

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold mb-2">
        Vitals (Ophthalmology)
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="VA Left" field="vaLeft" form={form} setForm={setForm} />
        <LabeledInput label="VA Right" field="vaRight" form={form} setForm={setForm} />
        <LabeledInput label="IOP Left" field="iopLeft" form={form} setForm={setForm} />
        <LabeledInput label="IOP Right" field="iopRight" form={form} setForm={setForm} />
        <LabeledInput label="Color Vision" field="colorVision" form={form} setForm={setForm} />
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

function LabeledInput({ label, field, form, setForm }: any) {
  return (
    <div className="grid gap-1">
      <label className="text-[11px] text-gray-600">{label}</label>
      <input
        className="ui-input"
        value={form[field]}
        onChange={(e) => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
      />
    </div>
  );
}
