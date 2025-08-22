// components/doctor/DigitalRxForm.tsx
"use client";

import React, { useEffect } from "react";

/* ============================================================
   PUBLIC TYPES
   ------------------------------------------------------------
   Keep this shape in sync with your page's preview renderer.
============================================================ */
export type DigitalRxFormState = {
  vitals: {
    temperature?: string;
    bp?: string;
    weight?: string; // kg
    height?: string; // cm
    bmi?: string;    // auto
  };
  clinical: {
    chiefComplaints?: string;
    pastHistory?: string;
    familyHistory?: string;
    allergy?: string;
  };
  prescription: {
    medicine: string;
    frequency: string;
    instruction: string;
    duration: string;
    dosage: string;
  }[];
  plan: {
    investigations?: string;
    note?: string;
    advice?: string;
    doctorNote?: string;
    followUpInstructions?: string;
    followUpDate?: string; // yyyy-mm-dd
  };
};

export type DigitalRxFormProps = {
  /** Controlled value coming from the page (used by the preview). */
  value: DigitalRxFormState;
  /** Notify page of every change so the left preview updates live. */
  onChange: (next: DigitalRxFormState) => void;

  /** Optional actions for your right toolbar / footer. */
  onSave?: () => void;
  onSubmit?: () => void;

  /** Auto-calc BMI from height(cm) & weight(kg). Default: true */
  autoBMI?: boolean;
};

