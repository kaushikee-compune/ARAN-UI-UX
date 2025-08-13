"use client";

/**
 * ARAN • Doctor → Consultations Page
 * ------------------------------------------------------------------
 * Fixes hydration by:
 *  - Using fixed 'en-GB' locale for date/time formatting.
 *  - Removing Math.random()/Date.now() from SSR path (deterministic uid()).
 *  - Setting "now" date/time on client after mount.
 *  - Only touching localStorage inside effects.
 *
 * Also includes Expand/Collapse toggle for Consultation:
 *  - Expand → collapse sidebar + show OPD Queue (left) and PDF Preview (right)
 *  - Collapse → restore sidebar + hide OPD/PDF
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
  dateISO: string; // ISO string for stable display
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
/** Server and client must generate the SAME IDs in the SAME order. */
let __uidCounter = 0;
function uid() {
  __uidCounter += 1;
  return `id_${__uidCounter}`;
}

/* ----------------------------- Date/Time Helpers ----------------------------- */
/** Use a fixed locale to avoid server/client differences. */
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
/** Build an ISO string N days back at HH:mm (24h). */
function isoMinusDays(days: number, timeHHmm: string = "09:00") {
  const [hh, mm] = timeHHmm.split(":");
  const d = new Date(Date.UTC(2025, 0, 1)); // stable anchor to avoid TZ drift in SSR
  d.setUTCFullYear(new Date().getUTCFullYear()); // keep current year but via UTC
  d.setUTCMonth(new Date().getUTCMonth());
  d.setUTCDate(new Date().getUTCDate() - days);
  d.setUTCHours(Number(hh), Number(mm), 0, 0);
  return d.toISOString();
}

/* ----------------------------- Page Component ------------------------------- */

