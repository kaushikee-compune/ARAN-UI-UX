// components/doctor/DigitalRxForm.tsx
"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronDownIcon } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Image from "next/image";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

/** Simple field wrappers (reuse your UI classes) */
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

function Section({
  icon,
  title,
  children,
  more,
  defaultOpen = false,
  caretColor = "text-green-600", // pass different color per section if you like
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
    <section className="rounded-md p-4 shadow-sm bg-white">
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

/** Small collapsible block used inside the Vitals → Show More */

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
    <div className="rounded-md border border-gray-300 shadow-md bg-white">
      {/* Header Row */}
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

      {/* Collapsible content */}
      {open && <div className="px-3 pb-3 pt-1 grid gap-2">{children}</div>}
    </div>
  );
}

// export Collapse;

/* ---- Inline icons to match your style ---- */
const VitalsIcon = (p: any) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...p}
  >
    <path d="M3 12h3l2 6 4-12 3 9h6" />
  </svg>
);
const ClinicalIcon = (p: any) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...p}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 7v10M7 12h10" />
  </svg>
);
const MedsIcon = (p: any) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...p}
  >
    <rect x="3" y="7" width="18" height="12" rx="2" />
    <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
  </svg>
);
const AdviceIcon = (p: any) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...p}
  >
    <path d="M12 2v4M12 18v4M4 12h4M16 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);

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