/* ============================================================
   COMPONENT
============================================================ */
export default function DigitalRxForm({
  value,
  onChange,
  onSave,
  onSubmit,
  autoBMI = true,
}: DigitalRxFormProps) {
  // Auto-calc BMI when height/weight change (and write back via onChange)
  useEffect(() => {
    if (!autoBMI) return;
    const h = Number(value.vitals.height || "");
    const w = Number(value.vitals.weight || "");
    const current = value.vitals.bmi || "";

    let nextBMI = "";
    if (h > 0 && w > 0) {
      const bmi = w / Math.pow(h / 100, 2);
      if (!isNaN(bmi)) nextBMI = bmi.toFixed(1);
    }

    if (current !== nextBMI) {
      onChange({
        ...value,
        vitals: { ...value.vitals, bmi: nextBMI },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.vitals.height, value.vitals.weight, autoBMI]);

  // Local helpers to update nested branches safely
  const patch = <K extends keyof DigitalRxFormState>(
    key: K,
    partial: Partial<DigitalRxFormState[K]>
  ) => {
    onChange({ ...value, [key]: { ...(value[key] as any), ...partial } });
  };

  const updateRxRow = (
    idx: number,
    changes: Partial<DigitalRxFormState["prescription"][number]>
  ) => {
    const next = value.prescription.slice();
    next[idx] = { ...next[idx], ...changes };
    onChange({ ...value, prescription: next });
  };

  const addRxRow = () =>
    onChange({
      ...value,
      prescription: [
        ...value.prescription,
        { medicine: "", frequency: "", instruction: "", duration: "", dosage: "" },
      ],
    });

  const removeRxRow = (idx: number) =>
    onChange({
      ...value,
      prescription: value.prescription.filter((_, i) => i !== idx),
    });

  return (
    <div className="ui-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Digital Prescription Form</h3>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
            type="button"
            onClick={onSave}
          >
            Save Draft
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
            type="button"
            onClick={onSubmit}
          >
            Submit
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-4">
        {/* ================= VITALS ================= */}
        <section>
          <div className="text-xs font-medium text-gray-600 mb-2">Vitals</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <LabeledInput
              label="Temperature (°C)"
              value={value.vitals.temperature || ""}
              onChange={(v) => patch("vitals", { temperature: v })}
              inputMode="decimal"
            />
            <LabeledInput
              label="BP (mmHg)"
              placeholder="120/80"
              value={value.vitals.bp || ""}
              onChange={(v) => patch("vitals", { bp: v })}
            />
            <LabeledInput
              label="Weight (kg)"
              type="number"
              value={value.vitals.weight || ""}
              onChange={(v) => patch("vitals", { weight: v })}
            />
            <LabeledInput
              label="Height (cm)"
              type="number"
              value={value.vitals.height || ""}
              onChange={(v) => patch("vitals", { height: v })}
            />
            <LabeledInput
              label="BMI"
              value={value.vitals.bmi || ""}
              readOnly
            />
          </div>
        </section>

        {/* ================= CLINICAL DETAILS ================= */}
        <section>
          <div className="text-xs font-medium text-gray-600 mb-2">
            Clinical Details
          </div>
          <div className="grid gap-2">
            <LabeledTextarea
              label="Chief Complaints"
              value={value.clinical.chiefComplaints || ""}
              onChange={(v) => patch("clinical", { chiefComplaints: v })}
            />
            <LabeledTextarea
              label="Past Medical History"
              value={value.clinical.pastHistory || ""}
              onChange={(v) => patch("clinical", { pastHistory: v })}
            />
            <LabeledTextarea
              label="Family History"
              value={value.clinical.familyHistory || ""}
              onChange={(v) => patch("clinical", { familyHistory: v })}
            />
            <LabeledTextarea
              label="Allergy"
              value={value.clinical.allergy || ""}
              onChange={(v) => patch("clinical", { allergy: v })}
            />
          </div>
        </section>

        {/* ================= PRESCRIPTION TABLE ================= */}
        <section>
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-gray-600">Prescription</div>
            <button
              className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
              type="button"
              onClick={addRxRow}
            >
              + Add Row
            </button>
          </div>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full border text-sm table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Medicine</Th>
                  <Th>Frequency</Th>
                  <Th>Instruction</Th>
                  <Th>Duration</Th>
                  <Th>Dosage</Th>
                  <Th className="w-16">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {value.prescription.map((row, idx) => (
                  <tr key={idx} className="border-top align-top">
                    <Td>
                      <input
                        className="ui-input w-full"
                        value={row.medicine}
                        onChange={(e) => updateRxRow(idx, { medicine: e.target.value })}
                        placeholder="e.g., Paracetamol 500 mg"
                      />
                    </Td>
                    <Td>
                      <input
                        className="ui-input w-full"
                        value={row.frequency}
                        onChange={(e) => updateRxRow(idx, { frequency: e.target.value })}
                        placeholder="1-0-1"
                      />
                    </Td>
                    <Td>
                      <input
                        className="ui-input w-full"
                        value={row.instruction}
                        onChange={(e) => updateRxRow(idx, { instruction: e.target.value })}
                        placeholder="After food"
                      />
                    </Td>
                    <Td>
                      <input
                        className="ui-input w-full"
                        value={row.duration}
                        onChange={(e) => updateRxRow(idx, { duration: e.target.value })}
                        placeholder="5 days"
                      />
                    </Td>
                    <Td>
                      <input
                        className="ui-input w-full"
                        value={row.dosage}
                        onChange={(e) => updateRxRow(idx, { dosage: e.target.value })}
                        placeholder="500 mg"
                      />
                    </Td>
                    <Td>
                      <button
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full border hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                        title="Delete row"
                        type="button"
                        onClick={() => removeRxRow(idx)}
                      >
                        ×
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= INVESTIGATIONS & ADVICE ================= */}
        <section>
          <div className="text-xs font-medium text-gray-600 mb-2">
            Investigations &amp; Advice
          </div>
          <div className="grid gap-2">
            <LabeledTextarea
              label="Investigations"
              value={value.plan.investigations || ""}
              onChange={(v) => patch("plan", { investigations: v })}
            />
            <LabeledTextarea
              label="Note"
              value={value.plan.note || ""}
              onChange={(v) => patch("plan", { note: v })}
            />
            <LabeledTextarea
              label="Advice"
              value={value.plan.advice || ""}
              onChange={(v) => patch("plan", { advice: v })}
            />
            <LabeledTextarea
              label="Doctor Note"
              value={value.plan.doctorNote || ""}
              onChange={(v) => patch("plan", { doctorNote: v })}
            />

            <div className="grid sm:grid-cols-2 gap-2">
              <LabeledInput
                label="Follow-up Instructions"
                value={value.plan.followUpInstructions || ""}
                onChange={(v) => patch("plan", { followUpInstructions: v })}
              />
              <div className="grid gap-1">
                <label className="text-[11px] text-gray-600">Follow-up Date</label>
                <input
                  type="date"
                  className="ui-input w-full min-w-0"
                  value={value.plan.followUpDate || ""}
                  onChange={(e) => patch("plan", { followUpDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   SMALL UI PRIMITIVES (no external deps like Row/Field/Section)
============================================================ */
function LabeledInput(props: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const { label, value, onChange, type = "text", placeholder, readOnly, inputMode } = props;
  return (
    <div className="grid gap-1">
      <label className="text-[11px] text-gray-600">{label}</label>
      <input
        className="ui-input w-full min-w-0"
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        inputMode={inputMode}
      />
    </div>
  );
}

function LabeledTextarea(props: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  const { label, value, onChange, placeholder } = props;
  return (
    <div className="grid gap-1">
      <label className="text-[11px] text-gray-600">{label}</label>
      <textarea
        className="ui-textarea w-full min-h-[70px]"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-2 py-1.5 text-left text-gray-700 border text-xs sm:text-sm ${className}`}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-2 py-1.5 text-gray-900 break-words whitespace-normal align-top">
      {children}
    </td>
  );
}
