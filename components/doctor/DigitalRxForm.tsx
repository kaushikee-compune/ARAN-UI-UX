"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import Image from "next/image";

/* ==================== TYPES ==================== */
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
  vitals: {
    temperature?: string;
    bp?: string; // legacy field (kept for backward compatibility)
    bpSys?: string; // systolic (new)
    bpDia?: string; // diastolic (new)
    spo2?: string;
    pulse?: string;
  };
  chiefComplaints?: string;
  allergies?: string;
  medicalHistory?: string;
  investigationAdvice?: string;
  procedure?: string;
  followUpText?: string;
  followUpDate?: string;
  medications?: Array<{
    medicine: string;
    frequency: string;
    timing?: string;
    duration: string;
    dosage: string;
    instruction?: string;
  }>;
  uploads?: {
    files?: File[];
    note?: string;
  };
};


export type DigitalRxFormProps = {
  value: DigitalRxFormState;
  onChange: (next: DigitalRxFormState) => void;
  /** Optional past BP readings for the popover trend */
  bpHistory?: Array<{ date: string; sys: number; dia: number }>;
};

/* ==================== COMPONENT ==================== */
const DigitalRxForm = forwardRef<DigitalRxFormHandle, DigitalRxFormProps>(
  ({ value, onChange, bpHistory }, ref) => {
    const [showBpTrend, setShowBpTrend] = useState(false);

    const safeValue: DigitalRxFormState = {
      vitals: value.vitals || { temperature: "", bp: "", spo2: "", pulse: "" },
      chiefComplaints: value.chiefComplaints || "",
      allergies: value.allergies || "",
      medicalHistory: value.medicalHistory || "",
      investigationAdvice: value.investigationAdvice || "",
      procedure: value.procedure || "",
      followUpText: value.followUpText || "",
      followUpDate: value.followUpDate || "",
      medications: value.medications || [],
      uploads: value.uploads || { files: [], note: "" },
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
    ) => {
      onChange({ ...safeValue, [key]: partial });
    };

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

    return (
      <div className="ui-card p-6 space-y-6 bg-white shadow-sm rounded-md relative">
        {/* 1 & 2 Allergies + Medical History (side by side) */}
        <div className="grid gap-3 lg:grid-cols-2">
          <Section title="Allergies" icon="/icons/allergy.png">
            <LabeledTextarea
              label="Allergens"
              value={safeValue.allergies || ""}
              onChange={(v) => patch("allergies", v)}
              placeholder="List known drug or food allergies..."
            />
          </Section>

          <Section title="Medical History" icon="/icons/medical-history.png">
            <LabeledTextarea
              label="Health Ailments"
              value={safeValue.medicalHistory || ""}
              onChange={(v) => patch("medicalHistory", v)}
              placeholder="Summarize relevant medical or surgical history..."
            />
          </Section>
        </div>

        {/* 3 Vitals */}
        <Section title="Vitals" icon="/icons/lifeline-in-a-heart-outline.png">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <LabeledInput
              label="Temperature (°C)"
              value={safeValue.vitals.temperature || ""}
              onChange={(v) =>
                patch("vitals", { ...safeValue.vitals, temperature: v })
              }
              placeholder="100"
            />

            {/* BP field with tiny trend icon + floating popover */}
            <div className="relative">
              {/* Tiny top row: label + trend button */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600 w-40 shrink-0">
                  Blood Pressure (mmHg)
                </label>
                <button
                  type="button"
                  onClick={() => setShowBpTrend((s) => !s)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded hover:bg-gray-100 text-gray-700"
                  title="View trend / compare"
                  aria-label="View BP trend"
                >
                  {/* tiny chart icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-80">
                    <path
                      d="M3 3v18h18M6 15l3-4 3 3 4-6 3 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Trend</span>
                </button>
              </div>

              {/* BP input (inline style consistent with yours) */}
              <div className="mt-1 flex items-center gap-2">
                <input
                  className="flex-1 max-w-[120px] bg-transparent  border-gray-300 outline-none px-1 py-0.5 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-blue-500"
                  inputMode="text"
                  placeholder="120/80"
                  value={safeValue.vitals.bp || ""}
                  onChange={(e) =>
                    patch("vitals", { ...safeValue.vitals, bp: e.target.value })
                  }
                />
              </div>

              {/* Floating popover */}
              {showBpTrend && (
                <BpTrendPopover
                  history={bpHistory}
                  onClose={() => setShowBpTrend(false)}
                />
              )}
            </div>

            <LabeledInput
              label="SpO₂ (%)"
              value={safeValue.vitals.spo2 || ""}
              onChange={(v) =>
                patch("vitals", { ...safeValue.vitals, spo2: v })
              }
              placeholder="98"
            />
            <LabeledInput
              label="Pulse (bpm)"
              value={safeValue.vitals.pulse || ""}
              onChange={(v) =>
                patch("vitals", { ...safeValue.vitals, pulse: v })
              }
              placeholder="80"
            />
          </div>
        </Section>

        {/* 4 Chief Complaints */}
        <Section title="Chief Complaints" icon="/icons/digitalrx.png">
          <LabeledTextarea
            label="Details"
            value={safeValue.chiefComplaints || ""}
            onChange={(v) => patch("chiefComplaints", v)}
            placeholder="Enter patient's main complaints..."
          />
        </Section>

        {/* 5 Investigation Advice */}
        <Section title="Investigation Advice" icon="/icons/investigation.png">
          <LabeledTextarea
            label="Advice"
            value={safeValue.investigationAdvice || ""}
            onChange={(v) => patch("investigationAdvice", v)}
            placeholder="Enter investigations or tests advised..."
          />
        </Section>

        {/* 6 Medications */}
        <Section title="Medications" icon="/icons/medicine.png">
          <MedicationTable
            rows={safeValue.medications ?? []}
            onChange={(rows) => patch("medications", rows)}
          />
        </Section>

        {/* 7 Procedure */}
        <Section title="Procedure" icon="/icons/medical-procedure.png">
          <LabeledTextarea
            label="Procedure Details"
            value={safeValue.procedure || ""}
            onChange={(v) => patch("procedure", v)}
            placeholder="Describe the procedure performed..."
          />
        </Section>

        {/* 8 Follow-Up */}
        <Section title="Follow-Up" icon="/icons/consultation.png">
          <div className="grid lg:grid-cols-2 gap-2">
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

        {/* 9 Upload Documents */}
        <Section title="Upload Documents" icon="/icons/upload.png">
          <div className="grid gap-2">
            <LabeledInput
              label="Upload Files"
              type="file"
              onChangeFile={(files) => {
                const prev = safeValue.uploads?.files || [];
                patch("uploads", { files: [...prev, ...files] });
              }}
            />

            {(safeValue.uploads?.files ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(safeValue.uploads?.files ?? []).map((f, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs bg-white shadow-sm ring-1 ring-gray-200/70"
                  >
                    <span className="truncate max-w-[180px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (safeValue.uploads?.files ?? []).filter(
                          (_, idx) => idx !== i
                        );
                        patch("uploads", { files: next });
                      }}
                      className="leading-none text-gray-600 hover:text-gray-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <LabeledTextarea
              label="Document Note"
              value={safeValue.uploads?.note || ""}
              onChange={(v) =>
                patch("uploads", { ...(safeValue.uploads || {}), note: v })
              }
              placeholder="Remarks about uploaded documents..."
            />
          </div>
        </Section>

        {/* FOOTER */}
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

/* ==================== UI HELPERS ==================== */
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
    <section className="rounded-lg p-3 bg-white">
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <Image
            src={icon}
            alt=""
            width={18}
            height={18}
            className="opacity-80"
          />
        )}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

/* Inline single-line input */
function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  onChangeFile,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  onChangeFile?: (files: File[]) => void;
}) {
  return (
    <div className="flex items-center border-gray-300 pb-0.5 gap-2">
      <label className="text-sm text-gray-600 w-40 shrink-0">{label}</label>
      <input
        className="flex-1 max-w-[80px] bg-transparent  border-gray-300 outline-none px-1 py-0.5 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-blue-500"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          type === "file"
            ? onChangeFile?.(Array.from(e.target.files || []))
            : onChange?.(e.target.value)
        }
      />
    </div>
  );
}

/* Inline textarea (multi-line) */
function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <label className="text-sm text-gray-600 w-40 shrink-0 mt-1">
        {label}
      </label>
      <div className="flex-1 border-gray-300">
        <textarea
          className="w-full bg-transparent outline-none resize-none px-1 py-0.5 text-[13px] text-gray-800 placeholder:text-gray-400"
          rows={2}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
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
    <div className={`px-2 py-1.5 font-medium text-gray-700 ${className || ""}`}>
      {children}
    </div>
  );
}

