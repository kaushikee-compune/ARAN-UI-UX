// app/doctor/patients/page.tsx
"use client";

/**
 * ARAN • Doctor → Patients
 * Request: On clicking the "Form" tool, split the main area into two equal halves:
 * - LEFT: Health-record paper (auto-previews the form live)
 * - RIGHT: Form (NOT inside the paper; separate column)
 * The slim right dock (64px) stays outside the paper as before.
 *
 * Form sections:
 * 1) Vitals: Temperature, BP, Weight, Height, BMI (BMI auto-calculated from Height(cm) & Weight(kg))
 * 2) Clinical Details: Chief Complaints, Past Medical History, Family History, Allergy
 * 3) Prescription (table with add/remove rows): Medicine, Frequency, Instruction, Duration, Dosage
 * 4) Investigations & Advice: Investigations, Note, Advice, Doctor Note, Follow-up (instructions + date)
 */

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import Image from "next/image";

/* --------------------------- Types --------------------------- */
type TopMenuKey =
  | "consultation"
  | "lab"
  | "immunization"
  | "discharge"
  | "consent";
type HealthRecordType =
  | "Vitals"
  | "Prescription"
  | "Immunization"
  | "Lab"
  | "DischargeSummary";

type RecordEntry = {
  id: string;
  type: HealthRecordType;
  hospital: string;
  doctor: { name: string; regNo?: string; specialty?: string };
  data: Record<string, any>;
};

type DayRecords = {
  dateLabel: string;
  dateISO: string;
  items: RecordEntry[];
};

type FormState = {
  vitals: {
    temperature?: string;
    bp?: string;
    weight?: string; // kg
    height?: string; // cm
    bmi?: string; // auto
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

/* --------------------------- Mock Data (past tabs) --------------------------- */

const PAST_DAYS: DayRecords[] = [
  {
    dateLabel: "02 Feb 2025",
    dateISO: "2025-02-02",
    items: [
      {
        id: "d1-r1",
        type: "Vitals",
        hospital: "Sushila Mathrutva Clinic",
        doctor: {
          name: "Dr. A. Banerjee",
          specialty: "Internal Medicine",
          regNo: "KMC/2011/12345",
        },
        data: {
          height: "162 cm",
          weight: "64 kg",
          bp: "120/78",
          pulse: "76 bpm",
          spo2: "98%",
        },
      },
      {
        id: "d1-r2",
        type: "Prescription",
        hospital: "Sushila Mathrutva Clinic",
        doctor: {
          name: "Dr. A. Banerjee",
          specialty: "Internal Medicine",
          regNo: "KMC/2011/12345",
        },
        data: {
          medications: [
            {
              name: "Paracetamol 500 mg",
              dose: "1-0-1",
              duration: "5 days",
              notes: "After food",
            },
            {
              name: "Cetirizine 10 mg",
              dose: "0-0-1",
              duration: "5 days",
              notes: "Night",
            },
          ],
          advice: "Hydration, rest",
        },
      },
      {
        id: "d1-r3",
        type: "Immunization",
        hospital: "Sushila Mathrutva Clinic",
        doctor: {
          name: "Dr. A. Banerjee",
          specialty: "Internal Medicine",
          regNo: "KMC/2011/12345",
        },
        data: {
          vaccine: "Tdap",
          lot: "TD-8821",
          site: "Left deltoid",
          nextDose: "After 10 years",
        },
      },
    ],
  },
  {
    dateLabel: "19 Jan 2025",
    dateISO: "2025-01-19",
    items: [
      {
        id: "d2-r1",
        type: "Lab",
        hospital: "City Diagnostics",
        doctor: { name: "Dr. Kavya Rao", specialty: "Pathology" },
        data: {
          panel: "CBC",
          hb: "13.4 g/dL",
          tlc: "7.2 x10^3/µL",
          platelets: "2.1 L/µL",
          comment: "Within normal limits",
        },
      },
    ],
  },
  {
    dateLabel: "03 Jan 2025",
    dateISO: "2025-01-03",
    items: [
      {
        id: "d3-r1",
        type: "Prescription",
        hospital: "Sushila Mathrutva Clinic",
        doctor: {
          name: "Dr. A. Banerjee",
          specialty: "Internal Medicine",
          regNo: "KMC/2011/12345",
        },
        data: {
          medications: [
            {
              name: "Vitamin D3 60k IU",
              dose: "1/week",
              duration: "8 weeks",
              notes: "",
            },
          ],
          advice: "Sun exposure 20 mins/day",
        },
      },
    ],
  },
];

// ✅ ADD: the canonical order you want to show in the right vertical rail
const RECORD_TYPE_ORDER = [
  "Prescription",
  "DiagnosticReport",
  "Immunization",
  "Vitals",
  "DischargeSummary",
] as const;
type RecordType = (typeof RECORD_TYPE_ORDER)[number];

// Normalize & sort the record types that exist for a given day
// function getDayTypes(day: { records: Array<{ kind: string }> }): RecordType[] {
//   const unique = Array.from(new Set(day.records.map((r) => r.kind)));
//   const filtered = unique.filter((k): k is RecordType =>
//     (RECORD_TYPE_ORDER as readonly string[]).includes(k)
//   );
//   return [...filtered].sort(
//     (a, b) => RECORD_TYPE_ORDER.indexOf(a) - RECORD_TYPE_ORDER.indexOf(b)
//   );
// } Kaushikee Commented 
// Given a day, list its record types in a fixed order
const getDayTypes = useCallback((day: DayRecords): HealthRecordType[] => {
  const uniq = Array.from(new Set(day.items.map(i => i.type)));
  return uniq.sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b));
}, []);

