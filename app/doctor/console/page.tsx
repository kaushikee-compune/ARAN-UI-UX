// app/doctor/console/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useLayoutEffect, useRef, useCallback } from "react";
import Image from "next/image";

/* ------------------------------ Minimal types ------------------------------ */
// Matches your canonical DigitalRx structure (trimmed to what we render)
type DigitalRxFormState = {
  vitals: {
    temperature?: string;
    bp?: string;
    bpSys?: string;
    bpDia?: string;
    spo2?: string;
    weight?: string;
    height?: string;
    bmi?: string;
    lmpDate?: string;
    bodyMeasurement?: { waist?: string; hip?: string; neck?: string; chest?: string };
    womensHealth?: {
      lmpDate?: string; cycleLengthDays?: string; cycleRegularity?: string;
      gravidity?: string; parity?: string; abortions?: string;
    };
    lifestyle?: {
      smokingStatus?: "Never" | "Former" | "Current";
      alcoholIntake?: "None" | "Occasional" | "Moderate" | "Heavy";
      dietType?: "Mixed" | "Vegetarian" | "Vegan" | "Keto" | "Other";
      sleepHours?: string; stressLevel?: "Low" | "Moderate" | "High";
    };
    physicalActivity?: {
      logs?: { activity?: string; durationMin?: string; intensity?: "Low" | "Moderate" | "High"; frequencyPerWeek?: string }[];
    };
    GeneralAssessment?: {
      painScore?: string;
      temperatureSite?: "Oral" | "Axillary" | "Tympanic" | "Rectal" | "Temporal";
      posture?: "Normal" | "Stooped" | "Bedridden";
      edema?: "None" | "Mild" | "Moderate" | "Severe";
      pallor?: "Absent" | "Mild" | "Moderate" | "Severe";
    };
    vitalsNotes?: string;
    vitalsUploads?: { name: string; size?: number }[];
  };
  clinical: {
    chiefComplaints?: string;
    pastHistory?: string;
    familyHistory?: string;
    allergy?: string;
    currentMedications?: { medicine?: string; dosage?: string; since?: string }[];
    familyHistoryRows?: { relation?: string; ailment?: string }[];
    proceduresDone?: { name?: string; date?: string }[];
    investigationsDone?: { name?: string; date?: string }[];
  };
  prescription: { medicine: string; frequency: string; duration: string; dosage: string; instruction: string }[];
  plan: {
    investigations?: string;
    investigationInstructions?: string;
    advice?: string;
    doctorNote?: string;
    followUpInstructions?: string;
    followUpDate?: string; // dd-mm-yyyy
    investigationNote?: string;
    patientNote?: string;
    attachments?: { files?: File[]; note?: string };
  };
};

type CanonicalRecord = {
  id: string;
  patientId: string;
  dateISO: string; // dd-mm-yyyy
  type: "Prescription" | "Vitals" | "Immunization" | "Lab" | "DischargeSummary";
  source: "digital-rx";
  canonical: DigitalRxFormState;
  meta?: {
    hospital?: string;
    doctor?: { name?: string; regNo?: string; specialty?: string };
    labPanel?: Record<string, string>;
    immunization?: { vaccine?: string; lot?: string; site?: string; nextDose?: string };
    discharge?: { diagnosis?: string; course?: string };
  };
};

/* ------------------------------ Tiny utilities ------------------------------ */
const nonEmpty = (v: unknown) =>
  v !== undefined && v !== null && (typeof v !== "string" || v.trim() !== "");
const safe = (s?: string) => (nonEmpty(s) ? String(s) : "");
const anyRowHas = <T extends Record<string, any>>(rows?: T[], keys: (keyof T)[] = []) =>
  !!rows?.some((r) => keys.some((k) => nonEmpty(r?.[k as string])));
const compactRows = <T extends Record<string, any>>(rows?: T[], keys: (keyof T)[] = []) =>
  (rows ?? []).filter((r) => keys.some((k) => nonEmpty(r?.[k as string])));

function parseDDMMYYYY(s: string) {
  const [dd, mm, yyyy] = s.split("-").map((n) => parseInt(n, 10));
  return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
}

