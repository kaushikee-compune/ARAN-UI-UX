"use client";
import SnomedSearchBox from "@/components/common/SnomedSearchBox";

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
  chiefComplaintRows?: Array<{
    symptom: string;
    since?: string;
    severity?: string;
  }>;
  diagnosisRows?: Array<{
    diagnosis: string;
    type?: string;
    status?: string;
  }>;
  allergies?: string;
  medicalHistory?: string;
  investigationRows?: Array<{
    investigation: string;
    notes?: string;
    status?: string;
  }>;
  procedureRows?: Array<{ procedure: string; notes?: string; status?: string }>;
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
      // Focus chief complaint SNOMED search box when form loads
      chiefSearchRef.current?.focus();
    }, []);

    useEffect(() => {
      if (
        !safeValue.chiefComplaintRows ||
        safeValue.chiefComplaintRows.length === 0
      ) {
        patch("chiefComplaintRows", [{ symptom: "", since: "", severity: "" }]);
      }
      if (!safeValue.diagnosisRows || safeValue.diagnosisRows.length === 0) {
        patch("diagnosisRows", [{ diagnosis: "", type: "", status: "" }]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const chiefSearchRef = useRef<HTMLInputElement | null>(null);

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

        {/* LEFT — Vitals */}
        {/* ----------- Vitals Section (full-width, 2-row layout) ----------- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
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
          </div>

          {/* ⚙️ Dropdown for custom fields */}
          {showVitalsConfig && (
            <div className="absolute right-0 top-8 z-50 w-72 bg-white border border-gray-200 rounded-md shadow-lg p-3 space-y-2">
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

          {/* 2-row compact vitals layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-4">
              <CompactVitalInput
                id="vital-temperature"
                label="Temp (°C)"
                value={safeValue.vitals.temperature || "98.4"}
                maxLength={4}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, temperature: v })
                }
              />
              <CompactVitalInput
                id="vital-bp"
                label="BP (mmHg)"
                value={safeValue.vitals.bp || "120/80"}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, bp: v })
                }
              />
              <CompactVitalInput
                id="vital-spo2"
                label="SpO₂ (%)"
                value={safeValue.vitals.spo2 || "98"}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, spo2: v })
                }
              />
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-4">
              <CompactVitalInput
                id="vital-pulse"
                label="Pulse (bpm)"
                value={safeValue.vitals.pulse || "76"}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, pulse: v })
                }
              />
              <CompactVitalInput
                id="vital-weight"
                label="Weight (kg)"
                value={safeValue.vitals.weight || "65"}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, weight: v })
                }
              />
              <CompactVitalInput
                id="vital-height"
                label="Height (cm)"
                value={safeValue.vitals.height || "170"}
                onChange={(v) =>
                  patch("vitals", { ...safeValue.vitals, height: v })
                }
              />
            </div>
          </div>

          {/* Optional dynamic custom vitals */}
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
        </section>

        {/* Chief Complaints (with SNOMED Search) */}
        {/* Chief Complaints */}
        <Section title="Chief Complaints" icon="/icons/color/col-symptoms.png">
          {/* SNOMED SearchBox → adds a row */}
          <SnomedSearchBox
            ref={chiefSearchRef}
            semantictag="finding"
            placeholder="Search SNOMED symptoms (e.g., chest pain)"
            onSelect={({ term }) => {
              const current = safeValue.chiefComplaintRows ?? [];
              const already = current.find((r) => r.symptom === term);
              if (!already)
                patch("chiefComplaintRows", [
                  ...current,
                  { symptom: term, since: "", severity: "" },
                ]);
            }}
          />

          <ComplaintTable
            rows={safeValue.chiefComplaintRows ?? []}
            onChange={(next) => patch("chiefComplaintRows", next)}
          />
        </Section>
        <Section title="Diagnosis" icon="/icons/color/col-diag.png">
          <DiagnosisTable
            rows={safeValue.diagnosisRows ?? []}
            onChange={(next) => patch("diagnosisRows", next)}
          />
        </Section>

        {/* ----------- Medications ----------- */}
        <Section title="Medications" icon="/icons/color/col-med.png">
          <MedicationTable
            rows={safeValue.medications ?? []}
            onChange={(rows) => patch("medications", rows)}
            addRxRow={addRxRow}
            removeRxRow={removeRxRow}
            updateRxRow={updateRxRow}
          />
        </Section>

        {/* ----------- Investigation Advice ----------- */}
        <Section title="Investigations" icon="/icons/investigation.png">
          <InvestigationTable
            rows={safeValue.investigationRows ?? []}
            onChange={(next) => patch("investigationRows", next)}
          />
        </Section>

        {/* ----------- Procedure ----------- */}
        <Section title="Procedures" icon="/icons/medical-procedure.png">
          <ProcedureTable
            rows={safeValue.procedureRows ?? []}
            onChange={(next) => patch("procedureRows", next)}
          />
        </Section>

        {/* ----------- Follow-up ----------- */}
        <Section title="Follow-Up" icon="/icons/color/col-cal.png">
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
  maxLength,
  placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="text-[12px] text-gray-600 font-medium mb-0.5 truncate"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="bg-transparent border-b border-gray-200 outline-none text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 py-0.5"
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

function ComplaintTable({
  rows,
  onChange,
}: {
  rows: Array<{ symptom: string; since?: string; severity?: string }>;
  onChange: (
    next: Array<{ symptom: string; since?: string; severity?: string }>
  ) => void;
}) {
  const addRow = (symptom = "") =>
    onChange([...rows, { symptom, since: "", severity: "" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (
    i: number,
    patch: Partial<{ symptom: string; since?: string; severity?: string }>
  ) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: "symptom" | "since" | "severity"
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const last = rowIndex === rows.length - 1 && field === "severity";
      if (last) {
        e.preventDefault();
        addRow();
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
      <div className="grid grid-cols-12 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
        <div className="col-span-5 px-2 py-1.5">Symptom</div>
        <div className="col-span-3 px-2 py-1.5">Since</div>
        <div className="col-span-3 px-2 py-1.5">Severity</div>
        <div className="col-span-1 px-2 py-1.5 text-center"> </div>
      </div>

      {rows.length > 0 ? (
        rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 text-[13px]">
            <div className="col-span-5 border-r border-gray-200">
              <input
                className="w-full px-2 py-1 outline-none bg-transparent"
                value={r.symptom}
                placeholder="e.g., Chest pain"
                onChange={(e) => updateRow(i, { symptom: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "symptom")}
              />
            </div>
            <div className="col-span-3 border-r border-gray-200">
              <input
                className="w-full px-2 py-1 outline-none bg-transparent"
                value={r.since}
                placeholder="2 days"
                onChange={(e) => updateRow(i, { since: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "since")}
              />
            </div>
            <div className="col-span-3 border-r border-gray-200">
              <input
                className="w-full px-2 py-1 outline-none bg-transparent"
                value={r.severity}
                placeholder="Mild / Severe"
                onChange={(e) => updateRow(i, { severity: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "severity")}
              />
            </div>
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-xs text-gray-500 py-3">
          No complaints added.
        </div>
      )}
      <div className="p-2 text-right">
        <button
          type="button"
          onClick={() => addRow()}
          className="text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}

function DiagnosisTable({
  rows,
  onChange,
}: {
  rows: Array<{ diagnosis: string; type?: string; status?: string }>;
  onChange: (
    next: Array<{ diagnosis: string; type?: string; status?: string }>
  ) => void;
}) {
  const addRow = (diagnosis = "") =>
    onChange([...rows, { diagnosis, type: "", status: "" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (
    i: number,
    patch: Partial<{ diagnosis: string; type?: string; status?: string }>
  ) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    field: "diagnosis" | "type" | "status"
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const isLastRow = rowIndex === rows.length - 1;
      const isLastField = field === "status";
      if (isLastRow && isLastField) {
        e.preventDefault();
        addRow();
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md  bg-white shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-12 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
        <div className="col-span-6 px-2 py-1.5">Diagnosis</div>
        <div className="col-span-3 px-2 py-1.5">Type</div>
        <div className="col-span-2 px-2 py-1.5">Status</div>
        <div className="col-span-1 px-2 py-1.5 text-center"></div>
      </div>

      {/* Rows */}
      {rows.length > 0 ? (
        rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 text-[13px] items-center">
            {/* Diagnosis cell with SNOMED search */}
            <div className="col-span-6 border-r border-gray-200 px-2 py-1">
              <SnomedSearchBox
                semantictag="disorder"
                placeholder={r.diagnosis || "Search SNOMED diagnosis"}
                onSelect={({ term }) => {
                  updateRow(i, { diagnosis: term });
                }}
              />
            </div>

            {/* Type dropdown */}
            <div className="col-span-3 border-r border-gray-200 px-1 py-1">
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={r.type || ""}
                onChange={(e) => updateRow(i, { type: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "type")}
              >
                <option value="">Select</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>

            {/* Status dropdown */}
            <div className="col-span-2 border-r border-gray-200 px-1 py-1">
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={r.status || ""}
                onChange={(e) => updateRow(i, { status: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "status")}
              >
                <option value="">Select</option>
                <option value="Active">Active</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Delete */}
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-xs text-gray-500 py-3">
          No diagnosis added.
        </div>
      )}

      {/* Add Row */}
      <div className="p-2 text-right">
        <button
          type="button"
          onClick={() => addRow()}
          className="text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}

function InvestigationTable({
  rows,
  onChange,
}: {
  rows: Array<{ investigation: string; notes?: string; status?: string }>;
  onChange: (
    next: Array<{ investigation: string; notes?: string; status?: string }>
  ) => void;
}) {
  const addRow = (investigation = "") =>
    onChange([...rows, { investigation, notes: "", status: "" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (
    i: number,
    patch: Partial<{ investigation: string; notes?: string; status?: string }>
  ) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    field: "investigation" | "notes" | "status"
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const isLastRow = rowIndex === rows.length - 1;
      const isLastField = field === "status";
      if (isLastRow && isLastField) {
        e.preventDefault();
        addRow();
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md  bg-white shadow-sm">
      <div className="grid grid-cols-12 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
        <div className="col-span-5 px-2 py-1.5">Investigation</div>
        <div className="col-span-5 px-2 py-1.5">Notes</div>
        <div className="col-span-1 px-2 py-1.5">Status</div>
        <div className="col-span-1 px-2 py-1.5 text-center"></div>
      </div>

      {rows.length > 0 ? (
        rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 text-[13px] items-center">
            {/* SNOMED search for Investigation (specimen) */}
            <div className="col-span-5 border-r border-gray-200 px-2 py-1">
              <SnomedSearchBox
                semantictag="specimen"
                placeholder={r.investigation || "Search SNOMED specimen"}
                onSelect={({ term }) => updateRow(i, { investigation: term })}
              />
            </div>

            {/* Notes */}
            <div className="col-span-5 border-r border-gray-200 px-2 py-1">
              <input
                className="w-full outline-none bg-transparent text-sm"
                placeholder="Add notes or details"
                value={r.notes || ""}
                onChange={(e) => updateRow(i, { notes: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "notes")}
              />
            </div>

            {/* Status dropdown */}
            <div className="col-span-1 border-r border-gray-200 px-1 py-1">
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={r.status || ""}
                onChange={(e) => updateRow(i, { status: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "status")}
              >
                <option value="">Select</option>
                <option value="Ordered">Ordered</option>
                <option value="Received">Received</option>
              </select>
            </div>

            {/* Delete */}
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-xs text-gray-500 py-3">
          No investigations added.
        </div>
      )}

      <div className="p-2 text-right">
        <button
          type="button"
          onClick={() => addRow()}
          className="text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}

function ProcedureTable({
  rows,
  onChange,
}: {
  rows: Array<{ procedure: string; notes?: string; status?: string }>;
  onChange: (
    next: Array<{ procedure: string; notes?: string; status?: string }>
  ) => void;
}) {
  const addRow = (procedure = "") =>
    onChange([...rows, { procedure, notes: "", status: "" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (
    i: number,
    patch: Partial<{ procedure: string; notes?: string; status?: string }>
  ) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    field: "procedure" | "notes" | "status"
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const isLastRow = rowIndex === rows.length - 1;
      const isLastField = field === "status";
      if (isLastRow && isLastField) {
        e.preventDefault();
        addRow();
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md  bg-white shadow-sm">
      <div className="grid grid-cols-12 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
        <div className="col-span-5 px-2 py-1.5">Procedure</div>
        <div className="col-span-5 px-2 py-1.5">Notes</div>
        <div className="col-span-1 px-2 py-1.5">Status</div>
        <div className="col-span-1 px-2 py-1.5 text-center"></div>
      </div>

      {rows.length > 0 ? (
        rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 text-[13px] items-center">
            {/* SNOMED search for Procedure */}
            <div className="col-span-5 border-r border-gray-200 px-2 py-1">
              <SnomedSearchBox
                semantictag="procedure"
                placeholder={r.procedure || "Search SNOMED procedure"}
                onSelect={({ term }) => updateRow(i, { procedure: term })}
              />
            </div>

            {/* Notes */}
            <div className="col-span-5 border-r border-gray-200 px-2 py-1">
              <input
                className="w-full outline-none bg-transparent text-sm"
                placeholder="Add notes or details"
                value={r.notes || ""}
                onChange={(e) => updateRow(i, { notes: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "notes")}
              />
            </div>

            {/* Status dropdown */}
            <div className="col-span-1 border-r border-gray-200 px-1 py-1">
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={r.status || ""}
                onChange={(e) => updateRow(i, { status: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "status")}
              >
                <option value="">Select</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Delete */}
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-xs text-gray-500 py-3">
          No procedures added.
        </div>
      )}

      <div className="p-2 text-right">
        <button
          type="button"
          onClick={() => addRow()}
          className="text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}