export default function DoctorConsultationsPage() {
  /** Mount flag to render client-only dynamic values safely */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Patient (internal mirror; header shows frozen values)
  const [patient] = useState<PatientInfo>({
    name: "Ms Shampa Goswami",
    age: "52 yrs",
    gender: "Female",
    contact: "",
    abhaAddress: "shampa.go@sbx",
    abhaNumber: "91-5510-2061-4469",
  });

  // Appointment date/time (set after mount to avoid SSR/CSR mismatch)
  const [apptDate, setApptDate] = useState<string>(""); // ISO
  const [apptTimeText, setApptTimeText] = useState<string>(""); // HH:mm (client)
  useEffect(() => {
    // Client-only: "today" in local TZ
    const now = new Date();
    const iso = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    ).toISOString();
    setApptDate(iso);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setApptTimeText(`${hh}:${mm}`);
  }, []);

  // Active top tab
  const [active, setActive] = useState<TopTabKey>("consultation");

  // Expand/Collapse (persist across navigations in this tab)
  const [expandedPanels, setExpandedPanels] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("aran:consult:expanded") === "1";
  });

  // Reflect expand/collapse into the main app sidebar (client-only)
  useEffect(() => {
    if (!mounted) return;
    // Only apply for consultation tab
    const collapse = active === "consultation" && expandedPanels ? "1" : "0";
    localStorage.setItem("aran:sidebarCollapsed", collapse);
    window.dispatchEvent(new Event("aran:sidebar"));
    return () => {
      // On unmount or when leaving page, restore sidebar
      localStorage.setItem("aran:sidebarCollapsed", "0");
      window.dispatchEvent(new Event("aran:sidebar"));
    };
  }, [expandedPanels, active, mounted]);

  // ---- Consultation state ----
  const [opChiefComplaints, setOpChiefComplaints] = useState("");
  const [opExamination, setOpExamination] = useState("");
  const [opDiagnosis, setOpDiagnosis] = useState("");
  const [opPlan, setOpPlan] = useState("");
  const [opAdvice, setOpAdvice] = useState("");

  // Immunization state
  const [immVaccine, setImmVaccine] = useState("");
  const [immBatch, setImmBatch] = useState("");
  const [immManufacturer, setImmManufacturer] = useState("");
  const [immDoseNum, setImmDoseNum] = useState("");
  const [immDate, setImmDate] = useState("");
  const [immNextDue, setImmNextDue] = useState("");
  const [immSite, setImmSite] = useState("");
  const [immRoute, setImmRoute] = useState("IM");

  // Lab Request state (deterministic initial id)
  const [labReqs, setLabReqs] = useState<LabReq[]>([
    {
      id: uid(),
      testName: "",
      priority: "Routine",
      specimen: "",
      fasting: false,
      notes: "",
    },
  ]);

  // Discharge Summary state
  const [dsAdmissionDate, setDsAdmissionDate] = useState("");
  const [dsDischargeDate, setDsDischargeDate] = useState("");
  const [dsPrimaryDx, setDsPrimaryDx] = useState("");
  const [dsSecondaryDx, setDsSecondaryDx] = useState("");
  const [dsProcedures, setDsProcedures] = useState("");
  const [dsHospitalCourse, setDsHospitalCourse] = useState("");
  const [dsMedications, setDsMedications] = useState("");
  const [dsAdvice, setDsAdvice] = useState("");
  const [dsFollowUp, setDsFollowUp] = useState("");

  // Document state
  const [docType, setDocType] = useState("");
  const [docDesc, setDocDesc] = useState("");
  const [docFiles, setDocFiles] = useState<string[]>([]);

  // Consent Request state
  const [consentType, setConsentType] = useState("Data Sharing");
  const [consentPurpose, setConsentPurpose] = useState("");
  const [consentScope, setConsentScope] = useState("OPD Visit");
  const [consentFrom, setConsentFrom] = useState(""); // set on client only if needed
  const [consentTo, setConsentTo] = useState("");
  useEffect(() => {
    // Optional: initialize consent date range on client
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = start;
    setConsentFrom(start.toISOString());
    setConsentTo(end.toISOString());
  }, []);

  // Previous health records (deterministic, no random/now at render time)
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
          snippet:
            "Hb 13.4, TLC 7.2, Platelets 2.1L — within normal limits",
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

  // Collapsible state for Previous Health Records
  const [prevOpen, setPrevOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpanded = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  // OPD queue (deterministic tickets)
  const queue = useMemo<QueueItem[]>(
    () => [
      {
        id: uid(),
        ticket: "Q-021",
        name: "Rahul Sharma",
        age: "34",
        gender: "M",
        reason: "Back pain",
        time: "18:05",
      },
      {
        id: uid(),
        ticket: "Q-022",
        name: "Priya Singh",
        age: "28",
        gender: "F",
        reason: "Fever",
        time: "18:12",
      },
      {
        id: uid(),
        ticket: "Q-023",
        name: "Arjun Patel",
        age: "41",
        gender: "M",
        reason: "Cough",
        time: "18:20",
      },
      {
        id: uid(),
        ticket: "Q-024",
        name: "Neha Gupta",
        age: "36",
        gender: "F",
        reason: "Follow-up",
        time: "18:28",
      },
    ],
    []
  );

  // Toast
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

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
      setToast({
        type: "error",
        message: "Please select a patient before proceeding.",
      });
      return false;
    }
    if (active === "labRequest" && labReqs.some((r) => !r.testName.trim())) {
      setToast({
        type: "error",
        message: "Please add at least one Lab Test name.",
      });
      return false;
    }
    if (active === "immunizationCard" && !immVaccine.trim()) {
      setToast({
        type: "error",
        message: "Vaccine name is required for Immunization Card.",
      });
      return false;
    }
    if (active === "dischargeSummary" && !dsPrimaryDx.trim()) {
      setToast({
        type: "error",
        message: "Primary Diagnosis is required for Discharge Summary.",
      });
      return false;
    }
    if (
      active === "document" &&
      docFiles.length === 0 &&
      !docType.trim() &&
      !docDesc.trim()
    ) {
      setToast({
        type: "error",
        message: "Please attach a document or provide its type/description.",
      });
      return false;
    }
    if (
      active === "consentRequest" &&
      (!consentPurpose.trim() || !patient.abhaAddress.trim())
    ) {
      setToast({
        type: "error",
        message: "Purpose and patient's ABHA address are required for consent.",
      });
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

  const handleSaveDraft = useCallback(() => {
    setToast({ type: "info", message: `Draft saved for ${labelFor(active)}.` });
  }, [active]);

  const handleValidate = useCallback(() => {
    if (!validate()) return;
    setToast({
      type: "success",
      message: `Validation passed for ${labelFor(active)}.`,
    });
  }, [validate, active]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    setToast({
      type: "success",
      message: `${labelFor(active)} submitted successfully.`,
    });
  }, [validate, active]);

  const handleGenerateSummary = useCallback(() => {
    setToast({ type: "info", message: "Generating consultation summary…" });
  }, []);

  // Derived "PDF text" preview
  const pdfPreviewText = useMemo(() => {
    if (active !== "consultation") return "—";
    return [
      "ARAN • OP Consultation Note",
      "----------------------------------------",
      `Patient: ${patient.name} (${patient.age}, ${patient.gender})`,
      `ABHA: ${patient.abhaNumber} | ${patient.abhaAddress}`,
      `Date: ${apptDate ? formatDate(apptDate) : "—"}  Time: ${
        apptTimeText || "—"
      }`,
      "",
      "Chief Complaints:",
      opChiefComplaints || "—",
      "",
      "Examination:",
      opExamination || "—",
      "",
      "Diagnosis:",
      opDiagnosis || "—",
      "",
      "Plan:",
      opPlan || "—",
      "",
      "Advice / Notes:",
      opAdvice || "—",
    ].join("\n");
  }, [
    active,
    patient.name,
    patient.age,
    patient.gender,
    patient.abhaNumber,
    patient.abhaAddress,
    apptDate,
    apptTimeText,
    opChiefComplaints,
    opExamination,
    opDiagnosis,
    opPlan,
    opAdvice,
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
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--secondary)", color: "var(--on-secondary)" }}
                aria-label="Patient"
                title="Patient"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
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

          {/* Center: Appointment Date & Time (uses fixed locale; placeholders on SSR) */}
          <div className="order-2 text-center">
            <div className="space-y-2 text-left md:text-right">
              <div>
                <div className="text-[11px] text-gray-600 mb-1">Appointment Date</div>
                <div className="text-sm font-medium">
                  {apptDate ? formatDate(apptDate) : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-600 mb-1">Appointment Time</div>
                <div className="text-sm font-medium">{apptTimeText || "—"}</div>
              </div>
            </div>
          </div>

          {/* Right: Generate Summary */}
          <div className="order-3 text-right">
            <button
              className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-2 mb-2"
              onClick={handleGenerateSummary}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
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
                className={[
                  "px-3 py-1.5 rounded-md text-sm whitespace-nowrap",
                  activeTab ? "bg-gray-900 text-white" : "hover:bg-gray-100",
                ].join(" ")}
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
          {expandedPanels && (
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
              {/* Header + Expand/Collapse toggle (top-right of editor) */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Consultation</div>
                  <div className="text-[11px] text-gray-500">Findings, Diagnoses and Plan</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    {expandedPanels ? "Expanded (Queue + PDF)" : "Collapsed"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !expandedPanels;
                      setExpandedPanels(next);
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("aran:consult:expanded", next ? "1" : "0");
                      }
                    }}
                    className={[
                      "inline-flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs",
                      "hover:bg-gray-50",
                    ].join(" ")}
                    title={expandedPanels ? "Collapse view" : "Expand view"}
                    aria-pressed={expandedPanels}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      aria-hidden
                    >
                      {expandedPanels ? (
                        <path d="M9 9H5V5M15 15h4v4M15 9h4V5M9 15H5v4" />
                      ) : (
                        <path d="M8 3h4v2H6v6H4V3h4zm12 10h-2v6h-6v2h8v-8zM20 3v8h-2V5h-6V3h8zM10 15v6H4v-2h6v-4h2z" />
                      )}
                    </svg>
                    {expandedPanels ? "Collapse" : "Expand"}
                  </button>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Chief Complaints*">
                  <Textarea
                    value={opChiefComplaints}
                    onChange={(e) => setOpChiefComplaints(e.target.value)}
                    placeholder="e.g., Fever, cough for 3 days"
                  />
                </Field>
                <Field label="Examination">
                  <Textarea
                    value={opExamination}
                    onChange={(e) => setOpExamination(e.target.value)}
                    placeholder="Vitals, systemic exams"
                  />
                </Field>
                <Field label="Diagnosis">
                  <Textarea
                    value={opDiagnosis}
                    onChange={(e) => setOpDiagnosis(e.target.value)}
                    placeholder="Primary/secondary Dx"
                  />
                </Field>
                <Field label="Plan">
                  <Textarea
                    value={opPlan}
                    onChange={(e) => setOpPlan(e.target.value)}
                    placeholder="Investigations, follow-up, lifestyle"
                  />
                </Field>
                <Field className="md:col-span-2" label="Advice / Notes">
                  <Textarea
                    value={opAdvice}
                    onChange={(e) => setOpAdvice(e.target.value)}
                    placeholder="Any additional instructions"
                  />
                </Field>
              </div>

              {/* Collapsible Previous Health Records */}
              <div className="mt-4 rounded-lg border border-gray-200">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-sm"
                  onClick={() => setPrevOpen((s) => !s)}
                  aria-expanded={prevOpen}
                >
                  <span className="text-gray-800">Previous Health Records (latest first)</span>
                  <span style={{ color: "var(--secondary)" }}>
                    {prevOpen ? "▾" : "▸"}
                  </span>
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
                                <div className="text-sm font-medium truncate">
                                  {r.kind} • {r.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDateTime(r.dateISO)}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleExpanded(r.id)}
                                aria-expanded={isOpen}
                                className="p-1 rounded-md shrink-0"
                                style={{ color: "var(--secondary)" }}
                              >
                                <span className="text-base">
                                  {isOpen ? "▾" : "▸"}
                                </span>
                              </button>
                            </div>

                            {isOpen && (
                              <div className="mt-2 rounded-md bg-gray-50 border px-3 py-2">
                                <div className="text-sm text-gray-800">{r.snippet}</div>
                                <div className="mt-2 text-xs text-gray-600">
                                  Doctor: Dr. A • Facility: ARAN Clinic • Ref#: {r.id.toUpperCase()}
                                </div>
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
            <div className="sticky bottom-4 mt-4">
              <div className="ui-card p-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Patient:</span> {patient.name || "—"}
                  <span className="mx-2">•</span>
                  <span className="font-medium">Record:</span> {labelFor(active)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-outline" onClick={handleSaveDraft}>
                    Save Draft (Ctrl+S)
                  </button>
                  <button className="btn-outline" onClick={handleValidate}>
                    Validate & Preview
                  </button>
                  <button className="btn-primary" onClick={handleSubmit}>
                    Submit & Share (Ctrl+Enter)
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: PDF Preview (expanded only) */}
          {expandedPanels && (
            <aside className="w-[380px] shrink-0">
              <div className="ui-card p-3 sticky top-3 max-h-[calc(100vh-140px)] overflow-auto">
                <div className="text-sm font-semibold mb-2">PDF Preview</div>
                <div
                  className="mx-auto bg-white shadow border rounded relative"
                  style={{ width: 320, height: 452 }}
                >
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
                <div className="mt-2 text-[11px] text-gray-500">
                  Live preview updates as you type.
                </div>
              </div>
            </aside>
          )}
        </div>
      ) : (
        /* Other tabs: single center panel (unchanged layout) */
        <section className="space-y-4">
          {/* Lab Request Form */}
          {active === "labRequest" && (
            <div className="ui-card p-4">
              <HeaderRow title="Lab Request Form" subtitle="Add investigations to be performed" />
              <div className="space-y-3">
                {labReqs.map((r, idx) => (
                  <div key={r.id} className="grid md:grid-cols-6 gap-3 items-start">
                    <Field label={`Test Name ${idx + 1}*`}>
                      <input
                        className="ui-input"
                        value={r.testName}
                        onChange={(e) => updateLabReq(r.id, { testName: e.target.value })}
                        placeholder="e.g., CBC"
                      />
                    </Field>
                    <Field label="Priority">
                      <select
                        className="ui-input"
                        value={r.priority}
                        onChange={(e) =>
                          updateLabReq(r.id, { priority: e.target.value as LabReq["priority"] })
                        }
                      >
                        <option>Routine</option>
                        <option>Urgent</option>
                        <option>STAT</option>
                      </select>
                    </Field>
                    <Field label="Specimen">
                      <input
                        className="ui-input"
                        value={r.specimen}
                        onChange={(e) => updateLabReq(r.id, { specimen: e.target.value })}
                        placeholder="e.g., EDTA blood"
                      />
                    </Field>
                    <Field label="Fasting">
                      <div className="flex items-center h-10">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={r.fasting}
                          onChange={(e) => updateLabReq(r.id, { fasting: e.target.checked })}
                        />
                        <span className="text-sm text-gray-700">Required</span>
                      </div>
                    </Field>
                    <Field label="Notes">
                      <input
                        className="ui-input"
                        value={r.notes}
                        onChange={(e) => updateLabReq(r.id, { notes: e.target.value })}
                        placeholder="Any instructions for lab"
                      />
                    </Field>
                    <div className="flex items-end">
                      <button type="button" className="btn-outline" onClick={() => removeLabReq(r.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div>
                  <button className="btn-primary" onClick={() => addLabReq()}>
                    + Add Test
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Immunization Card */}
          {active === "immunizationCard" && (
            <div className="ui-card p-4">
              <HeaderRow title="Immunization Card" subtitle="Capture vaccine details" />
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Vaccine*">
                  <input
                    className="ui-input"
                    value={immVaccine}
                    onChange={(e) => setImmVaccine(e.target.value)}
                    placeholder="e.g., Tdap"
                  />
                </Field>
                <Field label="Batch">
                  <input className="ui-input" value={immBatch} onChange={(e) => setImmBatch(e.target.value)} />
                </Field>
                <Field label="Manufacturer">
                  <input
                    className="ui-input"
                    value={immManufacturer}
                    onChange={(e) => setImmManufacturer(e.target.value)}
                  />
                </Field>
                <Field label="Dose #">
                  <input
                    className="ui-input"
                    value={immDoseNum}
                    onChange={(e) => setImmDoseNum(e.target.value)}
                    placeholder="e.g., 1"
                  />
                </Field>
                <Field label="Date">
                  <input type="date" className="ui-input" value={immDate} onChange={(e) => setImmDate(e.target.value)} />
                </Field>
                <Field label="Next Due">
                  <input
                    type="date"
                    className="ui-input"
                    value={immNextDue}
                    onChange={(e) => setImmNextDue(e.target.value)}
                  />
                </Field>
                <Field label="Site">
                  <input
                    className="ui-input"
                    value={immSite}
                    onChange={(e) => setImmSite(e.target.value)}
                    placeholder="e.g., Left deltoid"
                  />
                </Field>
                <Field label="Route">
                  <input
                    className="ui-input"
                    value={immRoute}
                    onChange={(e) => setImmRoute(e.target.value)}
                    placeholder="e.g., IM"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Discharge Summary */}
          {active === "dischargeSummary" && (
            <div className="ui-card p-4">
              <HeaderRow title="Discharge Summary" subtitle="Summarize inpatient care and advice" />
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Admission Date">
                  <input
                    type="date"
                    className="ui-input"
                    value={dsAdmissionDate}
                    onChange={(e) => setDsAdmissionDate(e.target.value)}
                  />
                </Field>
                <Field label="Discharge Date">
                  <input
                    type="date"
                    className="ui-input"
                    value={dsDischargeDate}
                    onChange={(e) => setDsDischargeDate(e.target.value)}
                  />
                </Field>
                <Field label="Follow-up Date">
                  <input
                    type="date"
                    className="ui-input"
                    value={dsFollowUp}
                    onChange={(e) => setDsFollowUp(e.target.value)}
                  />
                </Field>

                <Field className="md:col-span-3" label="Primary Diagnosis*">
                  <Textarea
                    value={dsPrimaryDx}
                    onChange={(e) => setDsPrimaryDx(e.target.value)}
                    placeholder="Primary Dx"
                  />
                </Field>
                <Field className="md:col-span-3" label="Secondary Diagnoses">
                  <Textarea
                    value={dsSecondaryDx}
                    onChange={(e) => setDsSecondaryDx(e.target.value)}
                    placeholder="List other diagnoses"
                  />
                </Field>
                <Field className="md:col-span-3" label="Procedures">
                  <Textarea
                    value={dsProcedures}
                    onChange={(e) => setDsProcedures(e.target.value)}
                    placeholder="Procedures performed"
                  />
                </Field>
                <Field className="md:col-span-3" label="Hospital Course">
                  <Textarea
                    value={dsHospitalCourse}
                    onChange={(e) => setDsHospitalCourse(e.target.value)}
                    placeholder="Course in hospital"
                  />
                </Field>
                <Field className="md:col-span-3" label="Medications at Discharge">
                  <Textarea
                    value={dsMedications}
                    onChange={(e) => setDsMedications(e.target.value)}
                    placeholder="Discharge meds"
                  />
                </Field>
                <Field className="md:col-span-3" label="Advice & Instructions">
                  <Textarea
                    value={dsAdvice}
                    onChange={(e) => setDsAdvice(e.target.value)}
                    placeholder="Diet, activity, warnings"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Document */}
          {active === "document" && (
            <div className="ui-card p-4">
              <HeaderRow title="Document" subtitle="Attach or describe a document" />
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Document Type">
                  <input
                    className="ui-input"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    placeholder="e.g., Referral, Report, Image"
                  />
                </Field>
                <Field className="md:col-span-2" label="Description">
                  <input
                    className="ui-input"
                    value={docDesc}
                    onChange={(e) => setDocDesc(e.target.value)}
                    placeholder="Short description"
                  />
                </Field>
                <Field className="md:col-span-3" label="Attachments">
                  <input
                    type="file"
                    className="ui-input"
                    multiple
                    onChange={(e) => {
                      const list = Array.from(e.target.files || []).map((f) => f.name);
                      setDocFiles(list);
                    }}
                  />
                </Field>
                {docFiles.length > 0 && (
                  <div className="md:col-span-3 text-sm text-gray-700">
                    <div className="mb-1 font-medium">Selected Files</div>
                    <ul className="list-disc ml-5 space-y-0.5">
                      {docFiles.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
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
                <Field label="Purpose*">
                  <input
                    className="ui-input"
                    value={consentPurpose}
                    onChange={(e) => setConsentPurpose(e.target.value)}
                    placeholder="e.g., Review previous labs"
                  />
                </Field>
                <Field label="Scope">
                  <select className="ui-input" value={consentScope} onChange={(e) => setConsentScope(e.target.value)}>
                    <option>OPD Visit</option>
                    <option>30 days</option>
                    <option>90 days</option>
                    <option>Custom</option>
                  </select>
                </Field>
                <Field label="Valid From">
                  <input
                    type="date"
                    className="ui-input"
                    value={consentFrom ? consentFrom.slice(0, 10) : ""}
                    onChange={(e) => setConsentFrom(new Date(e.target.value).toISOString())}
                  />
                </Field>
                <Field label="Valid To">
                  <input
                    type="date"
                    className="ui-input"
                    value={consentTo ? consentTo.slice(0, 10) : ""}
                    onChange={(e) => setConsentTo(new Date(e.target.value).toISOString())}
                  />
                </Field>
                <Field label="Channel">
                  <select className="ui-input" value={"SMS"} onChange={() => { /* no-op */ }}>
                    <option>SMS</option>
                    <option>Email</option>
                  </select>
                </Field>
                <Field className="md:col-span-3" label="Patient ABHA Address">
                  <input className="ui-input" value={patient.abhaAddress} disabled />
                </Field>
                <div className="md:col-span-3">
                  <button className="btn-primary">Generate Consent Request</button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

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
    setLabReqs((curr) => [
      ...curr,
      { id: uid(), testName: "", priority: "Routine", specimen: "", fasting: false, notes: "" },
    ]);
  }
}

function labelFor(key: TopTabKey) {
  switch (key) {
    case "consultation":
      return "Consultation";
    case "labRequest":
      return "Lab Request Form";
    case "immunizationCard":
      return "Immunization Card";
    case "dischargeSummary":
      return "Discharge Summary";
    case "document":
      return "Document";
    case "consentRequest":
      return "Consent Request";
  }
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-medium">{value && value.trim() ? value : "—"}</div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={["block", className].join(" ")}>
      <span className="block text-xs font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className="ui-input min-h-[96px]"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
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

function Toast({
  type,
  children,
  onClose,
}: {
  type: "success" | "error" | "info";
  children: React.ReactNode;
  onClose: () => void;
}) {
  const color = type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#2563eb";

  useEffect(() => {
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className="rounded-lg shadow-lg border bg-white px-4 py-3 text-sm" style={{ borderColor: color }}>
        <div className="flex items-start gap-2">
          <div className="mt-[2px]" style={{ color }}>
            {type === "success" ? "✔" : type === "error" ? "⚠" : "ℹ"}
          </div>
          <div className="text-gray-800">{children}</div>
          <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