/* --------------------------- Tab Colors --------------------------- */
const TAB_COLORS = [
  { bg: "#E0F2FE", text: "#0C4A6E" }, // Sky
  { bg: "#FDE68A", text: "#92400E" }, // Amber
  { bg: "#FBCFE8", text: "#831843" }, // Pink
  { bg: "#C7D2FE", text: "#3730A3" }, // Indigo
  { bg: "#BBF7D0", text: "#065F46" }, // Green
  { bg: "#FEF9C3", text: "#854D0E" }, // Yellow
  { bg: "#E9D5FF", text: "#6B21A8" }, // Purple
];
/* -------------------- Past-records right-rail helpers -------------------- */
const TYPE_ORDER: HealthRecordType[] = [
  "Prescription",
  "Lab",              // shown as "Diagnostic Report"
  "Immunization",
  "Vitals",
  "DischargeSummary",
];

function prettyType(t: HealthRecordType) {
  return t === "Lab"
    ? "Diagnostic Report"
    : t === "DischargeSummary"
    ? "Discharge Summary"
    : t;
}


/* --------------------------- Empty form factory --------------------------- */
function makeEmptyForm(): FormState {
  return {
    vitals: {},
    clinical: {},
    prescription: [
      { medicine: "", frequency: "", instruction: "", duration: "", dosage: "" },
    ],
    plan: {},
  };
}


/* --------------------------- Helpers: ids & dates --------------------------- */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function todayYMD() {
  // local date YYYY-MM-DD
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatDateLabel(d: Date) {
  // e.g. "17 Aug 2025"
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }); // Aug, Sep...
  const yyyy = d.getFullYear();
  return `${dd} ${mon} ${yyyy}`;
}

/* --------------------------- Rx presets --------------------------- */
const RX_FREQUENCY_OPTIONS = [
  "1-1-1",
  "1-1-0",
  "1-0-1",
  "0-1-1",
  "1-0-0",
  "0-1-0",
  "0-0-1",
  "OD (once daily)",
  "BID (twice daily)",
  "TID (thrice daily)",
  "QID (4 times)",
  "HS (at bedtime)",
  "STAT",
  "SOS",
];

const RX_INSTRUCTION_OPTIONS = [
  "After food",
  "Before food",
  "With food",
  "Empty stomach",
  "With water",
  "With milk",
  "Morning",
  "Night",
  "As directed",
];

/* --------------------------- Page ---------------------------- */
export default function PatientsPage() {
  // Language popover
  const [lang, setLang] = useState("English");
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  // Print popover
  const [printOpen, setPrintOpen] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  const onPrint = useCallback(() => window.print(), []);

  // Close popovers on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (langOpen && langRef.current && !langRef.current.contains(t))
        setLangOpen(false);
      if (printOpen && printRef.current && !printRef.current.contains(t))
        setPrintOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [langOpen, printOpen]);

  // Horizontal top menu (kept)
  const [active, setActive] = useState<TopMenuKey>("consultation");

  // Sidebar collapsed toggle (syncs with /doctor layout)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    try {
      setSidebarCollapsed(
        localStorage.getItem("aran:sidebarCollapsed") === "1"
      );
    } catch {}
  }, []);
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem("aran:sidebarCollapsed", next ? "1" : "0");
      window.dispatchEvent(new Event("aran:sidebar"));
    } catch {}
  };

  // Patient snapshot (placeholder)
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

  

  // Tabs (0 = New Record preview, 1.. = past days)
  // Was using the constant PAST_DAYS directly.
  // ✅ Add state so we can push today's records on Save:
  const [pastDays, setPastDays] = useState<DayRecords[]>(PAST_DAYS);

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  useEffect(() => setSelectedItemIdx(0), [tabIndex]);  

  // Toasts
  const [toast, setToast] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);
  const show = (t: typeof toast) => setToast(t);
  // Replace your existing onSave with the real save
   // ✅ REPLACE any previous onSave with this simple function version