/* ---------------------------------- Data ---------------------------------- */
// Local, safe loader (client-only). Reads /public/data/mock-records.json.
async function loadMockRecords(patientId?: string): Promise<CanonicalRecord[]> {
  if (typeof window === "undefined") return [];
  const res = await fetch("/data/mock-records.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Mock JSON not found at /public/data/mock-records.json");
  const all = (await res.json()) as CanonicalRecord[];
  return patientId ? all.filter((r) => r.patientId === patientId) : all;
}

function groupByDate<T extends { dateISO: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  rows.forEach((r) => map.set(r.dateISO, [...(map.get(r.dateISO) || []), r]));
  return Array.from(map.entries())
    .sort((a, b) => parseDDMMYYYY(b[0]) - parseDDMMYYYY(a[0]))
    .map(([dateISO, items]) => ({ dateISO, items }));
}

/* ------------------------------ Small styling ------------------------------ */
const TAB_COLORS = [
  { bg: "#E0F2FE", text: "#0C4A6E" }, // Sky
  { bg: "#FDE68A", text: "#92400E" }, // Amber
  { bg: "#FBCFE8", text: "#831843" }, // Pink
  { bg: "#C7D2FE", text: "#3730A3" }, // Indigo
  { bg: "#BBF7D0", text: "#065F46" }, // Green
  { bg: "#FEF9C3", text: "#854D0E" }, // Yellow
  { bg: "#E9D5FF", text: "#6B21A8" }, // Purple
];
const colorFor = (i: number) => TAB_COLORS[i % TAB_COLORS.length];

