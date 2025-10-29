"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";

/* ----------------------- TYPES ----------------------- */
export type InsertTarget =
  | "chiefComplaints"
  | "allergies"
  | "medicalHistory"
  | "investigationAdvice"
  | "procedure"
  | "followUp";

export type DigitalRxFormHandle = {
  insert: (target: InsertTarget, text: string) => void;
};

export type RxRow = {
  medicine: string;
  frequency: string;
  timing?: string;
  duration: string;
  dosage: string;
  instruction?: string;
};

export type DigitalRxFormState = {
  vitals: Record<string, string | undefined>;
  chiefComplaints?: string;
  allergies?: string;
  medicalHistory?: string;
  investigationAdvice?: string;
  procedure?: string;
  followUpText?: string;
  followUpDate?: string;
  medications?: RxRow[];
};

export type DigitalRxFormProps = {
  value: DigitalRxFormState;
  onChange: (next: DigitalRxFormState) => void;
  bpHistory?: Array<{ date: string; sys: number; dia: number }>;
};

/* ----------------------- COMPONENT ----------------------- */
const DigitalRxForm = forwardRef<DigitalRxFormHandle, DigitalRxFormProps>(
  ({ value, onChange, bpHistory }, ref) => {
    const chiefRef = useRef<HTMLTextAreaElement | null>(null);
    const [showVitalsConfig, setShowVitalsConfig] = useState(false);
    const [showBpTrend, setShowBpTrend] = useState(false);

    useEffect(() => {
      chiefRef.current?.focus();
    }, []);

    const safeValue: DigitalRxFormState = {
      //vitals: value.vitals || {},
      ...value,
    };

    useImperativeHandle(ref, () => ({
      insert: (target, text) => {
        onChange({
          ...safeValue,
          [target]: (safeValue as any)[target] + "\n" + text,
        });
      },
    }));

    const patch = <K extends keyof DigitalRxFormState>(
      key: K,
      partial: DigitalRxFormState[K]
    ) => onChange({ ...safeValue, [key]: partial });

    const addRxRow = () =>
      patch("medications", [
        ...(safeValue.medications ?? []),
        { medicine: "", frequency: "", duration: "", dosage: "" },
      ]);

    const removeRxRow = (i: number) =>
      patch(
        "medications",
        (safeValue.medications ?? []).filter((_, idx) => idx !== i)
      );

    const updateRxRow = (i: number, row: Partial<RxRow>) => {
      const next = [...(safeValue.medications ?? [])];
      next[i] = { ...next[i], ...row };
      patch("medications", next);
    };

    const vitalOrder = [
      "temperature",
      "bp",
      "spo2",
      "pulse",
      "weight",
      "height",
    ];
    const nextFocus = (current: string) => {
      const idx = vitalOrder.indexOf(current);
      if (idx >= 0 && idx < vitalOrder.length - 1) {
        const nextId = `vital-${vitalOrder[idx + 1]}`;
        document.getElementById(nextId)?.focus();
      }
    };

    const [vitalConfig, setVitalConfig] = useState<Record<string, boolean>>({
      bmi: false,
      headCircumference: false,
      chest: false,
      waist: false,
      womensHealth_lmpDate: false,
      womensHealth_cycle: false,
      lifestyle_smoking: false,
      lifestyle_sleep: false,
    });

    const vitalOptions: Record<
      string,
      { label: string; placeholder?: string }
    > = {
      bmi: { label: "BMI", placeholder: "24.3" },
      headCircumference: {
        label: "Head Circumference (cm)",
        placeholder: "50",
      },
      chest: { label: "Chest (cm)", placeholder: "80" },
      waist: { label: "Waist (cm)", placeholder: "72" },
      womensHealth_lmpDate: { label: "LMP Date", placeholder: "dd-mm-yyyy" },
      womensHealth_cycle: { label: "Cycle Length (days)", placeholder: "28" },
      lifestyle_smoking: { label: "Smoking Status", placeholder: "Never" },
      lifestyle_sleep: { label: "Sleep Hours", placeholder: "7" },
    };

    const [editingField, setEditingField] = useState<
      null | "allergies" | "medicalHistory"
    >(null);

    return (
      <div className="p-6 bg-white rounded-xl shadow-sm  space-y-6 print:shadow-none">
        {/* ----------- Top Plain Text (Allergy & History — Editable) ----------- */}
        <div className="text-sm space-y-1">
          {/* Allergies */}
          <div>
            <span className="font-semibold">Allergies: </span>
            {editingField === "allergies" ? (
              <input
                autoFocus
                type="text"
                className="bg-transparent border-b border-gray-300 outline-none px-1 text-sm text-gray-800 w-[60%]"
                value={safeValue.allergies || ""}
                placeholder="Enter allergies..."
                onChange={(e) => patch("allergies", e.target.value)}
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingField(null);
                }}
              />
            ) : (
              <span
                className="text-gray-700 cursor-text hover:underline decoration-dotted"
                onClick={() => setEditingField("allergies")}
              >
                {safeValue.allergies || "—"}
              </span>
            )}
          </div>

          {/* Medical History */}
          <div>
            <span className="font-semibold">Medical History: </span>
            {editingField === "medicalHistory" ? (
              <textarea
                autoFocus
                rows={2}
                className="bg-transparent border-b border-gray-300 outline-none px-1 text-sm text-gray-800 w-[80%] resize-none"
                value={safeValue.medicalHistory || ""}
                placeholder="Enter medical history..."
                onChange={(e) => patch("medicalHistory", e.target.value)}
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    setEditingField(null);
                  }
                }}
              />
            ) : (
              <span
                className="text-gray-700 cursor-text hover:underline decoration-dotted"
                onClick={() => setEditingField("medicalHistory")}
              >
                {safeValue.medicalHistory || "—"}
              </span>
            )}
          </div>
        </div>

        {/* ----------- Two-column Main Section ----------- */}
        <div className="grid md:grid-cols-[1fr_2fr] gap-6 items-start">
          {/* LEFT — Vitals */}
          <section className="pr-4 border-r border-gray-300">
            <div className="flex items-center justify-between mb-3 relative">
              <h3 className="text-sm font-semibold">Vitals</h3>
              <button
                type="button"
                onClick={() => setShowVitalsConfig((v) => !v)}
                title="Customize vitals fields"
                className="text-gray-500 hover:text-gray-800"
              >
                <Image
                  src="/icons/settings.png"
                  alt="settings"
                  width={18}
                  height={18}
                />
              </button>

              {/* ⚙️ Dropdown for custom fields */}
              {showVitalsConfig && (
                <div className="absolute right-0 top-6 z-50 w-72 bg-white border border-gray-200 rounded-md shadow-lg p-3 space-y-2">
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
            </div>

            <div className="space-y-2 justify-left">
              {/* --- Fixed core vitals --- */}
              <CompactVitalInput
                id="vital-temperature"
                label="Temperature (°C)"
                value={safeValue.vitals.temperature || ""}
                maxLength={3}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, temperature: v })
                }
                onEnter={() => nextFocus("temperature")}
              />

              <CompactVitalInput
                id="vital-bp"
                label="BP (mmHg)"
                placeholder="120/80"
                value={safeValue.vitals.bp || ""}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, bp: v })
                }
                onEnter={() => nextFocus("bp")}
              />

              <CompactVitalInput
                id="vital-spo2"
                label="SpO₂ (%)"
                maxLength={3}
                value={safeValue.vitals.spo2 || ""}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, spo2: v })
                }
                onEnter={() => nextFocus("spo2")}
              />

              <CompactVitalInput
                id="vital-pulse"
                label="Pulse (bpm)"
                maxLength={3}
                value={safeValue.vitals.pulse || ""}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, pulse: v })
                }
                onEnter={() => nextFocus("pulse")}
              />

              <CompactVitalInput
                id="vital-weight"
                label="Weight (kg)"
                value={safeValue.vitals.weight || ""}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, weight: v })
                }
              />

              <CompactVitalInput
                id="vital-height"
                label="Height (cm)"
                value={safeValue.vitals.height || ""}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, height: v })
                }
              />

              {/* --- Optional vitals controlled by config --- */}
              {Object.entries(vitalConfig)
                .filter(([key, show]) => show)
                .map(([key]) => {
                  const option = vitalOptions[key];
                  return (
                    <CompactVitalInput
                      key={key}
                      id={`vital-${key}`}
                      label={option.label}
                      placeholder={option.placeholder}
                      value={safeValue.vitals[key] || ""}
                      onChange={(v) =>
                        patch("vitals", { ...safeValue.vitals, [key]: v })
                      }
                    />
                  );
                })}
            </div>
          </section>

          {/* RIGHT — Chief Complaints */}
          <section className="pl-4">
            <h3 className="text-sm font-semibold mb-3">Chief Complaints</h3>
            <textarea
              ref={chiefRef}
              className="w-full bg-transparent outline-none border-b border-gray-300 text-[14px] text-gray-800 placeholder:text-gray-400 focus:border-blue-500 min-h-[140px]"
              value={safeValue.chiefComplaints || ""}
              onChange={(e) => patch("chiefComplaints", e.target.value)}
              placeholder="Enter patient's main complaints..."
            />
          </section>
        </div>

        {/* ----------- Medications ----------- */}
        <Section title="Medications" icon="/icons/medicine.png">
          <MedicationTable
            rows={safeValue.medications ?? []}
            onChange={(rows) => patch("medications", rows)}
            addRxRow={addRxRow}
            removeRxRow={removeRxRow}
            updateRxRow={updateRxRow}
          />
        </Section>

        {/* ----------- Investigation Advice ----------- */}
        <Section title="Investigation Advice" icon="/icons/investigation.png">
          <LabeledTextarea
            label="Advice"
            value={safeValue.investigationAdvice || ""}
            onChange={(v) => patch("investigationAdvice", v)}
            placeholder="Enter investigations or tests advised..."
          />
        </Section>

        {/* ----------- Procedure ----------- */}
        <Section title="Procedure" icon="/icons/medical-procedure.png">
          <LabeledTextarea
            label="Procedure Details"
            value={safeValue.procedure || ""}
            onChange={(v) => patch("procedure", v)}
            placeholder="Describe the procedure performed..."
          />
        </Section>

        {/* ----------- Follow-up ----------- */}
        <Section title="Follow-Up" icon="/icons/consultation.png">
          <div className="grid md:grid-cols-2 gap-3">
            <LabeledTextarea
              label="Follow-Up Instructions"
              value={safeValue.followUpText || ""}
              onChange={(v) => patch("followUpText", v)}
              placeholder="When to revisit, any special instructions..."
            />
            <LabeledInput
              label="Follow-Up Date"
              type="date"
              value={safeValue.followUpDate || ""}
              onChange={(v) => patch("followUpDate", v)}
            />
          </div>
        </Section>

        {/* ----------- Footer ----------- */}
        <div className="mt-10 text-center py-3 rounded-md text-white text-sm bg-gradient-to-r from-blue-700 to-blue-500">
          <p className="font-semibold">Sushila Mathrutva Clinic</p>
          <p>Near XYZ Landmark, Jayanagar, Bengaluru – 560041</p>
          <p>Phone: +91 98765 43210 | Email: info@sushilaclinic.in</p>
        </div>
      </div>
    );
  }
);