const onSave = () => {
  // 1) Build record entries from the form
  const newEntries: RecordEntry[] = [];

  const rxRows = form.prescription.filter(
    (r) => r.medicine || r.frequency || r.instruction || r.duration || r.dosage
  );
  if (rxRows.length > 0) {
    newEntries.push({
      id: uid(),
      type: "Prescription",
      hospital: "Sushila Mathrutva Clinic",
      doctor: {
        name: "Dr. A. Banerjee",
        specialty: "Internal Medicine",
        regNo: "KMC/2011/12345",
      },
      data: {
        medications: rxRows.map((r) => ({
          name: r.medicine || "-",
          // show something in the "Dose" column (you can switch to r.dosage if you prefer)
          dose: r.frequency || r.dosage || "-",
          duration: r.duration || "-",
          notes: r.instruction || "-",
        })),
        advice: form.plan.advice || undefined,
      },
    });
  }

  const hasVitals =
    !!form.vitals.bp ||
    !!form.vitals.weight ||
    !!form.vitals.height ||
    !!form.vitals.temperature ||
    !!form.vitals.bmi;

  if (hasVitals) {
    newEntries.push({
      id: uid(),
      type: "Vitals",
      hospital: "Sushila Mathrutva Clinic",
      doctor: {
        name: "Dr. A. Banerjee",
        specialty: "Internal Medicine",
        regNo: "KMC/2011/12345",
      },
      data: {
        height: form.vitals.height ? `${form.vitals.height} cm` : undefined,
        weight: form.vitals.weight ? `${form.vitals.weight} kg` : undefined,
        bp: form.vitals.bp || undefined,
      },
    });
  }

  if (newEntries.length === 0) {
    setToast({ type: "error", message: "Nothing to save. Add Vitals or Prescription." });
    return;
  }

  // 2) Upsert today's day bucket
  const now = new Date();
  const iso = todayYMD();           // e.g., "2025-08-17"
  const label = formatDateLabel(now); // e.g., "17 Aug 2025"

  setPastDays((prev) => {
    const idx = prev.findIndex((d) => d.dateISO === iso);
    if (idx >= 0) {
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], items: [...newEntries, ...copy[idx].items] };
      return copy;
    }
    return [{ dateLabel: label, dateISO: iso, items: newEntries }, ...prev];
  });

  // 3) Show the new tab and first record
  setTabIndex(1);
  setSelectedItemIdx(0);
  setForm(makeEmptyForm());


  // 4) Toast
  setToast({ type: "success", message: "Record saved." });
};

