"use client";

import React, { forwardRef, useImperativeHandle } from "react";
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
  duration: string;
  dosage: string;
};

export type DigitalRxFormState = {
  vitals: {
    temperature?: string;
    bp?: string;
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
  medications?: RxRow[];
  uploads?: {
    files?: File[];
    note?: string;
  };
};

export type DigitalRxFormProps = {
  value: DigitalRxFormState;
  onChange: (next: DigitalRxFormState) => void;
};

/* ==================== COMPONENT ==================== */
const DigitalRxForm = forwardRef<DigitalRxFormHandle, DigitalRxFormProps>(
  ({ value, onChange }, ref) => {
    /* ---------- Safe Defaults ---------- */
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

    /* ---------- Medication helpers ---------- */
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

    /* ==================== RENDER ==================== */
    return (
      <div className="ui-card p-6 space-y-6">
        {/* 1️⃣ Vitals */}
        <Section title="Vitals" icon="/icons/lifeline-in-a-heart-outline.png">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <LabeledInput
              label="Temperature (°C)"
              value={safeValue.vitals.temperature || ""}
              onChange={(v) =>
                patch("vitals", { ...safeValue.vitals, temperature: v })
              }
            />
            <LabeledInput
              label="Blood Pressure (mmHg)"
              value={safeValue.vitals.bp || ""}
              onChange={(v) => patch("vitals", { ...safeValue.vitals, bp: v })}
              placeholder="120/80"
            />
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

        {/* 2️⃣ Chief Complaints */}
        <Section title="Chief Complaints" icon="/icons/digitalrx.png">
          <LabeledTextarea
            label="Details"
            value={safeValue.chiefComplaints || ""}
            onChange={(v) => patch("chiefComplaints", v)}
            placeholder="Enter patient's main complaints..."
          />
        </Section>

        {/* 3️⃣ Allergies */}
        <Section title="Allergies"  icon="/icons/healthcare.png">
          <LabeledTextarea
            label="Allergies"
            value={safeValue.allergies || ""}
            onChange={(v) => patch("allergies", v)}
            placeholder="List known drug or food allergies..."
          />
        </Section>

        {/* 4️⃣ Medical History */}
        <Section title="Medical History" icon="/icons/medicine.png">
          <LabeledTextarea
            label="History"
            value={safeValue.medicalHistory || ""}
            onChange={(v) => patch("medicalHistory", v)}
            placeholder="Summarize relevant medical or surgical history..."
          />
        </Section>

        {/* 5️⃣ Investigation Advice */}
        <Section title="Investigation Advice" icon="/icons/discharge-summary.png">
          <LabeledTextarea
            label="Advice"
            value={safeValue.investigationAdvice || ""}
            onChange={(v) => patch("investigationAdvice", v)}
            placeholder="Enter investigations or tests advised..."
          />
        </Section>

        {/* 6️⃣ Medications */}
        <Section title="Medications" icon="/icons/medicine.png">
          <div className="rounded-md overflow-hidden border bg-white">
            <div className="grid grid-cols-12 bg-gray-50 text-xs sm:text-sm">
              <CellHead className="col-span-4">Medicine</CellHead>
              <CellHead className="col-span-2">Frequency</CellHead>
              <CellHead className="col-span-2">Duration</CellHead>
              <CellHead className="col-span-3">Dosage</CellHead>
            </div>

            <div className="divide-y">
              {(safeValue.medications ?? []).map((row, idx) => {
                const isLast = idx === (safeValue.medications ?? []).length - 1;
                return (
                  <div
                    key={idx}
                    className="relative grid grid-cols-12 gap-2 px-2 py-2 items-center"
                  >
                    <InlineInput
                      className="col-span-4"
                      value={row.medicine}
                      placeholder="Paracetamol 500 mg"
                      onChange={(v) => updateRxRow(idx, { medicine: v })}
                    />
                    <InlineInput
                      className="col-span-2"
                      value={row.frequency}
                      placeholder="1-0-1"
                      onChange={(v) => updateRxRow(idx, { frequency: v })}
                    />
                    <InlineInput
                      className="col-span-2"
                      value={row.duration}
                      placeholder="5 days"
                      onChange={(v) => updateRxRow(idx, { duration: v })}
                    />
                    <InlineInput
                      className="col-span-3"
                      value={row.dosage}
                      placeholder="500 mg"
                      onChange={(v) => updateRxRow(idx, { dosage: v })}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      {isLast ? (
                        <button
                          type="button"
                          onClick={addRxRow}
                          className="w-7 h-7 rounded-full border text-lg bg-white hover:bg-gray-50"
                        >
                          +
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeRxRow(idx)}
                          className="w-7 h-7 rounded-full border text-lg bg-white hover:bg-gray-50"
                        >
                          –
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {(!safeValue.medications ||
                safeValue.medications.length === 0) && (
                <div className="px-3 py-3 text-xs text-gray-500">
                  No medicines added yet.
                  <button
                    onClick={addRxRow}
                    className="ml-2 text-sm px-2 py-0.5 rounded border hover:bg-gray-50"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* 7️⃣ Procedure */}
        <Section title="Procedure" icon="/icons/syringe.png">
          <LabeledTextarea
            label="Procedure Details"
            value={safeValue.procedure || ""}
            onChange={(v) => patch("procedure", v)}
            placeholder="Describe the procedure performed..."
          />
        </Section>

        {/* 8️⃣ Follow-Up */}
        <Section title="Follow-Up" icon="/icons/consultation.png">
          <div className="grid sm:grid-cols-2 gap-2">
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

        {/* 9️⃣ Upload Documents */}
        <Section title="Upload Documents" icon="/icons/consent.png">
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
    <section className=" rounded-lg p-3 bg-white ">
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
    <div className="flex items-center  border-gray-300 pb-0.5">
      <label className="text-sm text-gray-600 w-40 shrink-0">{label}</label>
      <input
        className="flex-1 max-w-[80px] bg-transparent border-b border-gray-300 outline-none px-1 py-0.5 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-[--secondary]"

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
      {/* Label (no border) */}
      <label className="text-sm text-gray-600 w-40 shrink-0 mt-1">
        {label}
      </label>

      {/* Textarea with thin underline only */}
      <div className="flex-1 border-b border-gray-300">
        <textarea
          className="w-full bg-transparent outline-none resize-none px-1 py-0.5 text-[13px] text-gray-800 placeholder:text-gray-400 "
          rows={2}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    </div>
  );
}


/* Inline input variant for tables */
function InlineInput({
  value,
  onChange,
  placeholder,
  className,
  type = "text",
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  return (
    <div className={`flex items-center border-b border-gray-200 ${className}`}>
      <input
        className="flex-1 bg-transparent outline-none text-sm px-1 py-1 placeholder:text-gray-400"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
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
