"use client";

/**
 * ARAN • Doctor → Consultations Page
 * ------------------------------------------------------------
 * What's included:
 * - Hydration-safe date/time (fixed 'en-GB' locale, client-only "now").
 * - Deterministic uid() (no Math.random/Date.now during SSR).
 * - Consultation: 4 sections (Vitals, Clinical details, Prescription, Investigations & advice).
 * - Expand/Collapse toggle in consultation header:
 *    Expand → collapse sidebar + show OPD Queue (left) and PDF Preview (right)
 *    Collapse → restore sidebar + hide both side panels
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ----------------------------- Types & Constants ----------------------------- */

type TopTabKey =
  | "consultation"
  | "labRequest"
  | "immunizationCard"
  | "dischargeSummary"
  | "document"
  | "consentRequest";

const TOP_TABS: { key: TopTabKey; label: string }[] = [
  { key: "consultation", label: "Consultation" },
  { key: "labRequest", label: "Lab Request Form" },
  { key: "immunizationCard", label: "Immunization Card" },
  { key: "dischargeSummary", label: "Discharge Summary" },
  { key: "document", label: "Document" },
  { key: "consentRequest", label: "Consent Request" },
];

type PatientInfo = {
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other" | "";
  contact: string;
  abhaAddress: string;
  abhaNumber: string;
};

type LabReq = {
  id: string;
  testName: string;
  priority: "Routine" | "Urgent" | "STAT";
  specimen: string;
  fasting: boolean;
  notes: string;
};

type PrevRecord = {
  id: string;
  dateISO: string;
  kind: "OPConsult" | "Prescription" | "Immunization" | "Lab" | "Discharge";
  title: string;
  snippet: string;
};

type QueueItem = {
  id: string;
  ticket: string;
  name: string;
  age: string;
  gender: string;
  reason: string;
  time: string;
};

/* ----------------------------- Deterministic UID ----------------------------- */

let __uid = 0;
function uid() {
  __uid += 1;
  return `id_${__uid}`;
}

/* ----------------------------- Date/Time Helpers ----------------------------- */

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});
const DATETIME_FMT = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
function formatDate(iso: string) {
  try {
    return DATE_FMT.format(new Date(iso));
  } catch {
    return iso;
  }
}
function formatDateTime(iso: string) {
  try {
    return DATETIME_FMT.format(new Date(iso));
  } catch {
    return iso;
  }
}
function isoMinusDays(days: number, timeHHmm: string = "09:00") {
  const [hh, mm] = timeHHmm.split(":");
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(Number(hh), Number(mm), 0, 0);
  return d.toISOString();
}

/* ----------------------------- Page Component ------------------------------- */

