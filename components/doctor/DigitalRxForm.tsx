// components/doctor/DigitalRxForm.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Image from "next/image";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

/* ---------------------------- Small primitives ---------------------------- */

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-[11px] text-gray-600">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Section({
  icon,
  title,
  children,
  more,
  defaultOpen = false,
  caretColor = "text-green-600",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  more?: React.ReactNode;
  defaultOpen?: boolean;
  caretColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-md p-4 shadow-sm bg-white border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          <span>{title}</span>
        </div>
        {more && (
          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            className="ml-auto text-xs flex items-center gap-1"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                open ? `rotate-180 ${caretColor}` : "text-gray-400"
              }`}
            />
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-3">{children}</div>
      {more && open ? <div className="mt-3 grid gap-3">{more}</div> : null}
    </section>
  );
}

function Collapse({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-md border border-gray-300 shadow-sm bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-medium text-sm">{title}</span>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="text-xs text-blue-600 hover:underline"
        >
          {open ? "Less" : "More"}
        </button>
      </div>
      {open && <div className="px-3 pb-3 pt-1 grid gap-2">{children}</div>}
    </div>
  );
}

/* --------------------------------- Icons --------------------------------- */

const VitalsIcon = (p: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M3 12h3l2 6 4-12 3 9h6" />
  </svg>
);
const ClinicalIcon = (p: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 7v10M7 12h10" />
  </svg>
);
const AdviceIcon = (p: any) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
    <path d="M12 2v4M12 18v4M4 12h4M16 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);

/* --------------------------------- Types --------------------------------- */

type RxRow = {
  medicine: string;
  frequency: string;
  duration?: string;
  dosage?: string;
  durationUnit?: string;
  durationValue?: string;
  dosageUnit?: string;
  dosageValue?: string;
  instruction?: string;
};

type FamilyHistoryRow = { relation: string; disease: string };
type PastProcedureRow = { name: string; date: string };
type InvestigationRow = { name: string; date: string };
type PmhRow = { medicine: string; dosage: string; since: string };

/* ------------------------------- Component -------------------------------- */

export default function DigitalRxForm({
  onSave,
  onSubmit,
}: {
  onSave?: (data: any) => void;
  onSubmit?: (data: any) => void;
}) {
  /* ------------------------------ Layout guard ----------------------------- */
  // Contain the entire sheet inside the panel; prevent horizontal overflow.
  // (Keep this wrapper class on the topmost element returned by this component.)
  return (
    <div className="max-w-full overflow-x-hidden">
      <InnerForm onSave={onSave} onSubmit={onSubmit} />
    </div>
  );
}

function InnerForm({
  onSave,
  onSubmit,
}: {
  onSave?: (data: any) => void;
  onSubmit?: (data: any) => void;
}) {
  /* ------------------------------- Vitals -------------------------------- */
  const [vitals, setVitals] = useState({
    temperature: "",
    spo2: "",
    weight: "",
    height: "",
    bp: "",
  });
  const [bpSplit, setBpSplit] = useState<{ sys: string; dia: string }>({ sys: "", dia: "" });

  const bpStr = useMemo(() => {
    const s = bpSplit.sys.trim();
    const d = bpSplit.dia.trim();
    return s || d ? `${s}${d ? "/" + d : ""}` : "";
  }, [bpSplit]);

  const bmi = useMemo(() => {
    const h = Number(vitals.height || "");
    const w = Number(vitals.weight || "");
    return h > 0 && w > 0 ? (w / Math.pow(h / 100, 2)).toFixed(1) : "";
  }, [vitals.height, vitals.weight]);

  /* ----------------------- Advanced vitals (collapse) --------------------- */
  const [body, setBody] = useState({ headCircumference: "", hipCircumference: "" });
  const [activity, setActivity] = useState({ frequency: "", duration: "", type: "", level: "" });
  const ACTIVITY_LEVELS = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Athlete"];
  const [assessment, setAssessment] = useState({ generalAssessment: "", painLevel: "", mobilityStatus: "" });
  const MOBILITY_STATUSES = ["Independent", "Assisted", "Wheelchair", "Bedridden"];
  const [women, setWomen] = useState({ lmp: "", gravida: "", para: "", gestationalAge: "" });
  const [lifestyle, setLifestyle] = useState({ smoking: "", alcohol: "", diet: "", stressLevel: "", sleepHours: "" });
  const [additional, setAdditional] = useState({ notes: "", files: [] as File[] });

  /* ------------------------------ Clinical -------------------------------- */
  const [clinical, setClinical] = useState({
    chiefComplaints: "",
    note: "",
    pastHistory: "",
    familyHistory: "",
    allergy: "",
  });

  const [familyHistoryRows, setFamilyHistoryRows] = useState<FamilyHistoryRow[]>([{ relation: "", disease: "" }]);
  const [pastProcedures, setPastProcedures] = useState<PastProcedureRow[]>([{ name: "", date: "" }]);
  const [investigationsDone, setInvestigationsDone] = useState<InvestigationRow[]>([{ name: "", date: "" }]);
  const [pmhTable, setPmhTable] = useState<PmhRow[]>([{ medicine: "", dosage: "", since: "" }]);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [clinicalFiles, setClinicalFiles] = useState<File[]>([]);

  /* -------------------------------- Rx ----------------------------------- */
  const [rx, setRx] = useState<RxRow[]>([{ medicine: "", frequency: "", instruction: "", duration: "", dosage: "" }]);

  const MED_FREQS = [
    "OD (once daily)",
    "BD (twice daily)",
    "TID (thrice daily)",
    "QID (four times daily)",
    "HS (at bedtime)",
    "SOS (as needed)",
    "1-0-1",
    "1-1-1",
    "1-0-0",
    "0-1-0",
    "0-0-1",
  ];
  const INSTRUCTION_OPTS = ["After food", "Before food", "With water", "With milk", "PRN pain/fever"];
  const DURATION_UNITS = ["days", "weeks", "months"];
  const DOSAGE_UNITS = ["mg", "mcg", "g", "ml", "drops", "tabs", "caps"];

  /* --------------------------- Blank-row helpers -------------------------- */
  const isFHEmpty = (r: FamilyHistoryRow) => !r.relation && !r.disease;
  const isProcEmpty = (r: PastProcedureRow) => !r.name && !r.date;
  const isInvEmpty = (r: InvestigationRow) => !r.name && !r.date;
  const isPmhEmpty = (r: PmhRow) => !r.medicine && !r.dosage && !r.since;
  const isRxEmpty = (r: RxRow) =>
    !r.medicine && !r.frequency && !r.duration && !r.durationValue && !r.dosage && !r.dosageValue && !r.instruction;

  const ensureOneBlankAtEnd = <T,>(rows: T[], isEmpty: (r: T) => boolean, blank: T) => {
    const out = rows.filter(Boolean);
    if (out.length === 0 || !isEmpty(out[out.length - 1])) out.push({ ...(blank as any) });
    return out;
  };

  useEffect(() => {
    setFamilyHistoryRows((rows) => ensureOneBlankAtEnd(rows, isFHEmpty, { relation: "", disease: "" }));
    setPastProcedures((rows) => ensureOneBlankAtEnd(rows, isProcEmpty, { name: "", date: "" }));
    setInvestigationsDone((rows) => ensureOneBlankAtEnd(rows, isInvEmpty, { name: "", date: "" }));
    setPmhTable((rows) => ensureOneBlankAtEnd(rows, isPmhEmpty, { medicine: "", dosage: "", since: "" }));
    setRx((rows) =>
      ensureOneBlankAtEnd(rows, isRxEmpty, {
        medicine: "",
        frequency: "",
        instruction: "",
        duration: "",
        dosage: "",
      })
    );
  }, []);

  /* ---------------------------- Submit payload ---------------------------- */
  const payload = {
    vitals: { ...vitals, bp: bpStr, bmi },
    bodyMeasurements: body,
    physicalActivity: activity,
    generalAssessment: assessment,
    womenHealth: women,
    lifestyle,
    additional: {
      notes: additional.notes,
      files: additional.files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    },
    clinical,
    prescription: rx,
  };

  /* -------------------------------- Render -------------------------------- */

  return (
    <form
      className="grid gap-4 text-sm max-w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(payload);
      }}
    >
      {/* ================================ VITALS ================================ */}
      <Section
        icon={<VitalsIcon className="text-gray-700" />}
        title="Vitals"
        caretColor="text-green-600"
        more={
          <div className="grid gap-3">
            <div className="grid gap-3 lg:grid-cols-2 ">
              <Collapse title="Body Measurements">
                <div className="grid sm:grid-cols-2 gap-2">
                  <Field label="Head Circumference (cm)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      step="0.1"
                      value={body.headCircumference}
                      onChange={(e) => setBody((s) => ({ ...s, headCircumference: e.target.value }))}
                    />
                  </Field>
                  <Field label="Hip Circumference (cm)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      step="0.1"
                      value={body.hipCircumference}
                      onChange={(e) => setBody((s) => ({ ...s, hipCircumference: e.target.value }))}
                    />
                  </Field>
                </div>
              </Collapse>

              <Collapse title="Physical Activity">
                <div className="grid sm:grid-cols-2 gap-2">
                  <Field label="Exercise Frequency (times/week)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      value={activity.frequency}
                      onChange={(e) => setActivity((s) => ({ ...s, frequency: e.target.value }))}
                    />
                  </Field>
                  <Field label="Duration (minutes/session)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      value={activity.duration}
                      onChange={(e) => setActivity((s) => ({ ...s, duration: e.target.value }))}
                    />
                  </Field>
                  <Field label="Activity Type">
                    <input
                      className="ui-input w-full"
                      placeholder="e.g., Walking, Running, Yoga"
                      value={activity.type}
                      onChange={(e) => setActivity((s) => ({ ...s, type: e.target.value }))}
                    />
                  </Field>
                  <Field label="Activity Level">
                    <select
                      className="ui-input w-full"
                      value={activity.level}
                      onChange={(e) => setActivity((s) => ({ ...s, level: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {ACTIVITY_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Collapse>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Collapse title="Women’s Health">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <Field label="LMP">
                    <DatePicker
                      selected={women.lmp ? new Date(women.lmp) : null}
                      onChange={(date: Date | null) =>
                        setWomen((s) => ({ ...s, lmp: date ? date.toISOString().split("T")[0] : "" }))
                      }
                      dateFormat="yyyy-MM-dd"
                      className="ui-input w-full"
                      placeholderText="Select date"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </Field>
                  <Field label="Gravida (G)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      value={women.gravida}
                      onChange={(e) => setWomen((s) => ({ ...s, gravida: e.target.value }))}
                    />
                  </Field>
                  <Field label="Para (P)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      value={women.para}
                      onChange={(e) => setWomen((s) => ({ ...s, para: e.target.value }))}
                    />
                  </Field>
                  <Field label="Gestational Age (weeks)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      step="0.1"
                      value={women.gestationalAge}
                      onChange={(e) => setWomen((s) => ({ ...s, gestationalAge: e.target.value }))}
                    />
                  </Field>
                </div>
              </Collapse>

              <Collapse title="Lifestyle">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <Field label="Smoking">
                    <select
                      className="ui-input w-full"
                      value={lifestyle.smoking}
                      onChange={(e) => setLifestyle((s) => ({ ...s, smoking: e.target.value }))}
                    >
                      <option value="">Select</option>
                      <option>None</option>
                      <option>Former</option>
                      <option>Current</option>
                    </select>
                  </Field>
                  <Field label="Alcohol">
                    <select
                      className="ui-input w-full"
                      value={lifestyle.alcohol}
                      onChange={(e) => setLifestyle((s) => ({ ...s, alcohol: e.target.value }))}
                    >
                      <option value="">Select</option>
                      <option>None</option>
                      <option>Occasional</option>
                      <option>Regular</option>
                    </select>
                  </Field>
                  <Field label="Dietary Preference">
                    <input
                      className="ui-input w-full"
                      list="dietary-options"
                      placeholder="Type or select…"
                      value={lifestyle.diet}
                      onChange={(e) => setLifestyle((s) => ({ ...s, diet: e.target.value }))}
                    />
                    <datalist id="dietary-options">
                      <option value="Vegetarian" />
                      <option value="Non-Vegetarian" />
                      <option value="Vegan" />
                      <option value="Mixed" />
                      <option value="Keto" />
                      <option value="Low-carb" />
                      <option value="Gluten-free" />
                    </datalist>
                  </Field>
                  <Field label="Stress Level">
                    <select
                      className="ui-input w-full"
                      value={lifestyle.stressLevel}
                      onChange={(e) => setLifestyle((s) => ({ ...s, stressLevel: e.target.value }))}
                    >
                      <option value="">Select</option>
                      <option>Low</option>
                      <option>Moderate</option>
                      <option>High</option>
                    </select>
                  </Field>
                  <Field label="Sleep (hours/day)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      step="0.1"
                      value={lifestyle.sleepHours}
                      onChange={(e) => setLifestyle((s) => ({ ...s, sleepHours: e.target.value }))}
                    />
                  </Field>
                </div>
              </Collapse>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Collapse title="General Assessment">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <Field label="General Assessment">
                    <textarea
                      className="ui-input w-full min-h-[70px]"
                      value={assessment.generalAssessment}
                      onChange={(e) => setAssessment((s) => ({ ...s, generalAssessment: e.target.value }))}
                    />
                  </Field>
                  <Field label="Pain Level (0–10)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      max={10}
                      value={assessment.painLevel}
                      onChange={(e) => setAssessment((s) => ({ ...s, painLevel: e.target.value }))}
                    />
                  </Field>
                  <Field label="Mobility Status">
                    <select
                      className="ui-input w-full"
                      value={assessment.mobilityStatus}
                      onChange={(e) => setAssessment((s) => ({ ...s, mobilityStatus: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {MOBILITY_STATUSES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Collapse>

              <Collapse title="Additional Info + Attachments">
                <Field label="Notes">
                  <textarea
                    className="ui-input w-full min-h-[70px]"
                    value={additional.notes}
                    onChange={(e) => setAdditional((s) => ({ ...s, notes: e.target.value }))}
                  />
                </Field>
                <div className="grid gap-2">
                  <label className="text-[11px] text-gray-600">Attach Document</label>
                  <div className="flex items-center gap-2">
                    <label className="ui-input px-3 py-2 rounded-md border cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setAdditional((s) => ({ ...s, files }));
                        }}
                      />
                      Choose File
                    </label>
                    {additional.files.length > 0 && (
                      <span className="text-xs text-gray-600">
                        {additional.files.map((f) => f.name).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </Collapse>
            </div>
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <Field label="Temperature (°C)" required>
            <input
              className="ui-input w-full"
              value={vitals.temperature}
              onChange={(e) => setVitals((s) => ({ ...s, temperature: e.target.value }))}
            />
          </Field>

          <Field label="Blood Pressure (mmHg)" required>
            <div className="flex items-center gap-2">
              <input
                className="ui-input w-full"
                inputMode="numeric"
                pattern="\d{1,3}"
                maxLength={3}
                placeholder="Sys"
                value={bpSplit.sys}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
                  setBpSplit((s) => ({ ...s, sys: v }));
                }}
              />
              <span className="text-gray-400">/</span>
              <input
                className="ui-input w-full"
                inputMode="numeric"
                pattern="\d{1,3}"
                maxLength={3}
                placeholder="Dia"
                value={bpSplit.dia}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
                  setBpSplit((s) => ({ ...s, dia: v }));
                }}
                onBlur={() => setVitals((s) => ({ ...s, bp: bpStr }))}
              />
            </div>
          </Field>

          <Field label="SpO₂ (%)" required>
            <input
              className="ui-input w-full"
              type="number"
              min={0}
              max={100}
              value={vitals.spo2}
              onChange={(e) => setVitals((s) => ({ ...s, spo2: e.target.value }))}
            />
          </Field>

          <Field label="Weight (kg)" required>
            <input
              type="number"
              className="ui-input w-full"
              value={vitals.weight}
              onChange={(e) => setVitals((s) => ({ ...s, weight: e.target.value }))}
            />
          </Field>

          <Field label="Height (cm)" required>
            <input
              type="number"
              className="ui-input w-full"
              value={vitals.height}
              onChange={(e) => setVitals((s) => ({ ...s, height: e.target.value }))}
            />
          </Field>

          <Field label="BMI">
            <input className="ui-input w-full" value={bmi} readOnly />
          </Field>
        </div>
      </Section>

      {/* =========================== CLINICAL DETAILS ========================== */}
      <Section
        icon={<ClinicalIcon className="text-gray-700" />}
        title="Clinical Details"
        caretColor="text-indigo-600"
        more={
          <div className="grid gap-3 ">
            <div className="grid gap-3 lg:grid-cols-2">
              <Collapse title="Allergy">
                <Field label="Allergy (Free Text)">
                  <textarea
                    className="ui-input w-full min-h-[70px]"
                    value={clinical.allergy}
                    onChange={(e) => setClinical((s) => ({ ...s, allergy: e.target.value }))}
                  />
                </Field>
              </Collapse>

              <Collapse title="Family History">
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr] gap-2 px-1">
                    <div className="text-[11px] text-gray-500">Relation</div>
                    <div className="text-[11px] text-gray-500">Disease</div>
                  </div>

                  <div className="space-y-2">
                    {familyHistoryRows.map((r, i) => {
                      const empty = isFHEmpty(r);
                      const isLast = i === familyHistoryRows.length - 1;
                      return (
                        <div
                          key={i}
                          className="relative grid grid-cols-[1fr_1fr] gap-2 p-2 pr-10 rounded-md border border-gray-200 bg-white"
                        >
                          <input
                            className="ui-input w-full"
                            placeholder="e.g., Mother"
                            value={r.relation}
                            onChange={(e) =>
                              setFamilyHistoryRows((rows) => {
                                const next = rows.slice();
                                next[i] = { ...next[i], relation: e.target.value };
                                return ensureOneBlankAtEnd(next, isFHEmpty, { relation: "", disease: "" });
                              })
                            }
                          />
                          <input
                            className="ui-input w-full"
                            placeholder="e.g., Diabetes"
                            value={r.disease}
                            onChange={(e) =>
                              setFamilyHistoryRows((rows) => {
                                const next = rows.slice();
                                next[i] = { ...next[i], disease: e.target.value };
                                return ensureOneBlankAtEnd(next, isFHEmpty, { relation: "", disease: "" });
                              })
                            }
                          />

                          {/* +/- toggle (inside bounds, no negative right) */}
                          <button
                            type="button"
                            onClick={() =>
                              setFamilyHistoryRows((rows) => {
                                if (isLast && empty) {
                                  // ADD: append brand new blank
                                  return ensureOneBlankAtEnd(
                                    [...rows, { relation: "", disease: "" }],
                                    isFHEmpty,
                                    { relation: "", disease: "" }
                                  );
                                } else {
                                  // REMOVE: drop row, keep one blank at end
                                  const next = rows.filter((_, idx) => idx !== i);
                                  return ensureOneBlankAtEnd(next, isFHEmpty, { relation: "", disease: "" });
                                }
                              })
                            }
                            title={isLast && empty ? "Add row" : "Remove row"}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                            aria-label={isLast && empty ? "Add row" : "Remove row"}
                          >
                            {isLast && empty ? "+" : "−"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Collapse>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Collapse title="Past Procedures">
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_160px] gap-2 px-1">
                    <div className="text-[11px] text-gray-500">Name</div>
                    <div className="text-[11px] text-gray-500">Date</div>
                  </div>

                  <div className="space-y-2">
                    {pastProcedures.map((r, i) => {
                      const empty = isProcEmpty(r);
                      const isLast = i === pastProcedures.length - 1;
                      return (
                        <div
                          key={i}
                          className="relative grid grid-cols-[1fr_160px] gap-2 p-2 pr-10 rounded-md bg-white"
                        >
                          <input
                            className="ui-input w-full"
                            placeholder="e.g., Appendectomy"
                            value={r.name}
                            onChange={(e) =>
                              setPastProcedures((rows) => {
                                const next = rows.slice();
                                next[i] = { ...next[i], name: e.target.value };
                                return ensureOneBlankAtEnd(next, isProcEmpty, { name: "", date: "" });
                              })
                            }
                          />
                          <DatePicker
                            selected={r.date ? new Date(r.date) : null}
                            onChange={(date: Date | null) =>
                              setPastProcedures((rows) => {
                                const next = rows.slice();
                                next[i] = { ...next[i], date: date ? date.toISOString().split("T")[0] : "" };
                                return ensureOneBlankAtEnd(next, isProcEmpty, { name: "", date: "" });
                              })
                            }
                            dateFormat="yyyy-MM-dd"
                            className="ui-input w-full"
                            placeholderText="Select date"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setPastProcedures((rows) => {
                                if (isLast && empty) {
                                  return ensureOneBlankAtEnd(
                                    [...rows, { name: "", date: "" }],
                                    isProcEmpty,
                                    { name: "", date: "" }
                                  );
                                } else {
                                  const next = rows.filter((_, idx) => idx !== i);
                                  return ensureOneBlankAtEnd(next, isProcEmpty, { name: "", date: "" });
                                }
                              })
                            }
                            title={isLast && empty ? "Add row" : "Remove row"}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                            aria-label={isLast && empty ? "Add row" : "Remove row"}
                          >
                            {isLast && empty ? "+" : "−"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Collapse>

              <Collapse title="Investigations Done">
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_160px] gap-2 px-1">
                    <div className="text-[11px] text-gray-500">Name</div>
                    <div className="text-[11px] text-gray-500">Date</div>
                  </div>

                  <div className="space-y-2">
                    {investigationsDone.map((r, i) => {
                      const empty = isInvEmpty(r);
                      const isLast = i === investigationsDone.length - 1;
                      return (
                        <div
                          key={i}
                          className="relative grid grid-cols-[1fr_160px] gap-2 p-2 pr-10 rounded-md bg-white"
                        >
                          <input
                            className="ui-input w-full"
                            placeholder="e.g., CBC, X-ray Chest"
                            value={r.name}
                            onChange={(e) =>
                              setInvestigationsDone((rows) => {
                                const next = rows.slice();
                                next[i] = { ...next[i], name: e.target.value };
                                return ensureOneBlankAtEnd(next, isInvEmpty, { name: "", date: "" });
                              })
                            }
                          />
                          <DatePicker
                            selected={r.date ? new Date(r.date) : null}
                            onChange={(date: Date | null) =>
                              setInvestigationsDone((rows) => {
                                const next = rows.slice();
                                next[i] = { ...next[i], date: date ? date.toISOString().split("T")[0] : "" };
                                return ensureOneBlankAtEnd(next, isInvEmpty, { name: "", date: "" });
                              })
                            }
                            dateFormat="yyyy-MM-dd"
                            className="ui-input w-full"
                            placeholderText="Select date"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setInvestigationsDone((rows) => {
                                if (isLast && empty) {
                                  return ensureOneBlankAtEnd(
                                    [...rows, { name: "", date: "" }],
                                    isInvEmpty,
                                    { name: "", date: "" }
                                  );
                                } else {
                                  const next = rows.filter((_, idx) => idx !== i);
                                  return ensureOneBlankAtEnd(next, isInvEmpty, { name: "", date: "" });
                                }
                              })
                            }
                            title={isLast && empty ? "Add row" : "Remove row"}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                            aria-label={isLast && empty ? "Add row" : "Remove row"}
                          >
                            {isLast && empty ? "+" : "−"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Collapse>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Collapse title="Notes">
                <Field label="Notes">
                  <textarea
                    className="ui-input w-full min-h-[70px]"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                  />
                </Field>
              </Collapse>

              <Collapse title="Attachment">
                <div className="grid gap-2">
                  <label className="text-[11px] text-gray-600">Upload Attachment</label>
                  <div className="flex items-center gap-2">
                    <label className="ui-input px-3 py-2 rounded-md border cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setClinicalFiles(files as File[]);
                        }}
                      />
                      Choose File
                    </label>
                    {clinicalFiles.length > 0 && (
                      <span className="text-xs text-gray-600">
                        {clinicalFiles.map((f) => f.name).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </Collapse>
            </div>
          </div>
        }
      >
        <div className="grid gap-3">
          <Field label="Chief Complaints" required>
            <textarea
              className="ui-input w-full min-h-[70px]"
              value={clinical.chiefComplaints}
              onChange={(e) => setClinical((s) => ({ ...s, chiefComplaints: e.target.value }))}
            />
          </Field>

          <div className="grid gap-2">
            <Field label="Past Medical History (Free Text)">
              <textarea
                className="ui-input w-full min-h-[70px]"
                value={clinical.pastHistory}
                onChange={(e) => setClinical((s) => ({ ...s, pastHistory: e.target.value }))}
              />
            </Field>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-1">
                <div className="text-[11px] text-gray-500">Medicine</div>
                <div className="text-[11px] text-gray-500">Dosage</div>
                <div className="text-[11px] text-gray-500">Since (duration)</div>
              </div>

              <div className="space-y-2">
                {pmhTable.map((r, i) => {
                  const empty = isPmhEmpty(r);
                  const isLast = i === pmhTable.length - 1;
                  return (
                    <div
                      key={i}
                      className="relative grid grid-cols-[1fr_1fr_1fr] gap-2 p-2 pr-10 rounded-md bg-white"
                    >
                      <input
                        className="ui-input w-full"
                        placeholder="e.g., Metformin"
                        value={r.medicine}
                        onChange={(e) =>
                          setPmhTable((rows) => {
                            const next = rows.slice();
                            next[i] = { ...next[i], medicine: e.target.value };
                            return ensureOneBlankAtEnd(next, isPmhEmpty, { medicine: "", dosage: "", since: "" });
                          })
                        }
                      />
                      <input
                        className="ui-input w-full"
                        placeholder="e.g., 500 mg 1-0-1"
                        value={r.dosage}
                        onChange={(e) =>
                          setPmhTable((rows) => {
                            const next = rows.slice();
                            next[i] = { ...next[i], dosage: e.target.value };
                            return ensureOneBlankAtEnd(next, isPmhEmpty, { medicine: "", dosage: "", since: "" });
                          })
                        }
                      />
                      <input
                        className="ui-input w-full"
                        placeholder="e.g., 2 years"
                        value={r.since}
                        onChange={(e) =>
                          setPmhTable((rows) => {
                            const next = rows.slice();
                            next[i] = { ...next[i], since: e.target.value };
                            return ensureOneBlankAtEnd(next, isPmhEmpty, { medicine: "", dosage: "", since: "" });
                          })
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setPmhTable((rows) => {
                            if (isLast && empty) {
                              return ensureOneBlankAtEnd(
                                [...rows, { medicine: "", dosage: "", since: "" }],
                                isPmhEmpty,
                                { medicine: "", dosage: "", since: "" }
                              );
                            } else {
                              const next = rows.filter((_, idx) => idx !== i);
                              return ensureOneBlankAtEnd(next, isPmhEmpty, { medicine: "", dosage: "", since: "" });
                            }
                          })
                        }
                        title={isLast && empty ? "Add row" : "Remove row"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                        aria-label={isLast && empty ? "Add row" : "Remove row"}
                      >
                        {isLast && empty ? "+" : "−"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ================================ MEDICATIONS ================================ */}
      <Section
        icon={
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 border border-emerald-200 overflow-hidden">
            <Image
              src="/icons/medicine.png"
              alt="Medicine"
              width={20}
              height={20}
              className="object-contain"
              priority
            />
          </span>
        }
        title="Medications"
        more={<div className="text-xs text-gray-600">Use the +/- toggle on the right of each row.</div>}
      >
        {(() => {
          type RxRowLocal = RxRow;

          const isRowEmpty = (row: RxRowLocal) =>
            !row.medicine &&
            !row.frequency &&
            !row.duration &&
            !row.durationValue &&
            !row.dosage &&
            !row.dosageValue &&
            !row.instruction;

          // Important: when clicking "+" on last blank → explicitly append a blank,
          // not ensureOneBlankAtEnd (which would do nothing because last is already blank).
          const appendBlank = (rows: RxRowLocal[]) => [
            ...rows,
            { medicine: "", frequency: "", instruction: "", duration: "", dosage: "" },
          ];

          const columns: ColumnDef<RxRowLocal>[] = [
            {
              header: "Medicine *",
              accessorKey: "medicine",
              cell: ({ row, table, getValue }) => {
                const i = row.index;
                return (
                  <input
                    className="ui-input w-full"
                    value={(getValue() as string) || ""}
                    onChange={(e) => (table.options.meta as any).editRx(i, { medicine: e.target.value })}
                    placeholder="e.g., Paracetamol 500"
                    required
                  />
                );
              },
            },
            {
              header: "Frequency *",
              accessorKey: "frequency",
              cell: ({ row, table, getValue }) => {
                const i = row.index;
                return (
                  <select
                    className="ui-input w-full"
                    value={(getValue() as string) || ""}
                    onChange={(e) => (table.options.meta as any).editRx(i, { frequency: e.target.value })}
                    required
                  >
                    <option value="">Select</option>
                    {MED_FREQS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                );
              },
              size: 140,
            },
            {
              header: "Duration",
              id: "duration",
              cell: ({ row, table }) => {
                const i = row.index;
                const r = row.original as RxRowLocal;
                return (
                  <div className="grid grid-cols-[1fr_minmax(90px,110px)] gap-2">
                    <input
                      className="ui-input w-full"
                      inputMode="numeric"
                      placeholder="e.g., 5"
                      value={r.durationValue || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d]/g, "");
                        const unit = r.durationUnit || "days";
                        (table.options.meta as any).editRx(i, {
                          durationValue: v,
                          durationUnit: unit,
                          duration: v ? `${v} ${unit}` : "",
                        });
                      }}
                    />
                    <select
                      className="ui-input w-full"
                      value={r.durationUnit || ""}
                      onChange={(e) => {
                        const unit = e.target.value || "days";
                        (table.options.meta as any).editRx(i, {
                          durationUnit: unit,
                          duration: r.durationValue ? `${r.durationValue} ${unit}` : "",
                        });
                      }}
                    >
                      <option value="">Unit</option>
                      {DURATION_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              },
              size: 170,
            },
            {
              header: "Dosage",
              id: "dosage",
              cell: ({ row, table }) => {
                const i = row.index;
                const r = row.original as RxRowLocal;
                return (
                  <div className="grid grid-cols-[1fr_minmax(90px,110px)] gap-2">
                    <input
                      className="ui-input w-full"
                      placeholder="e.g., 500"
                      value={r.dosageValue || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d.]/g, "");
                        const unit = r.dosageUnit || "mg";
                        (table.options.meta as any).editRx(i, {
                          dosageValue: v,
                          dosageUnit: unit,
                          dosage: v ? `${v} ${unit}` : "",
                        });
                      }}
                    />
                    <select
                      className="ui-input w-full"
                      value={r.dosageUnit || ""}
                      onChange={(e) => {
                        const unit = e.target.value || "mg";
                        (table.options.meta as any).editRx(i, {
                          dosageUnit: unit,
                          dosage: r.dosageValue ? `${r.dosageValue} ${unit}` : "",
                        });
                      }}
                    >
                      <option value="">Unit</option>
                      {DOSAGE_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              },
              size: 170,
            },
            {
              header: "Instruction",
              accessorKey: "instruction",
              cell: ({ row, table, getValue }) => {
                const i = row.index;
                return (
                  <select
                    className="ui-input w-full"
                    value={(getValue() as string) || ""}
                    onChange={(e) => (table.options.meta as any).editRx(i, { instruction: e.target.value })}
                  >
                    <option value="">Select</option>
                    {INSTRUCTION_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                );
              },
              size: 150,
            },
          ];

          const table = useReactTable({
            data: rx as RxRowLocal[],
            columns,
            getCoreRowModel: getCoreRowModel(),
            columnResizeMode: "onChange",
            meta: {
              editRx: (i: number, patch: Partial<RxRowLocal>) => editRx(i, patch as any),
            },
          });

          const onToggleRow = (rowIndex: number) => {
            const lastIndex = rx.length - 1;
            const isLast = rowIndex === lastIndex;
            const empty = isRowEmpty(rx[rowIndex] as RxRowLocal);

            if (isLast && empty) {
              // ADD: explicitly append a blank row
              setRx((rows) => appendBlank(rows as RxRowLocal[]));
            } else {
              // REMOVE: drop the row, then ensure one blank at end
              setRx((rows) => {
                const next = (rows as RxRowLocal[]).filter((_, i) => i !== rowIndex);
                return ensureOneBlankAtEnd(next, isRowEmpty, {
                  medicine: "",
                  frequency: "",
                  instruction: "",
                  duration: "",
                  dosage: "",
                });
              });
            }
          };

          return (
            <div className="mt-1">
              {/* Header */}
              <div className="grid grid-cols-[minmax(220px,1fr)_140px_170px_170px_150px] gap-x-6 px-2 py-2 bg-gray-50 rounded-md">
                {table.getHeaderGroups().map((hg) =>
                  hg.headers.map((h) => (
                    <div key={h.id} className="text-xs sm:text-sm font-medium text-gray-700">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </div>
                  ))
                )}
              </div>

              {/* Rows */}
              <div className="divide-y-0">
                {table.getRowModel().rows.map((r) => {
                  const ri = r.index;
                  const empty = isRowEmpty(r.original as RxRowLocal);
                  const isLast = ri === table.getRowModel().rows.length - 1;
                  return (
                    <div
                      key={r.id}
                      role="row"
                      className="relative grid grid-cols-[minmax(220px,1fr)_140px_170px_170px_150px] gap-x-6 px-2 py-2 pr-10"
                    >
                      {r.getVisibleCells().map((cell) => (
                        <div key={cell.id} role="cell" className="align-top min-w-0">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ))}

                      {/* Right toggle, safely inside the row (no negative offset) */}
                      <button
                        type="button"
                        onClick={() => onToggleRow(ri)}
                        title={isLast && empty ? "Add row" : "Remove row"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                        aria-label={isLast && empty ? "Add row" : "Remove row"}
                      >
                        {isLast && empty ? "+" : "−"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Section>

      {/* ========================= INVESTIGATIONS & ADVICE ======================== */}
      <Section icon={<AdviceIcon className="text-gray-700" />} title="Investigations & Advice">
        <Field label="Investigations">
          <textarea
            className="ui-input w-full min-h-[70px]"
            onChange={(e) =>
              // Store alongside clinical if you need; left here as simple text area
              console.log(e.target.value)
            }
          />
        </Field>
        <Field label="Advice">
          <textarea className="ui-input w-full min-h-[70px]" onChange={(e) => console.log(e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-2">
          <Field label="Doctor Note">
            <textarea className="ui-input w-full min-h-[70px]" onChange={(e) => console.log(e.target.value)} />
          </Field>
          <div className="grid gap-1">
            <label className="text-[11px] text-gray-600">Follow-up Date</label>
            <DatePicker
              selected={null}
              onChange={(date: Date | null) => console.log(date)}
              dateFormat="yyyy-MM-dd"
              className="ui-input w-full"
              placeholderText="Select date"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
          <Field label="Follow-up Instructions">
            <input className="ui-input w-full" onChange={(e) => console.log(e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
          onClick={() => onSave?.(payload)}
        >
          Save Draft
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
        >
          Submit
        </button>
      </div>
    </form>
  );

  /* ------------------------------- Rx helper ------------------------------- */
  function editRx(i: number, patch: Partial<RxRow>) {
    setRx((rows) => {
      const next = rows.slice();
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }
}

/* (Optional) preview helpers if you still use them somewhere */
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-2 py-1.5 text-left text-gray-700 border text-xs sm:text-sm ${className}`}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1.5 text-gray-900 break-words whitespace-normal align-top">{children}</td>;
}