/* Medication table (light bordered rows) */
function MedicationTable({
  rows,
  onChange,
}: {
  rows: RxRow[];
  onChange: (next: RxRow[]) => void;
}) {
  const addRow = () =>
    onChange([
      ...rows,
      {
        medicine: "",
        frequency: "",
        timing: "",
        duration: "",
        dosage: "",
        instruction: "",
      },
    ]);

  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  const updateRow = (i: number, patch: Partial<RxRow>) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
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
      </div>

      {/* Rows */}
      {rows.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {rows.map((row, idx) => {
            const isLast = idx === rows.length - 1;
            return (
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
                      updateRow(idx, { medicine: e.target.value })
                    }
                  />
                </div>

                {/* Frequency */}
                <div className="col-span-2 border-r border-gray-200">
                  <select
                    className="w-full px-1 py-1 bg-transparent outline-none"
                    value={row.frequency}
                    onChange={(e) =>
                      updateRow(idx, { frequency: e.target.value })
                    }
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
                    onChange={(e) => updateRow(idx, { timing: e.target.value })}
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
                      updateRow(idx, { duration: e.target.value })
                    }
                  />
                </div>

                {/* Dosage */}
                <div className="col-span-1 border-r border-gray-200">
                  <input
                    className="w-full px-2 py-1 bg-transparent outline-none"
                    placeholder="500 mg"
                    value={row.dosage}
                    onChange={(e) => updateRow(idx, { dosage: e.target.value })}
                  />
                </div>

                {/* Instructions */}
                <div className="col-span-2 flex items-center">
                  <input
                    className="flex-1 px-2 py-1 bg-transparent outline-none"
                    placeholder="e.g., Take with water"
                    value={row.instruction}
                    onChange={(e) =>
                      updateRow(idx, { instruction: e.target.value })
                    }
                  />
                  <div className="flex items-center justify-end pr-2">
                    {isLast ? (
                      <button
                        type="button"
                        title="Add row"
                        onClick={addRow}
                        className="w-6 h-6 ml-1 rounded-full text-xs font-bold hover:bg-gray-100"
                      >
                        +
                      </button>
                    ) : (
                      <button
                        type="button"
                        title="Delete row"
                        onClick={() => removeRow(idx)}
                        className="w-6 h-6 ml-1 rounded-full text-xs font-bold hover:bg-gray-100"
                      >
                        –
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-xs text-gray-500 py-4">
          No medicines added yet.
          <button
            onClick={addRow}
            className="ml-2 text-sm px-2 py-0.5 rounded border hover:bg-gray-50"
          >
            + Add
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------- BP Trend Popover --------------------- */
function BpTrendPopover({
  history,
  onClose,
}: {
  history?: Array<{ date: string; sys: number; dia: number }>;
  onClose: () => void;
}) {
  // parse helper supports dd-mm-yyyy and yyyy-mm-dd
  const parseDate = (s: string) => {
    const ddmm = /^(\d{2})-(\d{2})-(\d{4})$/;
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (ddmm.test(s)) {
      const [, dd, mm, yy] = s.match(ddmm)!;
      return new Date(Number(yy), Number(mm) - 1, Number(dd)).getTime();
    }
    if (ymd.test(s)) {
      const [, yy, mm, dd] = s.match(ymd)!;
      return new Date(Number(yy), Number(mm) - 1, Number(dd)).getTime();
    }
    const t = Date.parse(s);
    return isNaN(t) ? 0 : t;
  };

  const rows = (history ?? [])
    .slice()
    .sort((a, b) => parseDate(b.date) - parseDate(a.date));

  const pointsSys = rows.map((r) => r.sys).filter((n) => typeof n === "number");
  const pointsDia = rows.map((r) => r.dia).filter((n) => typeof n === "number");
  const all = [...pointsSys, ...pointsDia];
  const hasData = all.length > 0;

  const W = 260;
  const H = 80;
  const P = 6;
  const minY = hasData ? Math.min(...all) - 5 : 60;
  const maxY = hasData ? Math.max(...all) + 5 : 140;
  const span = Math.max(1, maxY - minY);
  const n = rows.length || 1;

  const xAt = (i: number) => {
    if (n === 1) return P + (W - 2 * P) / 2;
    return P + (i * (W - 2 * P)) / (n - 1);
  };
  const yAt = (v: number) => P + (H - 2 * P) * (1 - (v - minY) / span);
  const poly = (get: (r: typeof rows[number]) => number) =>
    rows.map((r, i) => `${xAt(i)},${yAt(get(r))}`).join(" ");

  return (
    <div className="absolute z-50 mt-1 right-0 w-[300px] rounded-lg border border-gray-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-medium">BP Trend</div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900 text-sm"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Chart */}
      <div className="px-3 pt-2">
        {hasData ? (
          <svg width={W} height={H} className="block">
            {/* mid grid line */}
            <line
              x1="0"
              x2={W}
              y1={H / 2}
              y2={H / 2}
              stroke="currentColor"
              className="text-gray-200"
            />
            {/* diastolic dashed */}
            <polyline
              points={poly((r) => r.dia)}
              fill="none"
              stroke="currentColor"
              className="text-blue-500"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            {/* systolic */}
            <polyline
              points={poly((r) => r.sys)}
              fill="none"
              stroke="currentColor"
              className="text-emerald-600"
              strokeWidth="2"
            />
          </svg>
        ) : (
          <div className="text-xs text-gray-500 py-4 text-center">
            No BP history available.
          </div>
        )}
      </div>

      {/* Legend */}
      {hasData && (
        <div className="px-3 mt-1 flex items-center gap-4 text-[11px] text-gray-600">
          <div className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-[2px] bg-emerald-600" />
            <span>Systolic</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-[2px] bg-blue-500 border-t border-dashed border-blue-500" />
            <span>Diastolic</span>
          </div>
          <div className="ml-auto text-[10px]">
            {minY}–{maxY} mmHg
          </div>
        </div>
      )}

      {/* List */}
      <div className="px-3 pb-2 mt-2 max-h-48 overflow-auto">
        <div className="text-[11px] text-gray-500 mb-1">Recent readings</div>
        <div className="divide-y">
          {rows.length === 0 ? (
            <div className="py-2 text-xs text-gray-500">No readings</div>
          ) : (
            rows.map((r, i) => (
              <div
                key={`${r.date}-${i}`}
                className="py-1.5 text-sm flex justify-between"
              >
                <span className="text-gray-700">{r.date}</span>
                <span className="font-medium">
                  {r.sys}/{r.dia} mmHg
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