export default function DoctorConsultationsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Patient (header uses frozen values)
  const [patient] = useState<PatientInfo>({
    name: "Ms Shampa Goswami",
    age: "52 yrs",
    gender: "Female",
    contact: "",
    abhaAddress: "shampa.go@sbx",
    abhaNumber: "91-5510-2061-4469",
  });

  // Appointment date/time — set on client after mount to avoid SSR mismatch
  const [apptDate, setApptDate] = useState<string>("");
  const [apptTime, setApptTime] = useState<string>("");
  useEffect(() => {
    const now = new Date();
    const iso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    setApptDate(iso);
    setApptTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  }, []);

  // Tabs
  const [active, setActive] = useState<TopTabKey>("consultation");

  // -------- Expand/Collapse for consultation layout (persist to session) ------
  const [expandedView, setExpandedView] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("aran:consult:expanded") === "1";
  });
  const toggleExpand = () => {
    const next = !expandedView;
    setExpandedView(next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("aran:consult:expanded", next ? "1" : "0");
    }
  };
  // Reflect into sidebar (collapse when expanded)
  useEffect(() => {
    if (!mounted) return;
    const collapse = active === "consultation" && expandedView ? "1" : "0";
    localStorage.setItem("aran:sidebarCollapsed", collapse);
    window.dispatchEvent(new Event("aran:sidebar"));
    return () => {
      localStorage.setItem("aran:sidebarCollapsed", "0");
      window.dispatchEvent(new Event("aran:sidebar"));
    };
  }, [expandedView, active, mounted]);

  /* ---------------- Consultation pane state (4 sections) ---------------- */

  /** Vitals */
  const [vTemp, setVTemp] = useState("");
  const [vBpSys, setVBpSys] = useState("");
  const [vBpDia, setVBpDia] = useState("");
  const [vHeightCm, setVHeightCm] = useState("");
  const [vWeightKg, setVWeightKg] = useState("");
  const bmi = useMemo(() => {
    const h = Number(vHeightCm) / 100;
    const w = Number(vWeightKg);
    return h > 0 && w > 0 ? (w / (h * h)).toFixed(1) : "";
  }, [vHeightCm, vWeightKg]);

  /** Clinical details */
  const [cSymptoms, setCSymptoms] = useState("");
  const [cMedHistory, setCMedHistory] = useState("");
  const [cFamHistory, setCFamHistory] = useState("");
  const [cAllergy, setCAllergy] = useState("");

  /** Prescription (tabular rows) */
  type RxRow = {
    id: string;
    medicine: string;
    frequency: string;
    timings: string;
    duration: string;
    instruction: string;
    dosage: string;
  };
  const rxId = useRef(1);
  const [rxRows, setRxRows] = useState<RxRow[]>([
    { id: "rx_1", medicine: "", frequency: "", timings: "", duration: "", instruction: "", dosage: "" },
  ]);
  function addRxRow() {
    rxId.current += 1;
    setRxRows((rows) => [
      ...rows,
      { id: `rx_${rxId.current}`, medicine: "", frequency: "", timings: "", duration: "", instruction: "", dosage: "" },
    ]);
  }
  function updateRxRow(id: string, patch: Partial<RxRow>) {
    setRxRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRxRow(id: string) {
    setRxRows((rows) => (rows.length === 1 ? rows : rows.filter((r) => r.id !== id)));
  }

  /** Investigations & advice */
  const [iaInvestigations, setIaInvestigations] = useState("");
  const [iaAdvice, setIaAdvice] = useState("");
  const [iaNotes, setIaNotes] = useState("");
  const [iaFollowUp, setIaFollowUp] = useState("");

  /* ---------------- Other tabs / records (unchanged) ---------------- */

  const [immVaccine, setImmVaccine] = useState("");
  const [immBatch, setImmBatch] = useState("");
  const [immManufacturer, setImmManufacturer] = useState("");
  const [immDoseNum, setImmDoseNum] = useState("");
  const [immDate, setImmDate] = useState("");
  const [immNextDue, setImmNextDue] = useState("");
  const [immSite, setImmSite] = useState("");
  const [immRoute, setImmRoute] = useState("IM");

  const [labReqs, setLabReqs] = useState<LabReq[]>([
    { id: uid(), testName: "", priority: "Routine", specimen: "", fasting: false, notes: "" },
  ]);

  const [dsAdmissionDate, setDsAdmissionDate] = useState("");
  const [dsDischargeDate, setDsDischargeDate] = useState("");
  const [dsPrimaryDx, setDsPrimaryDx] = useState("");
  const [dsSecondaryDx, setDsSecondaryDx] = useState("");
  const [dsProcedures, setDsProcedures] = useState("");
  const [dsHospitalCourse, setDsHospitalCourse] = useState("");
  const [dsMedications, setDsMedications] = useState("");
  const [dsAdvice, setDsAdvice] = useState("");
  const [dsFollowUp, setDsFollowUp] = useState("");

  const [docType, setDocType] = useState("");
  const [docDesc, setDocDesc] = useState("");
  const [docFiles, setDocFiles] = useState<string[]>([]);

  const [consentType, setConsentType] = useState("Data Sharing");
  const [consentPurpose, setConsentPurpose] = useState("");
  const [consentScope, setConsentScope] = useState("OPD Visit");
  const [consentFrom, setConsentFrom] = useState("");
  const [consentTo, setConsentTo] = useState("");
  const [consentChannel, setConsentChannel] = useState<"SMS" | "Email">("SMS");
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    setConsentFrom(start);
    setConsentTo(start);
  }, []);

  const prevRecords = useMemo<PrevRecord[]>(
    () =>
      [
        {
          id: uid(),
          dateISO: isoMinusDays(0, "10:15"),
          kind: "OPConsult" as const,
          title: "OPD • Fever & Cough",
          snippet: "Dx: Viral URTI; Plan: antipyretics, fluids; Advice: rest",
        },
        {
          id: uid(),
          dateISO: isoMinusDays(7, "11:40"),
          kind: "Lab" as const,
          title: "CBC Panel",
          snippet: "Hb 13.4, TLC 7.2, Platelets 2.1L — within normal limits",
        },
        {
          id: uid(),
          dateISO: isoMinusDays(15, "09:05"),
          kind: "Prescription" as const,
          title: "Rx Update",
          snippet: "Paracetamol 500 mg 1-0-1 x5 days; Steam inhalation",
        },
        {
          id: uid(),
          dateISO: isoMinusDays(30, "16:20"),
          kind: "Immunization" as const,
          title: "Tdap Booster",
          snippet: "Administered IM, left deltoid; Next due in 10 years",
        },
        {
          id: uid(),
          dateISO: isoMinusDays(45, "14:00"),
          kind: "Discharge" as const,
          title: "Daycare • Observation",
          snippet: "Stable at discharge; follow-up after 2 weeks",
        },
      ].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)),
    []
  );
  const [prevOpen, setPrevOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpanded = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  // OPD queue (example data)
  const queue: QueueItem[] = useMemo(
    () => [
      { id: uid(), ticket: "Q-021", name: "Rahul Sharma", age: "34", gender: "M", reason: "Back pain", time: "18:05" },
      { id: uid(), ticket: "Q-022", name: "Priya Singh", age: "28", gender: "F", reason: "Fever", time: "18:12" },
      { id: uid(), ticket: "Q-023", name: "Arjun Patel", age: "41", gender: "M", reason: "Cough", time: "18:20" },
      { id: uid(), ticket: "Q-024", name: "Neha Gupta", age: "36", gender: "F", reason: "Follow-up", time: "18:28" },
    ],
    []
  );

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Shortcuts (client-only)
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveDraft();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);

  // Actions
  const validate = useCallback(() => {
    if (!patient.name.trim()) {
      setToast({ type: "error", message: "Please select a patient before proceeding." });
      return false;
    }
    if (active === "labRequest" && labReqs.some((r) => !r.testName.trim())) {
      setToast({ type: "error", message: "Please add at least one Lab Test name." });
      return false;
    }
    if (active === "immunizationCard" && !immVaccine.trim()) {
      setToast({ type: "error", message: "Vaccine name is required for Immunization Card." });
      return false;
    }
    if (active === "dischargeSummary" && !dsPrimaryDx.trim()) {
      setToast({ type: "error", message: "Primary Diagnosis is required for Discharge Summary." });
      return false;
    }
    if (active === "document" && docFiles.length === 0 && !docType.trim() && !docDesc.trim()) {
      setToast({ type: "error", message: "Please attach a document or provide its type/description." });
      return false;
    }
    if (active === "consentRequest" && (!consentPurpose.trim() || !patient.abhaAddress.trim())) {
      setToast({ type: "error", message: "Purpose and patient's ABHA address are required for consent." });
      return false;
    }
    return true;
  }, [
    active,
    patient.name,
    patient.abhaAddress,
    labReqs,
    immVaccine,
    dsPrimaryDx,
    docFiles.length,
    docType,
    docDesc,
    consentPurpose,
  ]);

  const handleSaveDraft = useCallback(() => setToast({ type: "info", message: `Draft saved for ${labelFor(active)}.` }), [active]);
  const handleValidate = useCallback(() => { if (!validate()) return; setToast({ type: "success", message: `Validation passed for ${labelFor(active)}.` }); }, [validate, active]);
  const handleSubmit = useCallback(() => { if (!validate()) return; setToast({ type: "success", message: `${labelFor(active)} submitted successfully.` }); }, [validate, active]);
  const handleGenerateSummary = useCallback(() => setToast({ type: "info", message: "Generating consultation summary…" }), []);

  // PDF preview text (simple live preview)
  const pdfPreviewText = useMemo(() => {
    if (active !== "consultation") return "—";
    const rxLines = rxRows
      .filter((r) => r.medicine.trim())
      .map(
        (r, i) =>
          `${i + 1}. ${r.medicine} • ${r.dosage} • ${r.frequency} • ${r.timings} • ${r.duration} • ${r.instruction}`
      );
    return [
      "ARAN • OP Consultation Note",
      "----------------------------------------",
      `Patient: ${patient.name} (${patient.age}, ${patient.gender})`,
      `ABHA: ${patient.abhaNumber} | ${patient.abhaAddress}`,
      `Date: ${apptDate ? formatDate(apptDate) : "—"}  Time: ${apptTime || "—"}`,
      "",
      "Vitals:",
      `Temp: ${vTemp || "—"} °C | BP: ${vBpSys || "—"}/${vBpDia || "—"} mmHg | Ht: ${vHeightCm || "—"} cm | Wt: ${vWeightKg || "—"} kg | BMI: ${bmi || "—"}`,
      "",
      "Clinical:",
      `Symptoms: ${cSymptoms || "—"}`,
      `Medical Hx: ${cMedHistory || "—"}`,
      `Family Hx: ${cFamHistory || "—"}`,
      `Allergy: ${cAllergy || "—"}`,
      "",
      "Prescription:",
      ...(rxLines.length ? rxLines : ["—"]),
      "",
      "Investigations & Advice:",
      `Investigations: ${iaInvestigations || "—"}`,
      `Advice: ${iaAdvice || "—"}`,
      `Notes: ${iaNotes || "—"}`,
      `Follow-up: ${iaFollowUp || "—"}`,
    ].join("\n");
  }, [
    active,
    patient.name,
    patient.age,
    patient.gender,
    patient.abhaNumber,
    patient.abhaAddress,
    apptDate,
    apptTime,
    vTemp,
    vBpSys,
    vBpDia,
    vHeightCm,
    vWeightKg,
    bmi,
    cSymptoms,
    cMedHistory,
    cFamHistory,
    cAllergy,
    rxRows,
    iaInvestigations,
    iaAdvice,
    iaNotes,
    iaFollowUp,
  ]);

  /* --------------------------------- Render --------------------------------- */

  return (
    <div className="space-y-4">
      {/* Patient Context Bar */}
      <div className="ui-card p-3">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_170px_200px] items-center gap-3">
          {/* Left: Patient Details */}
          <div className="order-1">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--secondary)", color: "var(--on-secondary)" }} aria-label="Patient" title="Patient">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <circle cx="12" cy="8" r="3" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Info label="Patient Name" value={"Ms Shampa Goswami"} />
                  <Info label="Age" value={"52 yrs"} />
                  <Info label="Gender" value={"Female"} />
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Info label="ABHA Number" value={"91-5510-2061-4469"} />
                  <Info label="ABHA Address" value={"shampa.go@sbx"} />
                  <Info label="Last Consultation" value={"New Patient"} />
                </div>
              </div>
            </div>
          </div>

          {/* Center: Appointment Date & Time */}
          <div className="order-2 text-center">
            <div className="space-y-2 text-left md:text-right">
              <div>
                <div className="text-[11px] text-gray-600 mb-1">Appointment Date</div>
                <div className="text-sm font-medium">{apptDate ? formatDate(apptDate) : "—"}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-600 mb-1">Appointment Time</div>
                <div className="text-sm font-medium">{apptTime || "—"}</div>
              </div>
            </div>
          </div>

          {/* Right: Generate Summary */}
          <div className="order-3 text-right">
            <button className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-2 mb-2" onClick={handleGenerateSummary}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                <path d="M14 3v6h6" />
              </svg>
              Generate Summary
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ui-card p-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {TOP_TABS.map((t) => {
            const activeTab = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={["px-3 py-1.5 rounded-md text-sm whitespace-nowrap", activeTab ? "bg-gray-900 text-white" : "hover:bg-gray-100"].join(" ")}
                aria-pressed={activeTab}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Work Area */}
      {active === "consultation" ? (
        <div className="flex gap-3 items-start">
          {/* LEFT: OPD Queue (expanded only) */}
          {expandedView && (
            <aside className="w-[260px] shrink-0">
              <div className="ui-card p-3 sticky top-3 max-h-[calc(100vh-140px)] overflow-auto">
                <div className="text-sm font-semibold mb-2">OPD Queue</div>
                <ul className="divide-y">
                  {queue.map((q) => (
                    <li key={q.id} className="py-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium">{q.ticket}</div>
                        <div className="text-[11px] text-gray-500">{q.time}</div>
                      </div>
                      <div className="text-sm">{q.name}</div>
                      <div className="text-[11px] text-gray-600">
                        {q.age}y • {q.gender} • {q.reason}
                      </div>
                      <div className="mt-1">
                        <button className="btn-outline text-xs">Open</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* CENTER: Consultation Editor */}
          <section className="flex-1">
            <div className="ui-card p-4">
              {/* Header with Expand/Collapse toggle (top-right) */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Consultation</div>
                  <div className="text-[11px] text-gray-500">
                    Vitals, clinical details, prescription, investigations & advice
                  </div>
                </div>

                <button
                  onClick={toggleExpand}
                  className="inline-flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs hover:bg-gray-50"
                  title={expandedView ? "Collapse view" : "Expand view"}
                  aria-pressed={expandedView}
                  style={{ borderColor: "var(--secondary)", color: "var(--secondary)" }}
                >
                  {expandedView ? "Collapse" : "Expand"}
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                    {expandedView ? (
                      <path d="M9 9H5V5M15 15h4v4M15 9h4V5M9 15H5v4" />
                    ) : (
                      <path d="M8 3h4v2H6v6H4V3h4zm12 10h-2v6h-6v2h8v-8zM20 3v8h-2V5h-6V3h8zM10 15v6H4v-2h6v-4h2z" />
                    )}
                  </svg>
                </button>
              </div>

              {/* --- Section: Vitals --- */}
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Thermometer icon */}
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#0ea5e9" strokeWidth={1.8}>
                      <path d="M10 14a4 4 0 1 0 4 0V5a2 2 0 1 0-4 0v9z" />
                      <circle cx="12" cy="18" r="2" />
                    </svg>
                    <div className="text-sm font-semibold">Vitals</div>
                  </div>
                  <div className="text-xs text-gray-600 cursor-default">▾ show more</div>
                </div>

                <div className="grid md:grid-cols-5 gap-3">
                  <Field label="Temperature (°C)">
                    <input className="ui-input" value={vTemp} onChange={(e) => setVTemp(e.target.value)} placeholder="e.g., 37.0" />
                  </Field>
                  <Field label="BP (mmHg)">
                    <div className="flex items-center gap-2">
                      <input className="ui-input" value={vBpSys} onChange={(e) => setVBpSys(e.target.value)} placeholder="120" />
                      <span className="text-xs text-gray-500">/</span>
                      <input className="ui-input" value={vBpDia} onChange={(e) => setVBpDia(e.target.value)} placeholder="80" />
                    </div>
                  </Field>
                  <Field label="Height (cm)">
                    <input className="ui-input" value={vHeightCm} onChange={(e) => setVHeightCm(e.target.value)} placeholder="e.g., 165" />
                  </Field>
                  <Field label="Weight (kg)">
                    <input className="ui-input" value={vWeightKg} onChange={(e) => setVWeightKg(e.target.value)} placeholder="e.g., 62" />
                  </Field>
                  <Field label="BMI">
                    <input className="ui-input" value={bmi} readOnly placeholder="—" />
                  </Field>
                </div>
              </div>

              {/* --- Section: Clinical details --- */}
              <div className="rounded-lg border p-3 space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Stethoscope-ish icon */}
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#22c55e" strokeWidth={1.8}>
                      <path d="M6 3v6a6 6 0 1 0 12 0V3M6 3h3M18 3h-3M18 15a3 3 0 1 0 3 3v-3a3 3 0 0 0-3 3" />
                    </svg>
                    <div className="text-sm font-semibold">Clinical details</div>
                  </div>
                  <div className="text-xs text-gray-600 cursor-default">▾ show more</div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Symptoms">
                    <Textarea value={cSymptoms} onChange={(e) => setCSymptoms(e.target.value)} placeholder="e.g., fever, cough, fatigue" />
                  </Field>
                  <Field label="Medical History">
                    <Textarea value={cMedHistory} onChange={(e) => setCMedHistory(e.target.value)} placeholder="Past illnesses, surgeries, meds" />
                  </Field>
                  <Field label="Family History">
                    <Textarea value={cFamHistory} onChange={(e) => setCFamHistory(e.target.value)} placeholder="Hereditary conditions, etc." />
                  </Field>
                  <Field label="Allergy">
                    <Textarea value={cAllergy} onChange={(e) => setCAllergy(e.target.value)} placeholder="Drug/food/environmental allergies" />
                  </Field>
                </div>
              </div>

              {/* --- Section: Prescription --- */}
              <div className="rounded-lg border p-3 space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Pill icon */}
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#ef4444" strokeWidth={1.8}>
                      <path d="M7 7a5 5 0 1 1 7 7l-4 4a5 5 0 1 1-7-7l4-4z" />
                      <path d="M14 10l-4 4" />
                    </svg>
                    <div className="text-sm font-semibold">Prescription</div>
                  </div>
                  <div className="text-xs text-gray-600 cursor-default">▾ show more</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500">
                      <tr className="text-left">
                        <th className="py-2 pr-2">Medicine</th>
                        <th className="py-2 pr-2">Frequency</th>
                        <th className="py-2 pr-2">Timings</th>
                        <th className="py-2 pr-2">Duration</th>
                        <th className="py-2 pr-2">Instruction</th>
                        <th className="py-2 pr-2">Dosage</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rxRows.map((r) => (
                        <tr key={r.id}>
                          <td className="py-2 pr-2">
                            <input className="ui-input" value={r.medicine} onChange={(e) => updateRxRow(r.id, { medicine: e.target.value })} placeholder="e.g., Amoxicillin" />
                          </td>
                          <td className="py-2 pr-2">
                            <input className="ui-input" value={r.frequency} onChange={(e) => updateRxRow(r.id, { frequency: e.target.value })} placeholder="e.g., 1-0-1" />
                          </td>
                          <td className="py-2 pr-2">
                            <input className="ui-input" value={r.timings} onChange={(e) => updateRxRow(r.id, { timings: e.target.value })} placeholder="e.g., after meals" />
                          </td>
                          <td className="py-2 pr-2">
                            <input className="ui-input" value={r.duration} onChange={(e) => updateRxRow(r.id, { duration: e.target.value })} placeholder="e.g., 5 days" />
                          </td>
                          <td className="py-2 pr-2">
                            <input className="ui-input" value={r.instruction} onChange={(e) => updateRxRow(r.id, { instruction: e.target.value })} placeholder="e.g., avoid dairy" />
                          </td>
                          <td className="py-2 pr-2">
                            <input className="ui-input" value={r.dosage} onChange={(e) => updateRxRow(r.id, { dosage: e.target.value })} placeholder="e.g., 500 mg" />
                          </td>
                          <td className="py-2">
                            <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => removeRxRow(r.id)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <button className="btn-primary" onClick={addRxRow}>+ Add medicine</button>
                </div>
              </div>

              {/* --- Section: Investigations & advice --- */}
              <div className="rounded-lg border p-3 space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Clipboard/check icon */}
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#a855f7" strokeWidth={1.8}>
                      <path d="M9 3h6l1 2h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2l1-2z" />
                      <path d="M9 14l2 2 4-4" />
                    </svg>
                    <div className="text-sm font-semibold">Investigations & advice</div>
                  </div>
                  <div className="text-xs text-gray-600 cursor-default">▾ show more</div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Investigations suggested">
                    <Textarea value={iaInvestigations} onChange={(e) => setIaInvestigations(e.target.value)} placeholder="e.g., CBC, LFTs, Chest X‑ray" />
                  </Field>
                  <Field label="Advice to patient">
                    <Textarea value={iaAdvice} onChange={(e) => setIaAdvice(e.target.value)} placeholder="Diet, rest, fluid intake, etc." />
                  </Field>
                  <Field label="Notes for doctor">
                    <Textarea value={iaNotes} onChange={(e) => setIaNotes(e.target.value)} placeholder="Internal notes / reminders" />
                  </Field>
                  <Field label="Follow up">
                    <Textarea value={iaFollowUp} onChange={(e) => setIaFollowUp(e.target.value)} placeholder="e.g., 1 week with reports" />
                  </Field>
                </div>
              </div>

              {/* Previous Health Records */}
              <div className="mt-4 rounded-lg border border-gray-200">
                <button type="button" className="w-full flex items-center justify-between px-3 py-2 text-sm" onClick={() => setPrevOpen((s) => !s)} aria-expanded={prevOpen}>
                  <span className="text-gray-800">Previous Health Records (latest first)</span>
                  <span style={{ color: "var(--secondary)" }}>{prevOpen ? "▾" : "▸"}</span>
                </button>

                {prevOpen && (
                  <div className="border-t border-[#f0fff6]">
                    <ul className="divide-y divide-[#f0fff6]">
                      {prevRecords.map((r) => {
                        const isOpen = !!expanded[r.id];
                        return (
                          <li key={r.id} className="py-2 px-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{r.kind} • {r.title}</div>
                                <div className="text-xs text-gray-500">{formatDateTime(r.dateISO)}</div>
                              </div>
                              <button type="button" onClick={() => toggleExpanded(r.id)} aria-expanded={isOpen} className="p-1 rounded-md shrink-0" style={{ color: "var(--secondary)" }}>
                                <span className="text-base">{isOpen ? "▾" : "▸"}</span>
                              </button>
                            </div>

                            {isOpen && (
                              <div className="mt-2 rounded-md bg-gray-50 border px-3 py-2">
                                <div className="text-sm text-gray-800">{r.snippet}</div>
                                <div className="mt-2 text-xs text-gray-600">Doctor: Dr. A • Facility: ARAN Clinic • Ref#: {r.id.toUpperCase()}</div>
                                <div className="mt-2 flex gap-2">
                                  <button className="btn-outline text-xs">Open Record</button>
                                  <button className="btn-outline text-xs">Download</button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Bar */}
            {/* <div className="sticky bottom-4 mt-4">
              <div className="ui-card p-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Patient:</span> {patient.name || "—"}
                  <span className="mx-2">•</span>
                  <span className="font-medium">Record:</span> {labelFor(active)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-outline" onClick={handleSaveDraft}>Save Draft (Ctrl+S)</button>
                  <button className="btn-outline" onClick={handleValidate}>Validate & Preview</button>
                  <button className="btn-primary" onClick={handleSubmit}>Submit & Share (Ctrl+Enter)</button>
                </div>
              </div>
            </div> */}
          </section>

          {/* RIGHT: PDF Preview (expanded only) */}
          {expandedView && (
            <aside className="w-[380px] shrink-0">
              <div className="ui-card p-3 sticky top-3 max-h-[calc(100vh-140px)] overflow-auto">
                <div className="text-sm font-semibold mb-2">PDF Preview</div>
                <div className="mx-auto bg-white shadow border rounded relative" style={{ width: 320, height: 452 }}>
                  <div className="absolute inset-0 p-3 overflow-auto">
                    <pre className="whitespace-pre-wrap text-[11px] leading-[1.15rem]">
                      {pdfPreviewText}
                    </pre>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn-outline text-xs">Download PDF</button>
                  <button className="btn-outline text-xs">Open in New Tab</button>
                </div>
                <div className="mt-2 text-[11px] text-gray-500">Live preview updates as you type.</div>
              </div>
            </aside>
          )}
        </div>
      ) : (
        /* Other tabs (single center panel) */
        <section className="space-y-4">
          {/* Lab Request Form */}
          {active === "labRequest" && (
            <div className="ui-card p-4">
              <HeaderRow title="Lab Request Form" subtitle="Add investigations to be performed" />
              <div className="space-y-3">
                {labReqs.map((r, idx) => (
                  <div key={r.id} className="grid md:grid-cols-6 gap-3 items-start">
                    <Field label={`Test Name ${idx + 1}*`}>
                      <input className="ui-input" value={r.testName} onChange={(e) => updateLabReq(r.id, { testName: e.target.value })} placeholder="e.g., CBC" />
                    </Field>
                    <Field label="Priority">
                      <select className="ui-input" value={r.priority} onChange={(e) => updateLabReq(r.id, { priority: e.target.value as LabReq["priority"] })}>
                        <option>Routine</option>
                        <option>Urgent</option>
                        <option>STAT</option>
                      </select>
                    </Field>
                    <Field label="Specimen">
                      <input className="ui-input" value={r.specimen} onChange={(e) => updateLabReq(r.id, { specimen: e.target.value })} placeholder="e.g., EDTA blood" />
                    </Field>
                    <Field label="Fasting">
                      <div className="flex items-center h-10">
                        <input type="checkbox" className="mr-2" checked={r.fasting} onChange={(e) => updateLabReq(r.id, { fasting: e.target.checked })} />
                        <span className="text-sm text-gray-700">Required</span>
                      </div>
                    </Field>
                    <Field label="Notes">
                      <input className="ui-input" value={r.notes} onChange={(e) => updateLabReq(r.id, { notes: e.target.value })} placeholder="Any instructions for lab" />
                    </Field>
                    <div className="flex items-end">
                      <button type="button" className="btn-outline" onClick={() => removeLabReq(r.id)}>Remove</button>
                    </div>
                  </div>
                ))}
                <div>
                  <button className="btn-primary" onClick={() => addLabReq()}>+ Add Test</button>
                </div>
              </div>
            </div>
          )}

          {/* Immunization Card */}
          {active === "immunizationCard" && (
            <div className="ui-card p-4">
              <HeaderRow title="Immunization Card" subtitle="Capture vaccine details" />
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Vaccine*"><input className="ui-input" value={immVaccine} onChange={(e) => setImmVaccine(e.target.value)} placeholder="e.g., Tdap" /></Field>
                <Field label="Batch"><input className="ui-input" value={immBatch} onChange={(e) => setImmBatch(e.target.value)} /></Field>
                <Field label="Manufacturer"><input className="ui-input" value={immManufacturer} onChange={(e) => setImmManufacturer(e.target.value)} /></Field>
                <Field label="Dose #"><input className="ui-input" value={immDoseNum} onChange={(e) => setImmDoseNum(e.target.value)} placeholder="e.g., 1" /></Field>
                <Field label="Date"><input type="date" className="ui-input" value={immDate} onChange={(e) => setImmDate(e.target.value)} /></Field>
                <Field label="Next Due"><input type="date" className="ui-input" value={immNextDue} onChange={(e) => setImmNextDue(e.target.value)} /></Field>
                <Field label="Site"><input className="ui-input" value={immSite} onChange={(e) => setImmSite(e.target.value)} placeholder="e.g., Left deltoid" /></Field>
                <Field label="Route"><input className="ui-input" value={immRoute} onChange={(e) => setImmRoute(e.target.value)} placeholder="e.g., IM" /></Field>
              </div>
            </div>
          )}

          {/* Discharge Summary */}
          {active === "dischargeSummary" && (
            <div className="ui-card p-4">
              <HeaderRow title="Discharge Summary" subtitle="Summarize inpatient care and advice" />
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Admission Date"><input type="date" className="ui-input" value={dsAdmissionDate} onChange={(e) => setDsAdmissionDate(e.target.value)} /></Field>
                <Field label="Discharge Date"><input type="date" className="ui-input" value={dsDischargeDate} onChange={(e) => setDsDischargeDate(e.target.value)} /></Field>
                <Field label="Follow-up Date"><input type="date" className="ui-input" value={dsFollowUp} onChange={(e) => setDsFollowUp(e.target.value)} /></Field>
                <Field className="md:col-span-3" label="Primary Diagnosis*"><Textarea value={dsPrimaryDx} onChange={(e) => setDsPrimaryDx(e.target.value)} placeholder="Primary Dx" /></Field>
                <Field className="md:col-span-3" label="Secondary Diagnoses"><Textarea value={dsSecondaryDx} onChange={(e) => setDsSecondaryDx(e.target.value)} placeholder="List other diagnoses" /></Field>
                <Field className="md:col-span-3" label="Procedures"><Textarea value={dsProcedures} onChange={(e) => setDsProcedures(e.target.value)} placeholder="Procedures performed" /></Field>
                <Field className="md:col-span-3" label="Hospital Course"><Textarea value={dsHospitalCourse} onChange={(e) => setDsHospitalCourse(e.target.value)} placeholder="Course in hospital" /></Field>
                <Field className="md:col-span-3" label="Medications at Discharge"><Textarea value={dsMedications} onChange={(e) => setDsMedications(e.target.value)} placeholder="Discharge meds" /></Field>
                <Field className="md:col-span-3" label="Advice & Instructions"><Textarea value={dsAdvice} onChange={(e) => setDsAdvice(e.target.value)} placeholder="Diet, activity, warnings" /></Field>
              </div>
            </div>
          )}

          {/* Document */}
          {active === "document" && (
            <div className="ui-card p-4">
              <HeaderRow title="Document" subtitle="Attach or describe a document" />
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Document Type"><input className="ui-input" value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="e.g., Referral, Report, Image" /></Field>
                <Field className="md:col-span-2" label="Description"><input className="ui-input" value={docDesc} onChange={(e) => setDocDesc(e.target.value)} placeholder="Short description" /></Field>
                <Field className="md:col-span-3" label="Attachments">
                  <input type="file" className="ui-input" multiple onChange={(e) => {
                    const list = Array.from(e.target.files || []).map((f) => f.name);
                    setDocFiles(list);
                  }} />
                </Field>
                {docFiles.length > 0 && (
                  <div className="md:col-span-3 text-sm text-gray-700">
                    <div className="mb-1 font-medium">Selected Files</div>
                    <ul className="list-disc ml-5 space-y-0.5">{docFiles.map((n) => (<li key={n}>{n}</li>))}</ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consent Request */}
          {active === "consentRequest" && (
            <div className="ui-card p-4">
              <HeaderRow title="Consent Request" subtitle="Request patient consent for data access or procedures" />
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Consent Type">
                  <select className="ui-input" value={consentType} onChange={(e) => setConsentType(e.target.value)}>
                    <option>Data Sharing</option>
                    <option>Procedure</option>
                    <option>Research</option>
                  </select>
                </Field>
                <Field label="Purpose*"><input className="ui-input" value={consentPurpose} onChange={(e) => setConsentPurpose(e.target.value)} placeholder="e.g., Review previous labs" /></Field>
                <Field label="Scope">
                  <select className="ui-input" value={consentScope} onChange={(e) => setConsentScope(e.target.value)}>
                    <option>OPD Visit</option>
                    <option>30 days</option>
                    <option>90 days</option>
                    <option>Custom</option>
                  </select>
                </Field>
                <Field label="Valid From"><input type="date" className="ui-input" value={consentFrom ? consentFrom.slice(0, 10) : ""} onChange={(e) => setConsentFrom(new Date(e.target.value).toISOString())} /></Field>
                <Field label="Valid To"><input type="date" className="ui-input" value={consentTo ? consentTo.slice(0, 10) : ""} onChange={(e) => setConsentTo(new Date(e.target.value).toISOString())} /></Field>
                <Field label="Channel">
                  <select className="ui-input" value={consentChannel} onChange={(e) => setConsentChannel(e.target.value as "SMS" | "Email")}>
                    <option>SMS</option>
                    <option>Email</option>
                  </select>
                </Field>
                <Field className="md:col-span-3" label="Patient ABHA Address"><input className="ui-input" value={patient.abhaAddress} disabled /></Field>
                <div className="md:col-span-3"><button className="btn-primary">Generate Consent Request</button></div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Sticky Action Bar (global) */}
      <div className="sticky bottom-4">
        <div className="ui-card p-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Patient:</span> {patient.name || "—"}
            <span className="mx-2">•</span>
            <span className="font-medium">Record:</span> {labelFor(active)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" onClick={handleSaveDraft}>Save Draft (Ctrl+S)</button>
            <button className="btn-outline" onClick={handleValidate}>Validate & Preview</button>
            <button className="btn-primary" onClick={handleSubmit}>Submit & Share (Ctrl+Enter)</button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} onClose={() => setToast(null)}>
          {toast.message}
        </Toast>
      )}
    </div>
  );

  /* ------------------------- Local helpers & UI atoms ------------------------ */

  function updateLabReq(id: string, patch: Partial<LabReq>) {
    setLabReqs((curr) => curr.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeLabReq(id: string) {
    setLabReqs((curr) => (curr.length === 1 ? curr : curr.filter((r) => r.id !== id)));
  }
  function addLabReq() {
    setLabReqs((curr) => [...curr, { id: uid(), testName: "", priority: "Routine", specimen: "", fasting: false, notes: "" }]);
  }
}

/* Label mapper for sticky bar */
function labelFor(key: TopTabKey) {
  switch (key) {
    case "consultation": return "Consultation";
    case "labRequest": return "Lab Request Form";
    case "immunizationCard": return "Immunization Card";
    case "dischargeSummary": return "Discharge Summary";
    case "document": return "Document";
    case "consentRequest": return "Consent Request";
  }
}

/* UI atoms */
function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-medium">{value && value.trim() ? value : "—"}</div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={["block", className].join(" ")}>
      <span className="block text-xs font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string }) {
  return (
    <textarea className="ui-input min-h-[96px]" value={value} onChange={onChange} placeholder={placeholder} />
  );
}

function HeaderRow({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="text-lg font-semibold">{title}</div>
      {subtitle && <div className="text-[11px] text-gray-500">{subtitle}</div>}
    </div>
  );
}

function Toast({ type, children, onClose }: { type: "success" | "error" | "info"; children: React.ReactNode; onClose: () => void }) {
  const color = type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#2563eb";
  useEffect(() => {
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className="rounded-lg shadow-lg border bg-white px-4 py-3 text-sm" style={{ borderColor: color }}>
        <div className="flex items-start gap-2">
          <div className="mt-[2px]" style={{ color }}>{type === "success" ? "✔" : type === "error" ? "⚠" : "ℹ"}</div>
          <div className="text-gray-800">{children}</div>
          <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700">Close</button>
        </div>
      </div>
    </div>
  );
}