export default DigitalRxForm;

/* ----------------------- Sub Components ----------------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        {icon && <Image src={icon} alt="" width={18} height={18} />}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="text-sm">{children}</div>
    </section>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <textarea
        className="w-full bg-transparent outline-none border-b border-gray-300 text-[14px] text-gray-800 placeholder:text-gray-400 focus:border-blue-500 min-h-[80px]"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none border-b border-gray-300 text-[14px] text-gray-800 focus:border-blue-500"
      />
    </div>
  );
}

function VitalInput({
  id,
  label,
  value,
  onChange,
  onEnter,
  maxLength,
  placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-0.5">
      <label htmlFor={id} className="text-sm text-gray-600 w-40 shrink-0">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        inputMode="numeric"
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500"
      />
    </div>
  );
}

function CompactVitalInput({
  id,
  label,
  value,
  onChange,
  onEnter,
  maxLength,
  placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label
        htmlFor={id}
        className="text-sm text-gray-600 w-36 shrink-0 truncate"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        inputMode="numeric"
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        className="w-[5rem] bg-transparent border-b border-gray-200 outline-none text-sm text-gray-800 text-right placeholder:text-gray-400 focus:border-blue-500"
      />
    </div>
  );
}

/* --------------------- Medication Table (Add + Delete) --------------------- */
function MedicationTable({
  rows,
  onChange,
  addRxRow,
  removeRxRow,
  updateRxRow,
}: {
  rows: RxRow[];
  onChange: (r: RxRow[]) => void;
  addRxRow: () => void;
  removeRxRow: (i: number) => void;
  updateRxRow: (i: number, patch: Partial<RxRow>) => void;
}) {
  // Handles "Tab" on last cell of last row → auto add new row
  const handleKeyDown = (
    e: React.KeyboardEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    rowIndex: number,
    field: keyof RxRow
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const isLastRow = rowIndex === rows.length - 1;
      const fieldOrder: (keyof RxRow)[] = [
        "medicine",
        "frequency",
        "timing",
        "duration",
        "dosage",
        "instruction",
      ];
      const isLastField = field === fieldOrder[fieldOrder.length - 1];
      if (isLastRow && isLastField) {
        e.preventDefault();
        addRxRow();
        setTimeout(() => {
          const inputs = document.querySelectorAll<HTMLInputElement>(
            'input[placeholder="e.g., Paracetamol 500 mg"]'
          );
          inputs[inputs.length - 1]?.focus();
        }, 50);
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-12 bg-gray-100 text-xs sm:text-sm font-semibold text-gray-700 border-b border-gray-200">
        <CellHead className="col-span-3">Medicine Name</CellHead>
        <CellHead className="col-span-2">Frequency</CellHead>
        <CellHead className="col-span-2">Timings</CellHead>
        <CellHead className="col-span-1">Duration</CellHead>
        <CellHead className="col-span-1">Dosage</CellHead>
        <CellHead className="col-span-2">Instructions</CellHead>
        <CellHead className="col-span-1 text-center"> </CellHead>
      </div>

      {/* Rows */}
      {rows.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 items-center text-[13px] text-gray-800"
            >
              {/* Medicine */}
              <div className="col-span-3 border-r border-gray-200">
                <input
                  className="w-full px-2 py-1 bg-transparent outline-none"
                  placeholder="e.g., Paracetamol 500 mg"
                  value={row.medicine}
                  onChange={(e) =>
                    updateRxRow(idx, { medicine: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, idx, "medicine")}
                />
              </div>

              {/* Frequency */}
              <div className="col-span-2 border-r border-gray-200">
                <select
                  className="w-full px-1 py-1 bg-transparent outline-none"
                  value={row.frequency}
                  onChange={(e) =>
                    updateRxRow(idx, { frequency: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, idx, "frequency")}
                >
                  <option value="">Select</option>
                  <option value="1-0-0">1-0-0 (Morning)</option>
                  <option value="0-1-0">0-1-0 (Afternoon)</option>
                  <option value="0-0-1">0-0-1 (Night)</option>
                  <option value="1-0-1">1-0-1 (Morning & Night)</option>
                  <option value="1-1-1">1-1-1 (Thrice a day)</option>
                  <option value="SOS">SOS (As needed)</option>
                </select>
              </div>

              {/* Timings */}
              <div className="col-span-2 border-r border-gray-200">
                <select
                  className="w-full px-1 py-1 bg-transparent outline-none"
                  value={row.timing}
                  onChange={(e) => updateRxRow(idx, { timing: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, "timing")}
                >
                  <option value="">Select</option>
                  <option value="Before Meal">Before Meal</option>
                  <option value="After Meal">After Meal</option>
                  <option value="With Meal">With Meal</option>
                  <option value="Empty Stomach">Empty Stomach</option>
                </select>
              </div>

              {/* Duration */}
              <div className="col-span-1 border-r border-gray-200">
                <input
                  className="w-full px-2 py-1 bg-transparent outline-none"
                  placeholder="5 days"
                  value={row.duration}
                  onChange={(e) =>
                    updateRxRow(idx, { duration: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, idx, "duration")}
                />
              </div>

              {/* Dosage */}
              <div className="col-span-1 border-r border-gray-200">
                <input
                  className="w-full px-2 py-1 bg-transparent outline-none"
                  placeholder="500 mg"
                  value={row.dosage}
                  onChange={(e) => updateRxRow(idx, { dosage: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, "dosage")}
                />
              </div>

              {/* Instructions */}
              <div className="col-span-2 border-r border-gray-200">
                <input
                  className="w-full px-2 py-1 bg-transparent outline-none"
                  placeholder="e.g., Take with water"
                  value={row.instruction}
                  onChange={(e) =>
                    updateRxRow(idx, { instruction: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, idx, "instruction")}
                />
              </div>

              {/* Delete */}
              <div className="col-span-1 flex items-center justify-center">
                <button
                  type="button"
                  title="Delete row"
                  onClick={() => removeRxRow(idx)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-2 4v6m-4-6v6M5 7h14l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-xs text-gray-500 py-4">
          No medicines added yet.
        </div>
      )}

      {/* Add Row Button */}
      <div className="p-2 text-right">
        <button
          type="button"
          onClick={addRxRow}
          className="inline-flex items-center gap-1 text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}

function CellHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-2 py-1.5 border-gray-200 ${className || ""}`}>
      {children}
    </div>
  );
}

function CellInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`${className} border-t border-gray-200`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none px-2 py-1 text-sm text-gray-800"
      />
    </div>
  );
}