// OnSubmit callback
  const onSubmit = useCallback(
    () => show({ type: "success", message: "Record submitted." }),
    []
  );

  // Past record selection
  // ✅ ADD: put with other useState hooks
  // Track the selected record type per day (keyed by day.id)

  const [activeTypeByDay, setActiveTypeByDay] = useState<Record<string, HealthRecordType>>({});
  const selectedDay = tabIndex > 0 ? pastDays[tabIndex - 1] : undefined;
  const currentRecord = selectedDay?.items[selectedItemIdx];
  const canGoLeft = !!selectedDay && selectedItemIdx > 0;
  const canGoRight =
    !!selectedDay && selectedItemIdx < selectedDay.items.length - 1;
  const goLeft = () => canGoLeft && setSelectedItemIdx((i) => i - 1);
  const goRight = () => canGoRight && setSelectedItemIdx((i) => i + 1);

  const colorFor = (i: number) => TAB_COLORS[i % TAB_COLORS.length];

  

  // ---------- NEW: Form toggle + state ----------
  const [formOpen, setFormOpen] = useState(false);
  // const [form, setForm] = useState<FormState>({
  //   vitals: {},
  //   clinical: {},
  //   prescription: [
  //     {
  //       medicine: "",
  //       frequency: "",
  //       instruction: "",
  //       duration: "",
  //       dosage: "",
  //     },
  //   ],
  //   plan: {},
  // });
  const [form, setForm] = useState<FormState>(() => makeEmptyForm());

  // Open the split view & jump to "New Record" preview when user presses Form tool
  const handleToggleForm = useCallback(() => {
    setFormOpen((prev) => {
      const next = !prev;
      if (next) setTabIndex(0); // ensure paper shows the live preview
      return next;
    });
  }, []);

  // Auto-calc BMI whenever height(cm) & weight(kg) are entered
  useEffect(() => {
    const h = Number(form.vitals.height || "");
    const w = Number(form.vitals.weight || "");
    if (h > 0 && w > 0) {
      const bmi = w / Math.pow(h / 100, 2);
      if (!isNaN(bmi)) {
        setForm((f) => ({
          ...f,
          vitals: { ...f.vitals, bmi: bmi.toFixed(1) },
        }));
      }
    } else {
      setForm((f) => ({ ...f, vitals: { ...f.vitals, bmi: "" } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vitals.height, form.vitals.weight]);

  return (
    <div className="space-y-3">
      {/* 1) Horizontal Menu + Sidebar Toggle */}
      <div className="ui-card px-3 py-2">
        <div className="flex items-center gap-2">
          <TopMenuButton
            active={active === "consultation"}
            onClick={() => setActive("consultation")}
            label="Consultation"
          />
          <TopMenuButton
            active={active === "lab"}
            onClick={() => setActive("lab")}
            label="Lab Request"
          />
          <TopMenuButton
            active={active === "immunization"}
            onClick={() => setActive("immunization")}
            label="Immunization Record"
          />
          <TopMenuButton
            active={active === "discharge"}
            onClick={() => setActive("discharge")}
            label="Discharge Summary"
          />
          <TopMenuButton
            active={active === "consent"}
            onClick={() => setActive("consent")}
            label="Consent"
          />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600">Write Record</span>
            <Switch checked={sidebarCollapsed} onChange={toggleSidebar} />
          </div>
        </div>
      </div>

      {/* 2) Split Grid:
          - If formOpen: [paper | form | 64px dock]
          - Else:        [paper .......... | 64px dock] */}
      <div className="mt-8 px-3 md:px-6 lg:px-8">
        <div
          className={
            "grid gap-4 items-start " +
            (formOpen
              ? "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_64px]"
              : "grid-cols-1 md:grid-cols-[minmax(0,1fr)_64px]")
          }
        >
          {/* LEFT: Paper panel (health record canvas, now in its own column) */}
          <div className="min-w-0">
            <div
              className="relative mx-auto bg-white border rounded-xl shadow-sm overflow-visible"
              style={{
                // Let grid define the width; we only set height and paper look
                minHeight: 700,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,252,1) 100%)",
              }}
            >
              {/* Tabs Rail (behind) */}
              <div
                className="absolute left-4 -top-5 flex flex-wrap gap-2 z-0"
                aria-label="Health record tabs"
              >
                {/* Tab 0: New Record */}
                {(() => {
                  const col = colorFor(0);
                  const activeTab = tabIndex === 0;
                  return (
                    <button
                      key="new-record"
                      onClick={() => setTabIndex(0)}
                      aria-pressed={activeTab}
                      className={[
                        "px-4 py-2 text-sm font-semibold border-2 shadow-sm rounded-tl-none rounded-tr-lg",
                        activeTab
                          ? "ring-2 z-20"
                          : "hover:brightness-[.98] z-0",
                      ].join(" ")}
                      style={{
                        background: col.bg,
                        color: col.text,
                        borderColor: activeTab ? "#1b1a1aff" : "#b8b5b5ff",
                        boxShadow: activeTab
                          ? "0 2px 0 rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)"
                          : undefined,
                        transform: activeTab ? "translateY(-4px)" : undefined,
                        outline: "none",
                      }}
                    >
                      <span className="relative -top-[7px] ">+ New Record</span>
                    </button>
                  );
                })()}

                {/* Date tabs */}
                {pastDays.map((d, idx) => {
                  const i = idx + 1;
                  const activeTab = tabIndex === i;
                  const col = colorFor(i);
                  return (
                    <button
                      key={d.dateISO}
                      onClick={() => setTabIndex(i)}
                      aria-pressed={activeTab}
                      title={`Records from ${d.dateLabel}`}
                      className={[
                        "px-4 py-2 text-sm font-semibold border-2 shadow-sm rounded-tl-none rounded-tr-lg",
                        activeTab
                          ? "ring-2 z-20"
                          : "hover:brightness-[.98] z-0",
                      ].join(" ")}
                      style={{
                        background: col.bg,
                        color: col.text,
                        borderColor: activeTab ? "#1b1a1aff" : "#b8b5b5ff",
                        boxShadow: activeTab
                          ? "0 2px 0 rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)"
                          : undefined,
                        transform: activeTab ? "translateY(-4px)" : undefined,
                        outline: "none",
                      }}
                    >
                      <span className="relative -top-[7px] ">
                        {d.dateLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Top cover band so inactive tabs sit behind */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-xl z-10"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,252,1) 100%)",
                }}
                aria-hidden
              />

              {/* Paper inner padding */}
              <div className="relative z-10 p-4 md:p-6">
                {/* Header row inside paper */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-start">
                  {/* Left: Patient demographics */}
                  <div className="min-w-0 pr-3">
                    <div className="text-xs text-gray-500 mb-1">Patient</div>
                    <div className="text-sm font-semibold">{patient.name}</div>
                    <div className="text-xs text-gray-700 mt-0.5">
                      {patient.gender} • {patient.age}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      ABHA No: {patient.abhaNumber}
                    </div>
                    <div className="text-xs text-gray-600">
                      ABHA Address: {patient.abhaAddress}
                    </div>
                  </div>

                  {/* Center: Logo (use your public asset) */}
                  <Image
                    src="/whitelogo.png"
                    alt="ARAN Logo"
                    width={40}
                    height={40}
                  />

                  {/* Right: Patient Summary (placeholder) */}
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

                {/* Divider */}
                <div className="my-3 border-t border-gray-200" />

                {/* ------- Selected Tab Content ------- */}
                <div className="mt-2">
                  {tabIndex === 0 ? (
                    // LIVE PREVIEW of the current form
                    <div className="ui-card p-4 text-sm text-gray-800 space-y-6">
                      <NewRecordPreview form={form} />
                    </div>
                  ) : (
                    <>
                      {currentRecord ? (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="text-sm">
                            <span className="font-semibold">
                              {currentRecord.type}
                            </span>
                            <span className="text-gray-500">
                              {" "}
                              • {currentRecord.hospital}
                            </span>
                            <span className="text-gray-500">
                              {" "}
                              • {currentRecord.doctor.name}
                              {currentRecord.doctor.specialty
                                ? ` (${currentRecord.doctor.specialty})`
                                : ""}
                              {currentRecord.doctor.regNo
                                ? ` • Reg: ${currentRecord.doctor.regNo}`
                                : ""}
                            </span>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={goLeft}
                              disabled={!canGoLeft}
                              className={[
                                "inline-flex items-center justify-center w-8 h-8 rounded-md border",
                                canGoLeft
                                  ? "bg-white hover:bg-gray-50"
                                  : "bg-gray-50 opacity-50 cursor-not-allowed",
                              ].join(" ")}
                              aria-label="Previous record"
                              title="Previous record"
                            >
                              <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            <div className="text-xs text-gray-500">
                              {selectedItemIdx + 1} /{" "}
                              {selectedDay?.items.length || 0}
                            </div>
                            <button
                              type="button"
                              onClick={goRight}
                              disabled={!canGoRight}
                              className={[
                                "inline-flex items-center justify-center w-8 h-8 rounded-md border",
                                canGoRight
                                  ? "bg-white hover:bg-gray-50"
                                  : "bg-gray-50 opacity-50 cursor-not-allowed",
                              ].join(" ")}
                              aria-label="Next record"
                              title="Next record"
                            >
                              <ChevronRightIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No records found for this day.
                        </div>
                      )}

                      <div className="mt-3 ui-card p-4">
                        {currentRecord ? (
                          <RecordRenderer record={currentRecord} />
                        ) : (
                          <div className="text-sm text-gray-500">—</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE: The Form (appears only when formOpen) */}
          {formOpen && (
            <div className="min-w-0">
              <div className="ui-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Consultation Form</h3>
                  <button
                    className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    onClick={() => setFormOpen(false)}
                    title="Close form"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-3 grid gap-4">
                  {/* 1) Vitals */}
                  <section>
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Vitals
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <LabeledInput
                        label="Temperature (°C)"
                        value={form.vitals.temperature || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            vitals: { ...f.vitals, temperature: v },
                          }))
                        }
                      />
                      <LabeledInput
                        label="BP (mmHg)"
                        placeholder="120/80"
                        value={form.vitals.bp || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            vitals: { ...f.vitals, bp: v },
                          }))
                        }
                      />
                      <LabeledInput
                        label="Weight (kg)"
                        type="number"
                        value={form.vitals.weight || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            vitals: { ...f.vitals, weight: v },
                          }))
                        }
                      />
                      <LabeledInput
                        label="Height (cm)"
                        type="number"
                        value={form.vitals.height || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            vitals: { ...f.vitals, height: v },
                          }))
                        }
                      />
                      <LabeledInput
                        label="BMI"
                        value={form.vitals.bmi || ""}
                        readOnly
                      />
                    </div>
                  </section>

                  {/* 2) Clinical Details */}
                  <section>
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Clinical Details
                    </div>
                    <div className="grid gap-2">
                      <LabeledTextarea
                        label="Chief Complaints"
                        value={form.clinical.chiefComplaints || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            clinical: { ...f.clinical, chiefComplaints: v },
                          }))
                        }
                      />
                      <LabeledTextarea
                        label="Past Medical History"
                        value={form.clinical.pastHistory || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            clinical: { ...f.clinical, pastHistory: v },
                          }))
                        }
                      />
                      <LabeledTextarea
                        label="Family History"
                        value={form.clinical.familyHistory || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            clinical: { ...f.clinical, familyHistory: v },
                          }))
                        }
                      />
                      <LabeledTextarea
                        label="Allergy"
                        value={form.clinical.allergy || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            clinical: { ...f.clinical, allergy: v },
                          }))
                        }
                      />
                    </div>
                  </section>

                  {/* 3) Prescription (table) */}
                  <section>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-600">
                        Prescription
                      </div>
                      <button
                        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            prescription: [
                              ...f.prescription,
                              {
                                medicine: "",
                                frequency: "",
                                instruction: "",
                                duration: "",
                                dosage: "",
                              },
                            ],
                          }))
                        }
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
                          {form.prescription.map((row, idx) => (
                            <tr key={idx} className="border-t align-top">
                              <Td>
                                <input
                                  className="ui-input w-full"
                                  value={row.medicine}
                                  onChange={(e) =>
                                    updateRx(idx, { medicine: e.target.value })
                                  }
                                  placeholder="e.g., Paracetamol 500 mg"
                                />
                              </Td>
                              <Td>
                                <input
                                  className="ui-input w-full"
                                  list="rx-frequency-options"
                                  value={row.frequency}
                                  onChange={(e) =>
                                    updateRx(idx, { frequency: e.target.value })
                                  }
                                  placeholder="1-0-1 or BID/TID"
                                />
                              </Td>
                              <Td>
                                <input
                                  className="ui-input w-full"
                                  list="rx-instruction-options"
                                  value={row.instruction}
                                  onChange={(e) =>
                                    updateRx(idx, {
                                      instruction: e.target.value,
                                    })
                                  }
                                  placeholder="After food"
                                />
                              </Td>
                              <Td>
                                <input
                                  className="ui-input w-full"
                                  value={row.duration}
                                  onChange={(e) =>
                                    updateRx(idx, { duration: e.target.value })
                                  }
                                  placeholder="5 days"
                                />
                              </Td>
                              <Td>
                                <input
                                  className="ui-input w-full"
                                  value={row.dosage}
                                  onChange={(e) =>
                                    updateRx(idx, { dosage: e.target.value })
                                  }
                                  placeholder="500 mg"
                                />
                              </Td>
                              <Td>
                                <button
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full border hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                                  aria-label="Delete row"
                                  title="Delete row"
                                  onClick={() =>
                                    setForm((f) => ({
                                      ...f,
                                      prescription: f.prescription.filter(
                                        (_, i) => i !== idx
                                      ),
                                    }))
                                  }
                                >
                                  ×
                                </button>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {/* Suggested values for Rx fields (shared by all rows) */}
                      <datalist id="rx-frequency-options">
                        {RX_FREQUENCY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>

                      <datalist id="rx-instruction-options">
                        {RX_INSTRUCTION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>
                    </div>
                  </section>

                  {/* 4) Investigations & Advice */}
                  <section>
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Investigations &amp; Advice
                    </div>
                    <div className="grid gap-2">
                      <LabeledTextarea
                        label="Investigations"
                        value={form.plan.investigations || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            plan: { ...f.plan, investigations: v },
                          }))
                        }
                      />
                      <LabeledTextarea
                        label="Note"
                        value={form.plan.note || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            plan: { ...f.plan, note: v },
                          }))
                        }
                      />
                      <LabeledTextarea
                        label="Advice"
                        value={form.plan.advice || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            plan: { ...f.plan, advice: v },
                          }))
                        }
                      />
                      <LabeledTextarea
                        label="Doctor Note"
                        value={form.plan.doctorNote || ""}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            plan: { ...f.plan, doctorNote: v },
                          }))
                        }
                      />

                      <div className="grid sm:grid-cols-2 gap-2">
                        <LabeledInput
                          label="Follow-up Instructions"
                          value={form.plan.followUpInstructions || ""}
                          onChange={(v) =>
                            setForm((f) => ({
                              ...f,
                              plan: { ...f.plan, followUpInstructions: v },
                            }))
                          }
                        />
                        <div className="grid gap-1">
                          <label className="text-[11px] text-gray-600">
                            Follow-up Date
                          </label>
                          <input
                            type="date"
                            className="ui-input w-full min-w-0"
                            value={form.plan.followUpDate || ""}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                plan: {
                                  ...f.plan,
                                  followUpDate: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Footer controls (optional, main Save/Submit still in right dock) */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
                      onClick={onSave}
                    >
                      Save Draft
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
                      onClick={onSubmit}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: Slim outside dock (vertical tools + compact action icons) */}
          <aside className="hidden md:block sticky top-20 self-start w-[64px]">
            <div className="flex flex-col items-center gap-2">
              {/* Vertical tool buttons */}
              <ToolButton label="Voice">
                <MicIcon className="w-4 h-4" />
              </ToolButton>

              {/* Form tool wired to split view */}
              <button
                className={
                  "group relative inline-flex items-center justify-center w-9 h-9 rounded-full border shadow " +
                  (formOpen
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300")
                }
                title="Form"
                aria-pressed={formOpen}
                onClick={handleToggleForm}
              >
                <FormIcon className="w-4 h-4" />
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
                  Form
                </span>
              </button>

              <ToolButton label="Scribe">
                <ScribeIcon className="w-4 h-4" />
              </ToolButton>

              <div className="my-1 h-px w-8 bg-gray-200" />

              {/* Action icons (tiny) */}
              {/* Language (icon → floating selection window) */}
              <div className="relative" ref={langRef}>
                <IconBtn
                  label="Language"
                  tone="neutral"
                  onClick={() => {
                    setLangOpen((s) => !s);
                    setPrintOpen(false);
                  }}
                >
                  <LanguagesIcon className="w-4 h-4" />
                </IconBtn>

                {langOpen && (
                  <div className="absolute left-full top-0 ml-2 z-50 w-44 border rounded-lg bg-white shadow-md p-2">
                    <div className="px-1 pb-1 text-[11px] text-gray-600">
                      Select language
                    </div>
                    <ul className="max-h-48 overflow-auto text-sm">
                      {[
                        "English",
                        "Hindi",
                        "Bengali",
                        "Kannada",
                        "Tamil",
                        "Telugu",
                      ].map((opt) => (
                        <li key={opt}>
                          <button
                            className={[
                              "w-full text-left px-2 py-1 rounded-md hover:bg-gray-100",
                              opt === lang ? "font-medium" : "",
                            ].join(" ")}
                            onClick={() => {
                              setLang(opt);
                              setLangOpen(false);
                              show({
                                type: "info",
                                message: `Language: ${opt}`,
                              });
                            }}
                          >
                            {opt}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Save (tiny, blue) */}
              <IconBtn label="Save" tone="info" onClick={onSave}>
                <SaveIcon className="w-4 h-4" />
              </IconBtn>

              {/* Submit (tiny, green) */}
              <IconBtn label="Submit" tone="success" onClick={onSubmit}>
                <TickIcon className="w-4 h-4" />
              </IconBtn>

              {/* Print (icon → small panel) */}
              <div className="relative" ref={printRef}>
                <IconBtn
                  label="Print"
                  tone="neutral"
                  onClick={() => {
                    setPrintOpen((s) => !s);
                    setLangOpen(false);
                  }}
                >
                  <PrinterIcon className="w-4 h-4" />
                </IconBtn>

                {printOpen && (
                  <div className="absolute left-full top-0 ml-2 z-50 w-48 border rounded-lg bg-white shadow-md p-2">
                    <div className="px-1 pb-1 text-[11px] text-gray-600">
                      Print options
                    </div>
                    <div className="space-y-1">
                      <button
                        className="w-full text-left px-2 py-1 rounded-md hover:bg-gray-100 text-sm"
                        onClick={() => {
                          onPrint();
                          setPrintOpen(false);
                        }}
                      >
                        Open Print Preview
                      </button>
                      <button
                        className="w-full text-left px-2 py-1 rounded-md hover:bg-gray-100 text-sm"
                        onClick={() => {
                          onPrint();
                          setPrintOpen(false);
                        }}
                      >
                        Print Current Tab
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
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

  // helper to update prescription row
  function updateRx(
    idx: number,
    patch: Partial<FormState["prescription"][number]>
  ) {
    setForm((f) => {
      const next = f.prescription.slice();
      next[idx] = { ...next[idx], ...patch };
      return { ...f, prescription: next };
    });
  }
}

/* ------------------------- New Record PREVIEW (Paper) ------------------------- */
function NewRecordPreview({ form }: { form: FormState }) {
  const hasVitals =
    !!form.vitals.temperature ||
    !!form.vitals.bp ||
    !!form.vitals.weight ||
    !!form.vitals.height ||
    !!form.vitals.bmi;

  const hasClinical =
    !!form.clinical.chiefComplaints ||
    !!form.clinical.pastHistory ||
    !!form.clinical.familyHistory ||
    !!form.clinical.allergy;

  const hasAnyRx = form.prescription.some(
    (r) => r.medicine || r.frequency || r.instruction || r.duration || r.dosage
  );

  const hasPlan =
    !!form.plan.investigations ||
    !!form.plan.note ||
    !!form.plan.advice ||
    !!form.plan.doctorNote ||
    !!form.plan.followUpInstructions ||
    !!form.plan.followUpDate;

  if (!hasVitals && !hasClinical && !hasAnyRx && !hasPlan) {
    return (
      <div className="min-h-[320px] grid place-items-center text-gray-400">
        (Start typing in the form to see a live preview here…)
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vitals */}
      {hasVitals && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Vitals</h4>
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <KV
              label="Temperature"
              value={fmt(form.vitals.temperature, "°C")}
            />
            <KV label="Blood Pressure" value={form.vitals.bp} />
            <KV label="Weight" value={fmt(form.vitals.weight, "kg")} />
            <KV label="Height" value={fmt(form.vitals.height, "cm")} />
            <KV label="BMI" value={form.vitals.bmi} />
          </div>
        </section>
      )}

      {/* Clinical Details */}
      {hasClinical && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Clinical Details</h4>
          <div className="grid gap-1 text-sm">
            {form.clinical.chiefComplaints && (
              <KV
                label="Chief Complaints"
                value={form.clinical.chiefComplaints}
              />
            )}
            {form.clinical.pastHistory && (
              <KV
                label="Past Medical History"
                value={form.clinical.pastHistory}
              />
            )}
            {form.clinical.familyHistory && (
              <KV label="Family History" value={form.clinical.familyHistory} />
            )}
            {form.clinical.allergy && (
              <KV label="Allergy" value={form.clinical.allergy} />
            )}
          </div>
        </section>
      )}

      {/* Prescription */}
      {hasAnyRx && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Prescription</h4>
          <div className="overflow-x-auto">
            <table className="w-full border text-sm table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Medicine</Th>
                  <Th>Frequency</Th>
                  <Th>Instruction</Th>
                  <Th>Duration</Th>
                  <Th>Dosage</Th>
                </tr>
              </thead>
              <tbody>
                {form.prescription
                  .filter(
                    (r) =>
                      r.medicine ||
                      r.frequency ||
                      r.instruction ||
                      r.duration ||
                      r.dosage
                  )
                  .map((r, i) => (
                    <tr key={i} className="border-t">
                      <Td>{r.medicine || "-"}</Td>
                      <Td>{r.frequency || "-"}</Td>
                      <Td>{r.instruction || "-"}</Td>
                      <Td>{r.duration || "-"}</Td>
                      <Td>{r.dosage || "-"}</Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Investigations & Advice */}
      {hasPlan && (
        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Investigations &amp; Advice</h4>
          <div className="grid gap-1 text-sm">
            {form.plan.investigations && (
              <KV label="Investigations" value={form.plan.investigations} />
            )}
            {form.plan.note && <KV label="Note" value={form.plan.note} />}
            {form.plan.advice && <KV label="Advice" value={form.plan.advice} />}
            {form.plan.doctorNote && (
              <KV label="Doctor Note" value={form.plan.doctorNote} />
            )}
            {(form.plan.followUpInstructions || form.plan.followUpDate) && (
              <KV
                label="Follow-up"
                value={[
                  form.plan.followUpInstructions,
                  form.plan.followUpDate ? `on ${form.plan.followUpDate}` : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function fmt(v?: string, unit?: string) {
  if (!v) return "";
  return unit ? `${v} ${unit}` : v;
}

/* ------------------------- Record Renderer (Past) ------------------------- */
function RecordRenderer({ record }: { record: RecordEntry }) {
  switch (record.type) {
    case "Vitals":
      return (
        <div className="grid gap-2 text-sm text-gray-800 md:grid-cols-3">
          <KV label="Height" value={record.data.height} />
          <KV label="Weight" value={record.data.weight} />
          <KV label="Blood Pressure" value={record.data.bp} />
          <KV label="Pulse" value={record.data.pulse} />
          <KV label="SpO₂" value={record.data.spo2} />
        </div>
      );
    case "Prescription":
      return (
        <div className="space-y-3 text-sm text-gray-800">
          <div className="font-medium">Medications</div>
          <div className="overflow-x-auto">
            <table className="min-w-[520px] w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Medicine</Th>
                  <Th>Dose</Th>
                  <Th>Duration</Th>
                  <Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {(record.data.medications || []).map((m: any, i: number) => (
                  <tr key={i} className="border-t">
                    <Td>{m.name}</Td>
                    <Td>{m.dose}</Td>
                    <Td>{m.duration}</Td>
                    <Td>{m.notes || "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {record.data.advice ? (
            <div className="text-gray-700">
              <span className="font-medium">Advice: </span>
              {record.data.advice}
            </div>
          ) : null}
        </div>
      );
    case "Immunization":
      return (
        <div className="grid gap-2 text-sm text-gray-800 md:grid-cols-3">
          <KV label="Vaccine" value={record.data.vaccine} />
          <KV label="Lot/Batch" value={record.data.lot} />
          <KV label="Site" value={record.data.site} />
          <KV label="Next Dose" value={record.data.nextDose} />
        </div>
      );
    case "Lab":
      return (
        <div className="grid gap-2 text-sm text-gray-800 md:grid-cols-2">
          <KV label="Panel" value={record.data.panel} />
          <KV label="Hb" value={record.data.hb} />
          <KV label="TLC" value={record.data.tlc} />
          <KV label="Platelets" value={record.data.platelets} />
          <div className="md:col-span-2 text-gray-700">
            <span className="font-medium">Comment: </span>
            {record.data.comment}
          </div>
        </div>
      );
    case "DischargeSummary":
      return (
        <div className="space-y-2 text-sm text-gray-800">
          <KV label="Diagnosis" value={record.data.diagnosis} />
          <KV label="Course" value={record.data.course} />
          <KV label="Advice" value={record.data.advice} />
        </div>
      );
    default:
      return (
        <div className="text-sm text-gray-500">
          No renderer for {record.type}.
        </div>
      );
  }
}

/* ------------------------- Small UI pieces ------------------------- */
function KV({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-500 w-36">{label}</div>
      <div className="font-medium">{value || "-"}</div>
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

function TopMenuButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={[
        "px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition",
        active ? "bg-gray-900 text-white" : "hover:bg-gray-100",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-50 transition"
      title={checked ? "Expand sidebar" : "Collapse sidebar"}
    >
      <PenIcon className="w-4 h-4 text-green-700" />
    </button>
  );
}

function ToolButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className="group relative inline-flex items-center justify-center w-9 h-9 rounded-full border bg-white shadow hover:bg-gray-50"
      title={label}
      aria-label={label}
    >
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </button>
  );
}

function IconBtn({
  label,
  children,
  tone = "neutral",
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success";
  onClick?: () => void;
}) {
  const styles =
    tone === "success"
      ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
      : tone === "info"
      ? "bg-sky-600 text-white hover:bg-sky-700 border-sky-700"
      : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300";
  return (
    <button
      onClick={onClick}
      className={[
        "group relative inline-flex items-center justify-center w-9 h-9 rounded-full border shadow",
        styles,
      ].join(" ")}
      title={label}
      aria-label={label}
    >
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </button>
  );
}

/* --------------------------- Inline Icons --------------------------- */
function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 19v2" />
    </svg>
  );
}
function FormIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
function ScribeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path d="M4 20h12l4-4V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16Z" />
      <path d="M14 2v6h6" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  );
}
function SummaryIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
function ChevronLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function ChevronRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function PenIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="green"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
function LanguagesIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18" />
    </svg>
  );
}
function SaveIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4z" />
      <path d="M16 22V13H8v9" />
      <path d="M8 4v5h6" />
    </svg>
  );
}
function TickIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function PrinterIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 9V3h12v6" />
      <rect x="6" y="13" width="12" height="8" rx="1.5" />
      <path d="M6 13H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

/* --------------------------- Helpers --------------------------- */
// Simple toast
function Toast({
  type,
  children,
  onClose,
}: {
  type: "success" | "error" | "info";
  children: React.ReactNode;
  onClose: () => void;
}) {
  const color =
    type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#2563eb";
  useEffect(() => {
    const t = setTimeout(onClose, 1800);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div
        className="rounded-lg shadow-lg border bg-white px-4 py-3 text-sm"
        style={{ borderColor: color }}
      >
        <div className="flex items-start gap-2">
          <div className="mt-[2px]" style={{ color }}>
            {type === "success" ? "✔" : type === "error" ? "⚠" : "ℹ"}
          </div>
          <div className="text-gray-800">{children}</div>
          <button
            onClick={onClose}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small labeled inputs ---------- */
function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
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
      />
    </div>
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
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
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