/* ---------------------------------- Page ---------------------------------- */
export default function DoctorConsolePage() {
  // Patient header (placeholder)
  const patient = useMemo(
    () => ({
      name: "Ms Shampa Goswami",
      age: "52 yrs",
      gender: "Female",
      abhaNumber: "91-5510-2061-4469",
      abhaAddress: "shampa.go@sbx",
    }),
    []
  );

  // Past records state (from /public/data/mock-records.json)
  const [byDate, setByDate] = useState<{ dateISO: string; items: CanonicalRecord[] }[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const canon = await loadMockRecords("pat_001");
        if (!alive) return;
        setByDate(groupByDate(canon));
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load mock data");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => setSelectedItemIdx(0), [tabIndex]);

  const selectedDay = byDate[tabIndex];
  const currentRecord = selectedDay?.items[selectedItemIdx]; // first record of that date

  const onPrint = useCallback(() => {
    window.print();
  }, []);

  if (error) {
    return (
      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {/* Header strip with Print */}
      <div className="ui-card px-3 py-2 flex items-center gap-2">
        <span className="text-sm font-medium">Past Health Records</span>
        <div className="ml-auto">
          <TinyIcon img="/icons/print.png" label="Print" onClick={onPrint} />
        </div>
      </div>

      {/* Preview with date tabs */}
      <PreviewPaper
        patient={patient}
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        byDate={byDate}
        selectedItemIdx={selectedItemIdx}
        setSelectedItemIdx={setSelectedItemIdx}
        payloadOverride={currentRecord?.canonical}
      />
    </div>
  );
}

/* =============================== Preview =============================== */
function PreviewPaper({
  patient,
  tabIndex,
  setTabIndex,
  byDate,
  selectedItemIdx,
  setSelectedItemIdx,
  payloadOverride,
}: {
  patient: { name: string; age: string; gender: string; abhaNumber: string; abhaAddress: string };
  tabIndex: number;
  setTabIndex: React.Dispatch<React.SetStateAction<number>>;
  byDate: { dateISO: string; items: CanonicalRecord[] }[];
  selectedItemIdx: number;
  setSelectedItemIdx: React.Dispatch<React.SetStateAction<number>>;
  payloadOverride?: DigitalRxFormState;
}) {
  return (
    <div className="min-w-0 md:sticky md:top-20 self-start">
      <div
        className="relative mx-auto bg-white border border-gray-300 rounded-xl shadow-sm overflow-visible"
        style={{ minHeight: 680, background: "linear-gradient(180deg,#ffffff 0%,#fcfcfc 100%)" }}
      >
        {/* Tabs rail (dates) */}
        <div className="absolute left-4 -top-5 flex flex-wrap gap-2 z-0" aria-label="Health record tabs">
          {byDate.map((d, i) => {
            const col = colorFor(i);
            const active = tabIndex === i;
            return (
              <button
                key={d.dateISO}
                onClick={() => setTabIndex(i)}
                aria-pressed={active}
                className={[
                  "px-4 py-2 text-sm font-semibold border-1 border-gray-300 shadow-lg rounded-tl-none rounded-tr-lg",
                  active ? "ring-2 z-20" : "hover:brightness-[.98] z-0",
                ].join(" ")}
                style={{
                  background: col.bg,
                  color: col.text,
                  borderColor: active ? "#1b1a1a" : "#b8b5b5",
                  boxShadow: active ? "0 2px 0 rgba(0,0,0,.04), 0 8px 16px rgba(0,0,0,.06)" : undefined,
                  transform: active ? "translateY(-4px)" : undefined,
                  outline: "none",
                }}
                title={d.dateISO}
              >
                <span className="relative -top-[7px]">{d.dateISO}</span>
              </button>
            );
          })}
        </div>

        {/* top cover under rail */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-xl z-10"
          style={{ background: "linear-gradient(180deg,#ffffff 0%,#fcfcfc 100%)" }}
          aria-hidden
        />

        {/* Paper inner */}
        <div className="relative z-0 p-4 md:p-6">
          {/* Patient header */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-start">
            <div className="min-w-0 pr-3">
              <div className="text-xs text-gray-500 mb-1">Patient</div>
              <div className="text-sm font-semibold">{patient.name}</div>
              <div className="text-xs text-gray-700 mt-0.5">
                {patient.gender} • {patient.age}
              </div>
              <div className="text-xs text-gray-600 mt-1">ABHA No: {patient.abhaNumber}</div>
              <div className="text-xs text-gray-600">ABHA Address: {patient.abhaAddress}</div>
            </div>
            <Image src="/whitelogo.png" alt="ARAN Logo" width={40} height={40} />
            <div className="flex items-start justify-end pl-3">
              <button
                className="inline-flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900"
                title="Open Patient Summary"
              >
                <SummaryIcon className="w-4 h-4" />
                <span className="font-medium">Patient Summary</span>
              </button>
            </div>
          </div>

          <div className="my-3 border-t border-gray-200" />

          {/* Current date’s record picker (if multiple records that day) */}
          {byDate[tabIndex]?.items?.length > 1 && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Records on {byDate[tabIndex].dateISO}</div>
              <div className="flex flex-wrap gap-2">
                {byDate[tabIndex].items.map((r, idx) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedItemIdx(idx)}
                    className={[
                      "px-2 py-1 rounded border text-xs",
                      idx === selectedItemIdx ? "bg-gray-900 text-white border-gray-900" : "hover:bg-gray-100",
                    ].join(" ")}
                    title={r.type}
                  >
                    {r.type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mt-2">
            <LivePreviewOrEmpty payload={payloadOverride} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Live Preview ----------------------------- */
function LivePreviewOrEmpty({ payload }: { payload?: DigitalRxFormState }) {
  if (!payload) {
    return (
      <div className="ui-card p-4 text-sm text-gray-700 min-h-[320px]">
        <div className="text-gray-400">(Blank preview — select a date tab.)</div>
      </div>
    );
  }

  const { vitals = {}, clinical = {}, prescription = [], plan = {} } = payload;

  const hasVitals =
    nonEmpty(vitals.temperature) ||
    nonEmpty(vitals.bp) ||
    (nonEmpty(vitals.bpSys) && nonEmpty(vitals.bpDia)) ||
    nonEmpty(vitals.spo2) ||
    nonEmpty(vitals.weight) ||
    nonEmpty(vitals.height) ||
    nonEmpty(vitals.bmi) ||
    nonEmpty(vitals.lmpDate) ||
    nonEmpty(vitals.vitalsNotes) ||
    nonEmpty(vitals.bodyMeasurement?.waist) ||
    nonEmpty(vitals.bodyMeasurement?.hip) ||
    nonEmpty(vitals.bodyMeasurement?.neck) ||
    nonEmpty(vitals.bodyMeasurement?.chest) ||
    nonEmpty(vitals.womensHealth?.lmpDate) ||
    nonEmpty(vitals.womensHealth?.cycleLengthDays) ||
    nonEmpty(vitals.womensHealth?.cycleRegularity) ||
    nonEmpty(vitals.womensHealth?.gravidity) ||
    nonEmpty(vitals.womensHealth?.parity) ||
    nonEmpty(vitals.womensHealth?.abortions) ||
    anyRowHas(vitals.physicalActivity?.logs, ["activity", "durationMin", "intensity", "frequencyPerWeek"]) ||
    nonEmpty(vitals.GeneralAssessment?.painScore) ||
    nonEmpty(vitals.GeneralAssessment?.temperatureSite) ||
    nonEmpty(vitals.GeneralAssessment?.posture) ||
    nonEmpty(vitals.GeneralAssessment?.edema) ||
    nonEmpty(vitals.GeneralAssessment?.pallor);

  const hasClinical =
    nonEmpty(clinical.chiefComplaints) ||
    nonEmpty(clinical.pastHistory) ||
    nonEmpty(clinical.familyHistory) ||
    nonEmpty(clinical.allergy) ||
    anyRowHas(clinical.currentMedications, ["medicine", "dosage", "since"]) ||
    anyRowHas(clinical.familyHistoryRows, ["relation", "ailment"]) ||
    anyRowHas(clinical.proceduresDone, ["name", "date"]) ||
    anyRowHas(clinical.investigationsDone, ["name", "date"]);

  const rxRows = compactRows(prescription, ["medicine", "frequency", "dosage", "duration", "instruction"]);
  const hasRx = rxRows.length > 0;

  const hasPlan =
    nonEmpty(plan.investigations) ||
    nonEmpty(plan.investigationInstructions) ||
    nonEmpty(plan.advice) ||
    nonEmpty(plan.doctorNote) ||
    nonEmpty(plan.followUpInstructions) ||
    nonEmpty(plan.followUpDate) ||
    nonEmpty(plan.investigationNote) ||
    nonEmpty(plan.patientNote) ||
    (plan.attachments?.files && plan.attachments.files.length > 0) ||
    nonEmpty(plan.attachments?.note);

  const nothingYet = !hasVitals && !hasClinical && !hasRx && !hasPlan;

  if (nothingYet) {
    return (
      <div className="ui-card p-4 text-sm text-gray-700 min-h-[320px]">
        <div className="text-gray-400">(Nothing to preview for this record.)</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasVitals && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Vitals</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {nonEmpty(vitals.temperature) && <KV k="Temperature" v={`${safe(vitals.temperature)} °C`} />}
            {(nonEmpty(vitals.bp) || (nonEmpty(vitals.bpSys) && nonEmpty(vitals.bpDia))) && (
              <KV
                k="Blood Pressure"
                v={nonEmpty(vitals.bp) ? safe(vitals.bp) : `${safe(vitals.bpSys)}/${safe(vitals.bpDia)} mmHg`}
              />
            )}
            {nonEmpty(vitals.spo2) && <KV k="SpO₂" v={`${safe(vitals.spo2)} %`} />}
            {nonEmpty(vitals.weight) && <KV k="Weight" v={`${safe(vitals.weight)} kg`} />}
            {nonEmpty(vitals.height) && <KV k="Height" v={`${safe(vitals.height)} cm`} />}
            {nonEmpty(vitals.bmi) && <KV k="BMI" v={safe(vitals.bmi)} />}
            {nonEmpty(vitals.lmpDate) && <KV k="LMP" v={safe(vitals.lmpDate)} />}
          </div>

          {(nonEmpty(vitals.bodyMeasurement?.waist) ||
            nonEmpty(vitals.bodyMeasurement?.hip) ||
            nonEmpty(vitals.bodyMeasurement?.neck) ||
            nonEmpty(vitals.bodyMeasurement?.chest)) && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2">Body Measurements</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {nonEmpty(vitals.bodyMeasurement?.waist) && <KV k="Waist" v={`${safe(vitals.bodyMeasurement?.waist)} cm`} />}
                {nonEmpty(vitals.bodyMeasurement?.hip) && <KV k="Hip" v={`${safe(vitals.bodyMeasurement?.hip)} cm`} />}
                {nonEmpty(vitals.bodyMeasurement?.neck) && <KV k="Neck" v={`${safe(vitals.bodyMeasurement?.neck)} cm`} />}
                {nonEmpty(vitals.bodyMeasurement?.chest) && <KV k="Chest" v={`${safe(vitals.bodyMeasurement?.chest)} cm`} />}
              </div>
            </div>
          )}

          {(nonEmpty(vitals.womensHealth?.lmpDate) ||
            nonEmpty(vitals.womensHealth?.cycleLengthDays) ||
            nonEmpty(vitals.womensHealth?.cycleRegularity) ||
            nonEmpty(vitals.womensHealth?.gravidity) ||
            nonEmpty(vitals.womensHealth?.parity) ||
            nonEmpty(vitals.womensHealth?.abortions)) && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2">Women’s Health</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {nonEmpty(vitals.womensHealth?.lmpDate) && <KV k="LMP" v={safe(vitals.womensHealth?.lmpDate)} />}
                {nonEmpty(vitals.womensHealth?.cycleLengthDays) && <KV k="Cycle (days)" v={safe(vitals.womensHealth?.cycleLengthDays)} />}
                {nonEmpty(vitals.womensHealth?.cycleRegularity) && <KV k="Regularity" v={safe(vitals.womensHealth?.cycleRegularity)} />}
                {nonEmpty(vitals.womensHealth?.gravidity) && <KV k="Gravidity" v={safe(vitals.womensHealth?.gravidity)} />}
                {nonEmpty(vitals.womensHealth?.parity) && <KV k="Parity" v={safe(vitals.womensHealth?.parity)} />}
                {nonEmpty(vitals.womensHealth?.abortions) && <KV k="Abortions" v={safe(vitals.womensHealth?.abortions)} />}
              </div>
            </div>
          )}

          {anyRowHas(vitals.physicalActivity?.logs, ["activity", "durationMin", "intensity", "frequencyPerWeek"]) && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2">Physical Activity</h4>
              <ul className="list-disc ml-5 space-y-1 text-sm">
                {compactRows(vitals.physicalActivity?.logs, ["activity", "durationMin", "intensity", "frequencyPerWeek"]).map((r, i) => (
                  <li key={i}>
                    {[r.activity, r.durationMin && `${r.durationMin} min`, r.intensity, r.frequencyPerWeek && `${r.frequencyPerWeek}/wk`]
                      .filter(Boolean)
                      .join(" • ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(nonEmpty(vitals.GeneralAssessment?.painScore) ||
            nonEmpty(vitals.GeneralAssessment?.temperatureSite) ||
            nonEmpty(vitals.GeneralAssessment?.posture) ||
            nonEmpty(vitals.GeneralAssessment?.edema) ||
            nonEmpty(vitals.GeneralAssessment?.pallor)) && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2">General Assessment</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {nonEmpty(vitals.GeneralAssessment?.painScore) && <KV k="Pain score" v={safe(vitals.GeneralAssessment?.painScore)} />}
                {nonEmpty(vitals.GeneralAssessment?.temperatureSite) && <KV k="Temp site" v={safe(vitals.GeneralAssessment?.temperatureSite)} />}
                {nonEmpty(vitals.GeneralAssessment?.posture) && <KV k="Posture" v={safe(vitals.GeneralAssessment?.posture)} />}
                {nonEmpty(vitals.GeneralAssessment?.edema) && <KV k="Edema" v={safe(vitals.GeneralAssessment?.edema)} />}
                {nonEmpty(vitals.GeneralAssessment?.pallor) && <KV k="Pallor" v={safe(vitals.GeneralAssessment?.pallor)} />}
              </div>
            </div>
          )}

          {nonEmpty(vitals.vitalsNotes) && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-600 mb-1">Notes</h4>
              <p className="text-sm">{safe(vitals.vitalsNotes)}</p>
            </div>
          )}
        </section>
      )}

      {hasClinical && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Clinical Details</h3>
          <div className="space-y-3 text-sm">
            {nonEmpty(clinical.chiefComplaints) && <Block k="Chief complaints" v={safe(clinical.chiefComplaints)} />}
            {nonEmpty(clinical.pastHistory) && <Block k="Past history" v={safe(clinical.pastHistory)} />}
            {nonEmpty(clinical.familyHistory) && <Block k="Family history" v={safe(clinical.familyHistory)} />}
            {nonEmpty(clinical.allergy) && <Block k="Allergy" v={safe(clinical.allergy)} />}

            {anyRowHas(clinical.currentMedications, ["medicine", "dosage", "since"]) && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Current Medications</h4>
                <ul className="list-disc ml-5 space-y-1">
                  {compactRows(clinical.currentMedications, ["medicine", "dosage", "since"]).map((r, i) => (
                    <li key={i} className="text-sm">
                      {[r.medicine, r.dosage, r.since && `since ${r.since}`].filter(Boolean).join(" • ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {anyRowHas(clinical.familyHistoryRows, ["relation", "ailment"]) && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Family History (rows)</h4>
                <ul className="list-disc ml-5 space-y-1">
                  {compactRows(clinical.familyHistoryRows, ["relation", "ailment"]).map((r, i) => (
                    <li key={i} className="text-sm">
                      {[r.relation, r.ailment].filter(Boolean).join(" — ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {anyRowHas(clinical.proceduresDone, ["name", "date"]) && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Procedures Done</h4>
                <ul className="list-disc ml-5 space-y-1">
                  {compactRows(clinical.proceduresDone, ["name", "date"]).map((r, i) => (
                    <li key={i} className="text-sm">
                      {[r.name, r.date].filter(Boolean).join(" — ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {anyRowHas(clinical.investigationsDone, ["name", "date"]) && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Investigations Done</h4>
                <ul className="list-disc ml-5 space-y-1">
                  {compactRows(clinical.investigationsDone, ["name", "date"]).map((r, i) => (
                    <li key={i} className="text-sm">
                      {[r.name, r.date].filter(Boolean).join(" — ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {hasRx && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Prescription</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-600">
                  <th className="py-1 pr-3">Medicine</th>
                  <th className="py-1 pr-3">Dosage</th>
                  <th className="py-1 pr-3">Frequency</th>
                  <th className="py-1 pr-3">Duration</th>
                  <th className="py-1 pr-3">Instruction</th>
                </tr>
              </thead>
              <tbody>
                {rxRows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{safe(r.medicine)}</td>
                    <td className="py-2 pr-3">{safe(r.dosage)}</td>
                    <td className="py-2 pr-3">{safe(r.frequency)}</td>
                    <td className="py-2 pr-3">{safe(r.duration)}</td>
                    <td className="py-2 pr-3">{safe(r.instruction)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hasPlan && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Plan / Advice</h3>
          <div className="space-y-3 text-sm">
            {nonEmpty(plan.investigations) && <Block k="Investigations" v={safe(plan.investigations)} />}
            {nonEmpty(plan.investigationInstructions) && (
              <Block k="Investigation Instructions" v={safe(plan.investigationInstructions)} />
            )}
            {nonEmpty(plan.advice) && <Block k="Advice" v={safe(plan.advice)} />}
            {nonEmpty(plan.doctorNote) && <Block k="Doctor’s Note" v={safe(plan.doctorNote)} />}
            {nonEmpty(plan.followUpInstructions) && <Block k="Follow-up Instructions" v={safe(plan.followUpInstructions)} />}
            {nonEmpty(plan.followUpDate) && <KV k="Follow-up Date" v={safe(plan.followUpDate)} />}
            {nonEmpty(plan.investigationNote) && <Block k="Investigation Note" v={safe(plan.investigationNote)} />}
            {nonEmpty(plan.patientNote) && <Block k="Patient Note" v={safe(plan.patientNote)} />}

            {(plan.attachments?.files?.length ?? 0) > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Attachments</h4>
                <ul className="list-disc ml-5 space-y-1">
                  {(plan.attachments?.files ?? []).map((f, i) => <li key={i}>{(f as any)?.name ?? "File"}</li>)}
                </ul>
              </div>
            )}
            {nonEmpty(plan.attachments?.note) && <Block k="Attachment Note" v={safe(plan.attachments?.note)} />}
          </div>
        </section>
      )}
    </div>
  );
}

/* --------------------------- Tiny preview cells ------------------------- */
function KV({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500">{k}:</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
function Block({ k, v }: { k: string; v?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{k}</div>
      <div className="whitespace-pre-wrap">{v}</div>
    </div>
  );
}

/* --------------------------------- Icons / Buttons --------------------------------- */
function SummaryIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
const ICON_ACCENT_DEFAULT =
  "border-gray-300 hover:bg-gray-50 text-gray-700 focus-visible:ring-gray-400";
function TinyIcon({
  img,
  label,
  onClick,
  disabled,
  children,
}: {
  img?: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={[
        "group relative grid place-items-center",
        "w-9 h-9 rounded-xl border-1 bg-white shadow-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled ? "opacity-50 cursor-not-allowed" : ICON_ACCENT_DEFAULT,
      ].join(" ")}
    >
      {img ? (
        <Image src={img} alt={label} width={18} height={18} className="pointer-events-none" />
      ) : (
        children
      )}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </button>
  );
}