export default function DigitalRxForm({
  onSave,
  onSubmit,
}: {
  onSave?: (data: any) => void;
  onSubmit?: (data: any) => void;
}) {
  /** ---------- DEFAULT VITALS (expanded) ---------- */
  const [vitals, setVitals] = useState({
    temperature: "",
    spo2: "",
    weight: "",
    height: "",
    // keep a combined bp string for compatibility if you need it elsewhere
    bp: "",
  });

  // Systolic/Diastolic split (1–3 digits, tab to move between fields)
  const [bpSplit, setBpSplit] = useState<{ sys: string; dia: string }>({
    sys: "",
    dia: "",
  });

  // keep vitals.bp up-to-date (e.g. "120/80")
  const bpStr = useMemo(() => {
    const s = bpSplit.sys.trim();
    const d = bpSplit.dia.trim();
    return s || d ? `${s}${d ? "/" + d : ""}` : "";
  }, [bpSplit]);
  const bmi = useMemo(() => {
    const h = Number(vitals.height || "");
    const w = Number(vitals.weight || "");
    if (h > 0 && w > 0) return (w / Math.pow(h / 100, 2)).toFixed(1);
    return "";
  }, [vitals.height, vitals.weight]);

  /** ---------- ADVANCED (Show More → Collapsible groups) ---------- */

  // a) Body Measurements (FHIR anthropometrics)
  const [body, setBody] = useState({
    headCircumference: "", // cm
    hipCircumference: "", // cm
  });

  // b) Physical Activity
  const [activity, setActivity] = useState({
    frequency: "", // e.g. times/week
    duration: "", // minutes/session
    type: "", // e.g. walking, running, yoga
    level: "", // sedentary/light/moderate/very
  });
  const ACTIVITY_LEVELS = [
    "Sedentary",
    "Lightly Active",
    "Moderately Active",
    "Very Active",
    "Athlete",
  ];

  // c) General Assessment (FHIR-like observables)
  const [assessment, setAssessment] = useState({
    generalAssessment: "", // free text summary
    painLevel: "", // 0-10
    mobilityStatus: "", // Independent / Assisted / Wheelchair / Bedridden
  });
  const MOBILITY_STATUSES = [
    "Independent",
    "Assisted",
    "Wheelchair",
    "Bedridden",
  ];

  // d) Women’s Health (typical obstetric data)
  const [women, setWomen] = useState({
    lmp: "", // yyyy-mm-dd
    gravida: "", // G
    para: "", // P
    gestationalAge: "", // weeks
  });

  // e) Lifestyle
  const [lifestyle, setLifestyle] = useState({
    smoking: "", // None / Former / Current
    alcohol: "", // None / Occasional / Regular
    diet: "", // Veg / Non-veg / Vegan / Mixed
    stressLevel: "", // Low / Moderate / High
    sleepHours: "", // hours/day
  });

  // f) Additional info + document
  const [additional, setAdditional] = useState({
    notes: "",
    files: [] as File[],
  });

  /** ---------- Clinical & Rx & Plan (unchanged) ---------- */
  const [clinical, setClinical] = useState({
    chiefComplaints: "",
    note: "",
    pastHistory: "",
    familyHistory: "",
    allergy: "",
  });

  // --- Clinical Details: new states ---
  const [pmhTable, setPmhTable] = useState(
    [{ medicine: "", dosage: "", since: "" }] // Past Medical History table
  );

  const [familyHistoryRows, setFamilyHistoryRows] = useState([
    { relation: "", disease: "" },
  ]);

  const [pastProcedures, setPastProcedures] = useState([
    { name: "", date: "" },
  ]);

  const [investigationsDone, setInvestigationsDone] = useState([
    { name: "", date: "" },
  ]);

  const [clinicalNotes, setClinicalNotes] = useState("");
  const [clinicalFiles, setClinicalFiles] = useState<File[]>([]);

  const [rx, setRx] = useState<RxRow[]>([
    { medicine: "", frequency: "", instruction: "", duration: "", dosage: "" },
  ]);

  const [plan, setPlan] = useState({
    investigations: "",
    advice: "",
    doctorNote: "",
    followUpInstructions: "",
    followUpDate: "",
  });

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

  const INSTRUCTION_OPTS = [
    "After food",
    "Before food",
    "With water",
    "With milk",
    "PRN pain/fever",
  ];

  const DURATION_UNITS = ["days", "weeks", "months"];
  const DOSAGE_UNITS = ["mg", "mcg", "g", "ml", "drops", "tabs", "caps"];

  // Assemble payload
  const payload = {
    vitals: { ...vitals, bp: bpStr, bmi },
    bodyMeasurements: body,
    physicalActivity: activity,
    generalAssessment: assessment,
    womenHealth: women,
    lifestyle,
    additional: {
      notes: additional.notes,
      files: additional.files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    },
    clinical,
    prescription: rx,
    plan,
  };

  return (
    <form
      className="grid gap-4 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(payload);
      }}
    >
      <Section
        icon={<VitalsIcon className="text-gray-700" />}
        title="Vitals"
        caretColor="text-green-600"
        more={
          <div className="grid gap-3">
            {/* Row 1 — Body Measurements | Physical Activity */}
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
                      onChange={(e) =>
                        setBody((s) => ({
                          ...s,
                          headCircumference: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Hip Circumference (cm)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      step="0.1"
                      value={body.hipCircumference}
                      onChange={(e) =>
                        setBody((s) => ({
                          ...s,
                          hipCircumference: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setActivity((s) => ({
                          ...s,
                          frequency: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Duration (minutes/session)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      value={activity.duration}
                      onChange={(e) =>
                        setActivity((s) => ({ ...s, duration: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Activity Type">
                    <input
                      className="ui-input w-full"
                      placeholder="e.g., Walking, Running, Yoga"
                      value={activity.type}
                      onChange={(e) =>
                        setActivity((s) => ({ ...s, type: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Activity Level">
                    <select
                      className="ui-input w-full"
                      value={activity.level}
                      onChange={(e) =>
                        setActivity((s) => ({ ...s, level: e.target.value }))
                      }
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

            {/* Row 2 — Women’s Health | Lifestyle */}
            <div className="grid gap-3 lg:grid-cols-2">
              <Collapse title="Women’s Health">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <Field label="LMP">
                    <DatePicker
                      selected={women.lmp ? new Date(women.lmp) : null}
                      onChange={(date: Date | null) =>
                        setWomen((s) => ({
                          ...s,
                          lmp: date ? date.toISOString().split("T")[0] : "",
                        }))
                      }
                      dateFormat="yyyy-MM-dd"
                      className="ui-input w-full"
                      placeholderText="Select date"
                      showMonthDropdown // ✅ show month dropdown
                      showYearDropdown // ✅ show year dropdown
                      dropdownMode="select" // ✅ "select" gives you dropdowns instead of scroll
                    />
                  </Field>
                  <Field label="Gravida (G)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      value={women.gravida}
                      onChange={(e) =>
                        setWomen((s) => ({ ...s, gravida: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Para (P)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      value={women.para}
                      onChange={(e) =>
                        setWomen((s) => ({ ...s, para: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Gestational Age (weeks)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      step="0.1"
                      value={women.gestationalAge}
                      onChange={(e) =>
                        setWomen((s) => ({
                          ...s,
                          gestationalAge: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setLifestyle((s) => ({ ...s, smoking: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setLifestyle((s) => ({ ...s, alcohol: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setLifestyle((s) => ({ ...s, diet: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setLifestyle((s) => ({
                          ...s,
                          stressLevel: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setLifestyle((s) => ({
                          ...s,
                          sleepHours: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
              </Collapse>
            </div>

            {/* Row 3 — General Assessment | Additional Info */}
            <div className="grid gap-3 lg:grid-cols-2">
              <Collapse title="General Assessment">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <Field label="General Assessment">
                    <textarea
                      className="ui-input w-full min-h-[70px]"
                      value={assessment.generalAssessment}
                      onChange={(e) =>
                        setAssessment((s) => ({
                          ...s,
                          generalAssessment: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Pain Level (0–10)">
                    <input
                      className="ui-input w-full"
                      type="number"
                      min={0}
                      max={10}
                      value={assessment.painLevel}
                      onChange={(e) =>
                        setAssessment((s) => ({
                          ...s,
                          painLevel: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Mobility Status">
                    <select
                      className="ui-input w-full"
                      value={assessment.mobilityStatus}
                      onChange={(e) =>
                        setAssessment((s) => ({
                          ...s,
                          mobilityStatus: e.target.value,
                        }))
                      }
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
                    onChange={(e) =>
                      setAdditional((s) => ({ ...s, notes: e.target.value }))
                    }
                  />
                </Field>
                <div className="grid gap-2">
                  <label className="text-[11px] text-gray-600">
                    Attach Document
                  </label>
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
        {/* DEFAULT VITALS GRID (unchanged) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <Field label="Temperature (°C)" required>
            <input
              className="ui-input w-full"
              value={vitals.temperature}
              onChange={(e) =>
                setVitals((s) => ({ ...s, temperature: e.target.value }))
              }
            />
          </Field>

          {/* BP split: systolic / diastolic (1–3 digits each) */}
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
              onChange={(e) =>
                setVitals((s) => ({ ...s, spo2: e.target.value }))
              }
            />
          </Field>

          <Field label="Weight (kg)" required>
            <input
              type="number"
              className="ui-input w-full"
              value={vitals.weight}
              onChange={(e) =>
                setVitals((s) => ({ ...s, weight: e.target.value }))
              }
            />
          </Field>

          <Field label="Height (cm)" required>
            <input
              type="number"
              className="ui-input w-full"
              value={vitals.height}
              onChange={(e) =>
                setVitals((s) => ({ ...s, height: e.target.value }))
              }
            />
          </Field>

          <Field label="BMI">
            <input className="ui-input w-full" value={bmi} readOnly />
          </Field>
        </div>
      </Section>

      {/* 2) CLINICAL DETAILS (unchanged; textareas now use ui-input for same focus look) */}
      <Section
        icon={<ClinicalIcon className="text-gray-700" />}
        title="Clinical Details"
        caretColor="text-indigo-600"
        more={
          <div className="grid gap-3 ">
            {/* Row 1 — Allergy | Family History */}
            <div className="grid gap-3 lg:grid-cols-2">
              <Collapse title="Allergy">
                <Field label="Allergy (Free Text)">
                  <textarea
                    className="ui-input w-full min-h-[70px] border border-gray-400 shadow-md bg-white"
                    value={clinical.allergy}
                    onChange={(e) =>
                      setClinical((s) => ({ ...s, allergy: e.target.value }))
                    }
                  />
                </Field>
              </Collapse>

              <Collapse title="Family History">
                {/* Mini table: Relation | Disease */}
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 ">
                    <div className="text-[11px] text-gray-500">Relation</div>
                    <div className="text-[11px] text-gray-500">Disease</div>
                    <div />
                  </div>
                  <div className="space-y-2">
                    {familyHistoryRows.map((r, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_1fr_auto] gap-2 p-2 rounded-md border border-gray-200 shadow-md bg-white"
                      >
                        <input
                          className="ui-input w-full"
                          placeholder="e.g., Mother"
                          value={r.relation}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFamilyHistoryRows((rows) => {
                              const next = rows.slice();
                              next[i] = { ...next[i], relation: v };
                              return next;
                            });
                          }}
                        />
                        <input
                          className="ui-input w-full"
                          placeholder="e.g., Diabetes"
                          value={r.disease}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFamilyHistoryRows((rows) => {
                              const next = rows.slice();
                              next[i] = { ...next[i], disease: v };
                              return next;
                            });
                          }}
                        />
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border hover:bg-gray-50 text-gray-600"
                          onClick={() =>
                            setFamilyHistoryRows((rows) =>
                              rows.filter((_, idx) => idx !== i)
                            )
                          }
                          title="Delete row"
                          aria-label="Delete row"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    onClick={() =>
                      setFamilyHistoryRows((rows) => [
                        ...rows,
                        { relation: "", disease: "" },
                      ])
                    }
                  >
                    + Add Row
                  </button>
                </div>
              </Collapse>
            </div>

            {/* Row 2 — Past Procedures | Investigations Done */}
            <div className="grid gap-3 lg:grid-cols-2">
              <Collapse title="Past Procedures">
                {/* Mini table: Name | Date */}
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_160px_auto] gap-2 px-1">
                    <div className="text-[11px] text-gray-500">Name</div>
                    <div className="text-[11px] text-gray-500">Date</div>
                    <div />
                  </div>
                  <div className="space-y-2">
                    {pastProcedures.map((r, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_160px_auto] gap-2 p-2 rounded-md shadow-sm bg-white"
                      >
                        <input
                          className="ui-input w-full"
                          placeholder="e.g., Appendectomy"
                          value={r.name}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPastProcedures((rows) => {
                              const next = rows.slice();
                              next[i] = { ...next[i], name: v };
                              return next;
                            });
                          }}
                        />
                        <DatePicker
                          selected={r.date ? new Date(r.date) : null}
                          onChange={(date: Date | null) => {
                            const v = date
                              ? date.toISOString().split("T")[0]
                              : "";
                            setPastProcedures((rows) => {
                              const next = rows.slice();
                              next[i] = { ...next[i], date: v };
                              return next;
                            });
                          }}
                          dateFormat="yyyy-MM-dd"
                          className="ui-input w-full"
                          placeholderText="Select date"
                          showMonthDropdown // ✅ show month dropdown
                          showYearDropdown // ✅ show year dropdown
                          dropdownMode="select" // ✅ "select" gives you dropdowns instead of scroll
                        />
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border hover:bg-gray-50 text-gray-600"
                          onClick={() =>
                            setPastProcedures((rows) =>
                              rows.filter((_, idx) => idx !== i)
                            )
                          }
                          title="Delete row"
                          aria-label="Delete row"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    onClick={() =>
                      setPastProcedures((rows) => [
                        ...rows,
                        { name: "", date: "" },
                      ])
                    }
                  >
                    + Add Row
                  </button>
                </div>
              </Collapse>

              <Collapse title="Investigations Done">
                {/* Mini table: Name | Date */}
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_160px_auto] gap-2 px-1">
                    <div className="text-[11px] text-gray-500">Name</div>
                    <div className="text-[11px] text-gray-500">Date</div>
                    <div />
                  </div>
                  <div className="space-y-2">
                    {investigationsDone.map((r, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_160px_auto] gap-2 p-2 rounded-md shadow-sm bg-white"
                      >
                        <input
                          className="ui-input w-full"
                          placeholder="e.g., CBC, X-ray Chest"
                          value={r.name}
                          onChange={(e) => {
                            const v = e.target.value;
                            setInvestigationsDone((rows) => {
                              const next = rows.slice();
                              next[i] = { ...next[i], name: v };
                              return next;
                            });
                          }}
                        />
                        <DatePicker
                          selected={r.date ? new Date(r.date) : null}
                          onChange={(date: Date | null) => {
                            const v = date
                              ? date.toISOString().split("T")[0]
                              : "";
                            setInvestigationsDone((rows) => {
                              const next = rows.slice();
                              next[i] = { ...next[i], date: v };
                              return next;
                            });
                          }}
                          dateFormat="yyyy-MM-dd"
                          className="ui-input w-full"
                          placeholderText="Select date"
                          showMonthDropdown // ✅ show month dropdown
                          showYearDropdown // ✅ show year dropdown
                          dropdownMode="select" // ✅ "select" gives you dropdowns instead of scroll
                        />

                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full border hover:bg-gray-50 text-gray-600"
                          onClick={() =>
                            setInvestigationsDone((rows) =>
                              rows.filter((_, idx) => idx !== i)
                            )
                          }
                          title="Delete row"
                          aria-label="Delete row"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    onClick={() =>
                      setInvestigationsDone((rows) => [
                        ...rows,
                        { name: "", date: "" },
                      ])
                    }
                  >
                    + Add Row
                  </button>
                </div>
              </Collapse>
            </div>

            {/* Row 3 — Notes | Attachment */}
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
                  <label className="text-[11px] text-gray-600">
                    Upload Attachment
                  </label>
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
        {/* DEFAULT fields — (A) Chief Complaints | (B) Past Medical History */}
        <div className="grid gap-3">
          {/* A) Chief Complaints — Free Text */}
          <Field label="Chief Complaints" required>
            <textarea
              className="ui-input w-full min-h-[70px]"
              value={clinical.chiefComplaints}
              onChange={(e) =>
                setClinical((s) => ({ ...s, chiefComplaints: e.target.value }))
              }
            />
          </Field>

          {/* B) Past Medical History — Free Text + Mini Table */}
          <div className="grid gap-2">
            <Field label="Past Medical History (Free Text)">
              <textarea
                className="ui-input w-full min-h-[70px]"
                value={clinical.pastHistory}
                onChange={(e) =>
                  setClinical((s) => ({ ...s, pastHistory: e.target.value }))
                }
              />
            </Field>

            {/* Mini table: Medicines | Dosage | Since (duration) */}
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1">
                <div className="text-[11px] text-gray-500">Medicine</div>
                <div className="text-[11px] text-gray-500">Dosage</div>
                <div className="text-[11px] text-gray-500">
                  Since (duration)
                </div>
                <div />
              </div>

              <div className="space-y-2">
                {pmhTable.map((r, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 p-2 rounded-md shadow-sm bg-white"
                  >
                    <input
                      className="ui-input w-full"
                      placeholder="e.g., Metformin"
                      value={r.medicine}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPmhTable((rows) => {
                          const next = rows.slice();
                          next[i] = { ...next[i], medicine: v };
                          return next;
                        });
                      }}
                    />
                    <input
                      className="ui-input w-full"
                      placeholder="e.g., 500 mg 1-0-1"
                      value={r.dosage}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPmhTable((rows) => {
                          const next = rows.slice();
                          next[i] = { ...next[i], dosage: v };
                          return next;
                        });
                      }}
                    />
                    <input
                      className="ui-input w-full"
                      placeholder="e.g., 2 years"
                      value={r.since}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPmhTable((rows) => {
                          const next = rows.slice();
                          next[i] = { ...next[i], since: v };
                          return next;
                        });
                      }}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full border hover:bg-gray-50 text-gray-600"
                      onClick={() =>
                        setPmhTable((rows) =>
                          rows.filter((_, idx) => idx !== i)
                        )
                      }
                      title="Delete row"
                      aria-label="Delete row"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                onClick={() =>
                  setPmhTable((rows) => [
                    ...rows,
                    { medicine: "", dosage: "", since: "" },
                  ])
                }
              >
                + Add Row
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* 3) MEDICATIONS (unchanged) */}

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
        more={
          <div className="text-xs text-gray-600">
            Use the +/- toggle on a row to quickly add or remove. Frequency
            &amp; Instruction are dropdowns.
          </div>
        }
      >
        {/* ---------- Types + helpers (local to this section) ---------- */}
        {(() => {
          type RxRow = {
            medicine: string;
            frequency: string;
            durationValue?: string;
            durationUnit?: string;
            duration?: string; // legacy combined
            dosageValue?: string;
            dosageUnit?: string;
            dosage?: string; // legacy combined
            instruction?: string;
          };

          const isRowEmpty = (row: RxRow) =>
            !row.medicine &&
            !row.frequency &&
            !row.duration &&
            !row.durationValue &&
            !row.dosage &&
            !row.dosageValue &&
            !row.instruction;

          const ensureOneBlankAtEnd = (rows: RxRow[]) => {
            const out = rows.filter(Boolean);
            if (out.length === 0 || !isRowEmpty(out[out.length - 1])) {
              out.push({ medicine: "", frequency: "" });
            }
            return out;
          };

          // ---- Columns (TanStack) ----
          const columns: ColumnDef<RxRow>[] = [
            {
              header: "Medicine *",
              accessorKey: "medicine",
              cell: ({ row, table, getValue }) => {
                const i = row.index;
                return (
                  <input
                    className="ui-input w-full"
                    value={(getValue() as string) || ""}
                    onChange={(e) =>
                      (table.options.meta as any).editRx(i, {
                        medicine: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      (table.options.meta as any).editRx(i, {
                        frequency: e.target.value,
                      })
                    }
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
              size: 160,
            },
            {
              header: "Duration",
              id: "duration",
              cell: ({ row, table }) => {
                const i = row.index;
                const r = row.original as RxRow;
                return (
                  <div className="grid grid-cols-[1fr_minmax(100px,120px)] gap-2">
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
                          duration: r.durationValue
                            ? `${r.durationValue} ${unit}`
                            : "",
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
              size: 200,
            },
            {
              header: "Dosage",
              id: "dosage",
              cell: ({ row, table }) => {
                const i = row.index;
                const r = row.original as RxRow;
                return (
                  <div className="grid grid-cols-[1fr_minmax(100px,120px)] gap-2">
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
                          dosage: r.dosageValue
                            ? `${r.dosageValue} ${unit}`
                            : "",
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
              size: 200,
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
                    onChange={(e) =>
                      (table.options.meta as any).editRx(i, {
                        instruction: e.target.value,
                      })
                    }
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
              size: 180,
            },
          ];

          // ---- Table instance ----
          const table = useReactTable({
            data: rx as RxRow[],
            columns,
            getCoreRowModel: getCoreRowModel(),
            columnResizeMode: "onChange",
            meta: {
              editRx: (i: number, patch: Partial<RxRow>) =>
                editRx(i, patch as any), // uses your existing editRx
            },
          });

          // ---- +/- toggle behavior ----
          const onToggleRow = (rowIndex: number) => {
            const adder =
              rowIndex === rx.length - 1 && isRowEmpty(rx[rowIndex] as RxRow);
            if (adder) {
              setRx((rows) => ensureOneBlankAtEnd(rows as RxRow[]));
            } else {
              setRx((rows) => {
                const next = rows.filter((_, i) => i !== rowIndex) as RxRow[];
                return ensureOneBlankAtEnd(next);
              });
            }
          };

          return (
            <div className="mt-1">
              {/* Borderless header */}
              <div className="grid grid-cols-[minmax(220px,1fr)_160px_200px_200px_180px] gap-x-8 px-2 py-2 bg-gray-50 rounded-md">
                {table.getHeaderGroups().map((hg) =>
                  hg.headers.map((h) => (
                    <div
                      key={h.id}
                      className="text-xs sm:text-sm font-medium text-gray-700"
                    >
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </div>
                  ))
                )}
              </div>

              {/* Rows — borderless, each with a right-side attached toggle */}
              <div className="divide-y-0">
                {table.getRowModel().rows.map((r) => {
                  const ri = r.index;
                  const empty = isRowEmpty(r.original as RxRow);
                  return (
                    <div
                      key={r.id}
                      role="row"
                      className="relative group grid grid-cols-[minmax(220px,1fr)_160px_200px_200px_180px] gap-x-8 px-2 py-2"
                    >
                      {r.getVisibleCells().map((cell) => (
                        <div key={cell.id} role="cell" className="align-top">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      ))}

                      {/* Right-side toggle, outside the grid area but visually attached */}
                      <button
                        type="button"
                        onClick={() => onToggleRow(ri)}
                        title={empty ? "Add row" : "Remove row"}
                        className={[
                          "absolute -right-8 top-1/2 -translate-y-1/2",
                          "w-7 h-7 rounded-full border leading-none",
                          "bg-white text-gray-700 hover:bg-gray-50",
                          "shadow-sm",
                        ].join(" ")}
                        aria-label={empty ? "Add row" : "Remove row"}
                      >
                        {empty ? "+" : "−"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Section>

      {/* 4) INVESTIGATIONS & ADVICE (unchanged; textareas = ui-input) */}
      <Section
        icon={<AdviceIcon className="text-gray-700" />}
        title="Investigations & Advice"
      >
        <Field label="Investigations">
          <textarea
            className="ui-input w-full min-h-[70px]"
            value={plan.investigations}
            onChange={(e) =>
              setPlan((s) => ({ ...s, investigations: e.target.value }))
            }
          />
        </Field>
        <Field label="Advice">
          <textarea
            className="ui-input w-full min-h-[70px]"
            value={plan.advice}
            onChange={(e) => setPlan((s) => ({ ...s, advice: e.target.value }))}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-2">
          <Field label="Doctor Note">
            <textarea
              className="ui-input w-full min-h-[70px]"
              value={plan.doctorNote}
              onChange={(e) =>
                setPlan((s) => ({ ...s, doctorNote: e.target.value }))
              }
            />
          </Field>
          <div className="grid gap-1">
            <label className="text-[11px] text-gray-600">Follow-up Date</label>
            <DatePicker
              selected={plan.followUpDate ? new Date(plan.followUpDate) : null}
              onChange={(date: Date | null) =>
                setPlan((s) => ({
                  ...s,
                  followUpDate: date ? date.toISOString().split("T")[0] : "",
                }))
              }
              dateFormat="yyyy-MM-dd"
              className="ui-input w-full"
              placeholderText="Select date"
              showMonthDropdown // ✅ show month dropdown
              showYearDropdown // ✅ show year dropdown
              dropdownMode="select" // ✅ "select" gives you dropdowns instead of scroll
            />
          </div>
          <Field label="Follow-up Instructions">
            <input
              className="ui-input w-full"
              value={plan.followUpInstructions}
              onChange={(e) =>
                setPlan((s) => ({ ...s, followUpInstructions: e.target.value }))
              }
            />
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

  function editRx(i: number, patch: Partial<RxRow>) {
    setRx((rows) => {
      const next = rows.slice();
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }
}

/* Reuse table cells */
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-2 py-1.5 text-left text-gray-700 border text-xs sm:text-sm ${className}`}
    >
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
