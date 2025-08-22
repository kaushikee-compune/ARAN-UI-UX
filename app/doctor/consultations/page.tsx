// app/doctor/consultations/page.tsx
"use client";

/**
 * Doctor → Consultations
 * ----------------------------------------------------------------
 * ✅ Header with Consultation/Consent/OPD Queue and Companion Mode
 * ✅ Sticky right toolbar (Group A + Group B)
 * ✅ Patient demography header (left info, center logo, right patient summary)
 * ✅ Paper-style preview window with tabs (Tab 0 = current record)
 * ✅ Past records (datewise tabs). Inside: right vertical tabs per record type.
 * ✅ Companion ON → split view (preview left, form right)
 * ✅ Digital Rx toolbar → collapse sidebar, show DigitalRxForm INSIDE Tab 0
 * ✅ Both "Form" (Companion) and "Digital Rx" wired to components/doctor/DigitalRxForm.tsx
 *    - Supports both signatures: (value/onChange) or (onSnapshot)
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DigitalRxForm from "@/components/doctor/DigitalRxForm"; // your file
// import Image from "next/image"; // if you prefer <Image /> for icons

/* ────────────────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────────────────── */

type TopMenuKey = "consultation" | "consent" | "queue";

type HealthRecordType =
  | "Vitals"
  | "ClinicalDetails"
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
  dateLabel: string; // "03 June 2025"
  dateISO: string; // "2025-06-03"
  items: RecordEntry[];
};

// This shape is what the PREVIEW expects (and what we keep in local state)
export type FormState = {
  vitals: {
    temperature?: string;
    bp?: string;
    weight?: string; // kg
    height?: string; // cm
    bmi?: string; // auto-calc
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

const INITIAL_FORM: FormState = {
  vitals: {},
  clinical: {},
  prescription: [
    { medicine: "", frequency: "", instruction: "", duration: "", dosage: "" },
  ],
  plan: {},
};

/* ────────────────────────────────────────────────────────────────────────────
   Mapper: DigitalRxForm snapshot → FormState used by Preview
   (if your DigitalRxForm emits `onSnapshot`, this adapter keeps preview in sync)
──────────────────────────────────────────────────────────────────────────── */
function rxToForm(rx: any): FormState {
  return {
    vitals: {
      temperature: rx?.vitals?.tempC ?? "",
      bp: rx?.vitals?.bp ?? "",
      weight: rx?.vitals?.weightKg ?? "",
      height: rx?.vitals?.heightCm ?? "",
      bmi: rx?.vitals?.bmi ?? "",
    },
    clinical: {
      chiefComplaints: rx?.chiefComplaints ?? "",
      pastHistory: rx?.pmh ?? "",
      familyHistory: rx?.fhx ?? "",
      allergy: rx?.allergy ?? "",
    },
    prescription: Array.isArray(rx?.meds)
      ? rx.meds.map((m: any) => ({
          medicine: m?.name ?? "",
          frequency: m?.frequency ?? "",
          instruction: m?.instruction ?? "",
          duration: m?.duration ?? "",
          dosage: m?.dosage ?? "",
        }))
      : [],
    plan: {
      investigations: rx?.investigations ?? "",
      note: rx?.note ?? "",
      advice: rx?.advice ?? "",
      doctorNote: rx?.doctorNote ?? "",
      followUpInstructions: rx?.followUp?.instructions ?? "",
      followUpDate: rx?.followUp?.date ?? "",
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Sample Past Records (inline JSON). You can move to JSON files later.
──────────────────────────────────────────────────────────────────────────── */
const PAST_DAYS: DayRecords[] = [
  {
    dateLabel: "03 June 2025",
    dateISO: "2025-06-03",
    items: [
      {
        id: "june03-vitals",
        type: "Vitals",
        hospital: "Sushila Mathrutva Clinic",
        doctor: { name: "Dr. A. Banerjee", specialty: "Internal Medicine" },
        data: {
          height: "162 cm",
          weight: "64 kg",
          bp: "120/78",
          pulse: "76 bpm",
          spo2: "98%",
          temperature: "37.0 °C",
        },
      },
      {
        id: "june03-rx",
        type: "Prescription",
        hospital: "Sushila Mathrutva Clinic",
        doctor: { name: "Dr. A. Banerjee", specialty: "Internal Medicine" },
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
        id: "june03-immu",
        type: "Immunization",
        hospital: "Sushila Mathrutva Clinic",
        doctor: { name: "Dr. Kavya Rao", specialty: "Family Medicine" },
        data: {
          vaccine: "Tdap",
          lot: "TD-2025-03",
          site: "Left deltoid",
          nextDose: "2026-06-03",
        },
      },
    ],
  },
  {
    dateLabel: "19 Jan 2025",
    dateISO: "2025-01-19",
    items: [
      {
        id: "jan19-lab",
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
];

/* A few nice colors for the date tabs */
const TAB_COLORS = [
  { bg: "#FFFFFF", text: "#ce130cff" },
  { bg: "#FDE68A", text: "#92400E" },
  { bg: "#FBCFE8", text: "#831843" },
  { bg: "#C7D2FE", text: "#3730A3" },
  { bg: "#BBF7D0", text: "#065F46" },
  { bg: "#FEF9C3", text: "#854D0E" },
];

/* ────────────────────────────────────────────────────────────────────────────
   Page
──────────────────────────────────────────────────────────────────────────── */
export default function ConsultationsPage() {
  /* 1) Header top menu */
  const [active, setActive] = useState<TopMenuKey>("consultation");
  const [days, setDays] = useState<DayRecords[]>(PAST_DAYS);

  /* 2) Companion Mode + right form split pane */
  const [companionOn, setCompanionOn] = useState(false);
  const [formOpenSplit, setFormOpenSplit] = useState(false); // when ON + "Form" pressed

  /* 3) Digital Rx inside Tab 0 (paper panel) */
  const [digitalRxOpen, setDigitalRxOpen] = useState(false);

  /* 4) Tabs + current record selection */
  const [tabIndex, setTabIndex] = useState(0); // 0 = current record
  const [selectedItemIdx, setSelectedItemIdx] = useState(0); // for past tabs
  useEffect(() => setSelectedItemIdx(0), [tabIndex]);

  const selectedDay = tabIndex > 0 ? days[tabIndex - 1] : undefined;
  const recordItems = selectedDay?.items || [];
  const currentRecord = recordItems[selectedItemIdx];

  /* 5) Right-side vertical tabs inside a past-day tab (record types) */
  const [rightRecordTab, setRightRecordTab] = useState(0);
  useEffect(() => setRightRecordTab(0), [tabIndex]);

  /* 6) PREVIEW FORM STATE (what the left paper renders) */
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  // Auto-calc BMI in preview state
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
    } else if (form.vitals.bmi) {
      setForm((f) => ({ ...f, vitals: { ...f.vitals, bmi: "" } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vitals.height, form.vitals.weight]);

  /* 7) Sidebar collapse integration (persisted) */
  const applySidebarCollapsed = useCallback((collapsed: boolean) => {
    try {
      localStorage.setItem("aran:sidebarCollapsed", collapsed ? "1" : "0");
      setTimeout(() => window.dispatchEvent(new Event("aran:sidebar")), 0);
    } catch {}
  }, []);

  /* 8) Companion bar actions */
  const toggleCompanion = useCallback(() => {
    setCompanionOn((prev) => {
      const next = !prev;
      setFormOpenSplit(false); // reset
      setDigitalRxOpen(false); // reset
      if (next) {
        applySidebarCollapsed(true);
        setTabIndex(0); // ensure we’re on “+ New Record”
      } else {
        applySidebarCollapsed(false);
      }
      return next;
    });
  }, [applySidebarCollapsed]);

  const openFormSplit = useCallback(() => {
    if (!companionOn) return;
    setDigitalRxOpen(false);
    setFormOpenSplit(true);
    setTabIndex(0);
  }, [companionOn]);

  /* 9) Right toolbar actions */
  const [toast, setToast] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);

  // ------------ onSAve  Starts -----------

  const onSave = useCallback(() => {
    // 1) Do we have anything worth saving?
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
      (r) =>
        r.medicine || r.frequency || r.instruction || r.duration || r.dosage
    );

    if (!hasVitals && !hasClinical && !hasAnyRx) {
      setToast({ type: "info", message: "Nothing to save yet." });
      return;
    }

    // 2) Build DayRecords items
    const items: RecordEntry[] = [];

    if (hasVitals) {
      items.push({
        id: cryptoId(), // helper below
        type: "Vitals",
        hospital: "Sushila Mathrutva Clinic",
        doctor: {
          name: "Dr. A. Banerjee",
          specialty: "Internal Medicine",
          regNo: "KMC/2011/12345",
        },
        data: {
          temperature: form.vitals.temperature,
          bp: form.vitals.bp,
          weight: form.vitals.weight ? `${form.vitals.weight} kg` : undefined,
          height: form.vitals.height ? `${form.vitals.height} cm` : undefined,
          bmi: form.vitals.bmi,
        },
      });
    }

    if (hasClinical) {
      items.push({
        id: cryptoId(),
        type: "ClinicalDetails",
        hospital: "Sushila Mathrutva Clinic",
        doctor: {
          name: "Dr. A. Banerjee",
          specialty: "Internal Medicine",
          regNo: "KMC/2011/12345",
        },
        data: {
          chiefComplaints: form.clinical.chiefComplaints,
          pastHistory: form.clinical.pastHistory,
          familyHistory: form.clinical.familyHistory,
          allergy: form.clinical.allergy,
        },
      });
    }

    if (hasAnyRx) {
      items.push({
        id: cryptoId(),
        type: "Prescription",
        hospital: "Sushila Mathrutva Clinic",
        doctor: {
          name: "Dr. A. Banerjee",
          specialty: "Internal Medicine",
          regNo: "KMC/2011/12345",
        },
        data: {
          medications: form.prescription
            .filter(
              (r) =>
                r.medicine ||
                r.frequency ||
                r.instruction ||
                r.duration ||
                r.dosage
            )
            .map((r) => ({
              name: r.medicine,
              dose: r.frequency, // keeping your table’s “Frequency” as Dose line in read view
              duration: r.duration,
              notes: [r.instruction, r.dosage].filter(Boolean).join(" • "),
            })),
        },
      });
    }

    // 3) Upsert “today” tab
    const todayISO = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const todayLabel = formatDateLabel(new Date()); // e.g., "22 Aug 2025"

    setDays((prev) => {
      const idx = prev.findIndex((d) => d.dateISO === todayISO);
      if (idx === -1) {
        // create a new day at the front
        const next: DayRecords = {
          dateLabel: todayLabel,
          dateISO: todayISO,
          items,
        };
        const updated = [next, ...prev];
        // jump UI to this tab (index 0 is New Record, so +1)
        setTabIndex(1);
        setSelectedItemIdx(0);
        return updated;
      } else {
        // merge items into existing “today”
        const updated = prev.slice();
        const existing = updated[idx];

        // If you want to append:
        const merged: DayRecords = {
          ...existing,
          items: [...existing.items, ...items],
        };

        // If you prefer to replace instead of append, swap the line above with:
        // items: items

        updated[idx] = merged;
        // jump to that tab
        setTabIndex(idx + 1);
        setSelectedItemIdx(0);
        return updated;
      }
    });

    setToast({ type: "success", message: "Saved to today’s record." });
  }, [form]);

  //-------------- onSave Ends --------------

  const onSubmit = useCallback(
    () => setToast({ type: "success", message: "Record submitted." }),
    []
  );
  const onPrint = useCallback(() => window.print(), []);
  const [printOpen, setPrintOpen] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (printOpen && printRef.current && !printRef.current.contains(t))
        setPrintOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [printOpen]);

  const openDigitalRxInPaper = useCallback(() => {
    // Collapse sidebar; no split view; open in Tab 0 area
    applySidebarCollapsed(true);
    setCompanionOn(false);
    setFormOpenSplit(false);
    setTabIndex(0);
    setDigitalRxOpen(true);
  }, [applySidebarCollapsed]);

  /* 10) Patient snapshot */
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

  /* 11) Utility */
  const colorFor = (i: number) => TAB_COLORS[i % TAB_COLORS.length];

  /* 12) DigitalRxForm adapter props (supports both APIs safely) */
  const digitalRxProps = useMemo(
    () =>
      ({
        // “controlled” API (if your component supports it)
        value: form,
        onChange: (next: FormState) => setForm(next),
        // “snapshot” API (if your component emits it)
        onSnapshot: (rx: any) => setForm(rxToForm(rx)),
        // standard actions
        onSave,
        onSubmit,
      } as any), // cast to any so TS doesn’t complain if your component lacks one of them
    [form, onSave, onSubmit]
  );

  /* ──────────────────────────────────────────────────────────────
     Render
  ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-3">
      {/* 1) Header Panel: Top menu + Companion Mode */}
      <div className="ui-card px-3 py-2">
        <div className="flex items-center gap-2">
          <TopMenuButton
            active={active === "consultation"}
            onClick={() => setActive("consultation")}
          >
            Consultation
          </TopMenuButton>
          <TopMenuButton
            active={active === "consent"}
            onClick={() => setActive("consent")}
          >
            Consent
          </TopMenuButton>
          <TopMenuButton
            active={active === "queue"}
            onClick={() => setActive("queue")}
          >
            OPD Queue
          </TopMenuButton>

          {/* Companion Mode cluster (right) */}
          <div className="ml-auto rounded-xl border bg-white shadow-sm px-3 py-1.5">
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-gray-700">
                Companion&nbsp;Mode
              </div>
              <TinySwitch checked={companionOn} onChange={toggleCompanion} />
              <div className="h-5 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <CompanionChip
                  label="Form"
                  disabled={!companionOn}
                  onClick={() => (companionOn ? openFormSplit() : undefined)}
                  icon={
                    <img src="/icons/form.png" alt="" className="w-3.5 h-3.5" />
                  }
                />
                <CompanionChip
                  label="Voice"
                  disabled={!companionOn}
                  onClick={() =>
                    companionOn
                      ? setToast({ type: "info", message: "Voice started." })
                      : undefined
                  }
                  icon={
                    <img src="/icons/mic.png" alt="" className="w-3.5 h-3.5" />
                  }
                />
                <CompanionChip
                  label="Scribe"
                  disabled={!companionOn}
                  onClick={() =>
                    companionOn
                      ? setToast({ type: "info", message: "Scribe listening…" })
                      : undefined
                  }
                  icon={
                    <img
                      src="/icons/scribe.png"
                      alt=""
                      className="w-3.5 h-3.5"
                    />
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT: Paper + (optional) Split Form + Right Sticky Toolbar */}
      <div className="mt-6 px-3 md:px-6 lg:px-8">
        <div
          className={
            "grid gap-4 items-start min-h-[calc(100vh-120px)] " +
            (formOpenSplit
              ? "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_64px]"
              : "grid-cols-1 md:grid-cols-[minmax(0,1fr)_64px]")
          }
        >
          {/* LEFT: Paper (preview / digital rx in-paper) */}
          <div className="min-w-0">
            <div
              className="relative mx-auto bg-white border rounded-xl shadow-sm overflow-visible"
              style={{
                minHeight: 480,
                background: "linear-gradient(180deg, #fff 0%, #fcfcfc 100%)",
              }}
            >
              {/* Tabs rail on top-left */}
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
                      key="new-tab"
                      onClick={() => setTabIndex(0)}
                      aria-pressed={activeTab}
                      className={[
                        "px-4 py-2 text-sm font-semibold border-2 border-red-200 shadow-sm rounded-tr-lg",
                        activeTab
                          ? "ring-2 z-20"
                          : "hover:brightness-[.98] z-0",
                      ].join(" ")}
                      style={{
                        background: col.bg,
                        color: col.text,
                        borderColor: activeTab ? "#1b1a1a" : "#b8b5b5",
                        boxShadow: activeTab
                          ? "0 2px 0 rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)"
                          : undefined,
                        transform: activeTab ? "translateY(-4px)" : undefined,
                        outline: "none",
                      }}
                    >
                      <span className="relative -top-[7px]">+ New Record</span>
                    </button>
                  );
                })()}

                {/* Date tabs */}
                {days.map((d, idx) => {
                  const i = idx + 1;
                  const col = colorFor(i);
                  const activeTab = tabIndex === i;
                  return (
                    <button
                      key={d.dateISO}
                      onClick={() => setTabIndex(i)}
                      aria-pressed={activeTab}
                      title={`Records from ${d.dateLabel}`}
                      className={[
                        "px-4 py-2 text-sm font-semibold border-2 shadow-sm rounded-tr-lg",
                        activeTab
                          ? "ring-2 z-20"
                          : "hover:brightness-[.98] z-0",
                      ].join(" ")}
                      style={{
                        background: col.bg,
                        color: col.text,
                        borderColor: activeTab ? "#1b1a1a" : "#b8b5b5",
                        boxShadow: activeTab
                          ? "0 2px 0 rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)"
                          : undefined,
                        transform: activeTab ? "translateY(-4px)" : undefined,
                        outline: "none",
                      }}
                    >
                      <span className="relative -top-[7px]">{d.dateLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Patient demography header */}
              <div className="relative z-10 p-4 md:p-6">
                <div className="grid grid-cols-[1fr_auto_1fr] items-start">
                  {/* Left: demographics */}
                  <div className="min-w-0 pr-3">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                      <img
                        src="/icons/profile.png"
                        alt=""
                        className="w-4 h-4"
                      />
                      <span>Patient</span>
                    </div>
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

                  {/* Center: logo */}
                  <img
                    src="/icons/logo.png"
                    alt="Logo"
                    className="w-5 h-5 place-self-center"
                  />

                  {/* Right: patient summary icon */}
                  <div className="flex items-start justify-end pl-3">
                    <button
                      className="inline-flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900"
                      title="Open Patient Summary"
                    >
                      <img
                        src="/icons/summary.png"
                        alt=""
                        className="w-4 h-4"
                      />
                      <span className="font-medium">Patient Summary</span>
                    </button>
                  </div>
                </div>

                <div className="my-3 border-t border-gray-200" />

                {/* Paper content */}
                <div className="mt-2">
                  {tabIndex === 0 ? (
                    // TAB 0: current record
                    digitalRxOpen ? (
                      // When Digital Rx toolbar pressed → render DigitalRxForm INSIDE paper
                      <div className="ui-card p-4">
                        <div className="text-sm font-semibold mb-2">
                          Digital Rx
                        </div>
                        <DigitalRxForm {...digitalRxProps} />
                      </div>
                    ) : (
                      // Otherwise show BLANK PREVIEW WINDOW that will fill live when in split form
                      <div className="ui-card p-4 text-sm text-gray-800 space-y-6 min-h-[320px]">
                        <NewRecordPreview form={form} />
                      </div>
                    )
                  ) : (
                    // TAB ≥ 1: past records with vertical record-type tabs on the right
                    <div className="ui-card p-3 md:p-4">
                      {selectedDay && selectedDay.items.length > 0 ? (
                        <div className="grid md:grid-cols-[minmax(0,1fr)_200px] gap-4">
                          {/* Record content (left) */}
                          <div>
                            <PastRecordTitle
                              rec={recordItems[rightRecordTab]}
                            />
                            <div className="mt-2 border rounded-lg p-3">
                              <RecordRenderer
                                record={recordItems[rightRecordTab]}
                              />
                            </div>
                          </div>

                          {/* Right vertical tabs (one below another) */}
                          <div className="flex flex-col gap-2">
                            {recordItems.map((r, i) => (
                              <button
                                key={r.id}
                                onClick={() => setRightRecordTab(i)}
                                className={[
                                  "w-full text-left px-3 py-2 rounded-md border text-sm",
                                  rightRecordTab === i
                                    ? "bg-gray-100 border-gray-400"
                                    : "bg-white hover:bg-gray-50 border-gray-300",
                                ].join(" ")}
                              >
                                {r.type}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No records found for this day.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Split Form (only when Companion ON and "Form" clicked) */}
          {formOpenSplit && (
            <div className="min-w-0">
              <div className="ui-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Consultation Form</h3>
                  <button
                    className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    onClick={() => setFormOpenSplit(false)}
                    title="Close form"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-3">
                  {/* The adapter props mean this works with either API */}
                  <DigitalRxForm {...digitalRxProps} />
                </div>
              </div>
            </div>
          )}

          {/* RIGHT STICKY TOOLBAR (Group A + Group B) */}
          <div className="sticky top-4 flex flex-col items-center gap-2 self-start">
            {/* Group A */}
            <div className="flex flex-col items-center gap-3 mt-4">
              <ToolBtn
                title="Digital Rx"
                onClick={openDigitalRxInPaper}
                className={
                  digitalRxOpen
                    ? "ring-2 ring-green-300 border-green-600"
                    : "border-green-600"
                }
                icon="/icons/digitalrx.png"
              />
              <ToolBtn
                title="Immunization"
                onClick={() =>
                  setToast({ type: "info", message: "Immunization form TBD" })
                }
                className="border-amber-300"
                icon="/icons/syringe.png"
              />
              <ToolBtn
                title="Discharge Summary"
                onClick={() =>
                  setToast({ type: "info", message: "Discharge Summary TBD" })
                }
                className="border-pink-300"
                icon="/icons/discharge-summary.png"
              />
              <ToolBtn
                title="Lab Request"
                onClick={() =>
                  setToast({ type: "info", message: "Lab Request TBD" })
                }
                className="border-blue-300"
                icon="/icons/lab-request.png"
              />
            </div>

            <div className="my-6 h-px w-8 bg-gray-300" />

            {/* Group B */}
            <div className="flex flex-col items-center gap-3 mb-4 mt-4">
              <ToolBtn
                title="Save"
                onClick={onSave}
                className="border-sky-300"
                icon="/icons/save.png"
              />
              <ToolBtn
                title="Send"
                onClick={() => setToast({ type: "success", message: "Sent." })}
                icon="/icons/send.png"
              />
              <div className="relative" ref={printRef}>
                <ToolBtn
                  title="Print"
                  onClick={() => setPrintOpen((s) => !s)}
                  className="border-red-300"
                  icon="/icons/print.png"
                />
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
              <ToolBtn
                title="Language"
                onClick={() =>
                  setToast({ type: "info", message: "Language options TBD" })
                }
                className="border-yellow-300"
                icon="/icons/language.png"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toast (tiny) */}
      {toast && (
        <Toast type={toast.type} onClose={() => setToast(null)}>
          {toast.message}
        </Toast>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   UI helpers
──────────────────────────────────────────────────────────────────────────── */

function TopMenuButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={[
        "px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition",
        active
          ? "bg-gray-200 text-gray-900"
          : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
    >
      <span className="inline-flex items-center">{children}</span>
    </button>
  );
}

function TinySwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={[
        "relative inline-flex items-center transition-colors",
        checked ? "bg-emerald-600" : "bg-gray-300",
        "h-[18px] w-[34px] rounded-full",
      ].join(" ")}
      title={checked ? "Turn Companion OFF" : "Turn Companion ON"}
    >
      <span
        className={[
          "absolute top-1/2 -translate-y-1/2 transition-transform h-[14px] w-[14px] rounded-full bg-white shadow",
          checked ? "translate-x-[18px]" : "translate-x-[4px]",
        ].join(" ")}
      />
    </button>
  );
}

function CompanionChip({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
        disabled
          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          : "bg-white hover:bg-gray-50 text-gray-800 border-gray-300",
      ].join(" ")}
      title={label}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function ToolBtn({
  title,
  icon,
  onClick,
  className = "",
}: {
  title: string;
  icon: string; // path in /public/icons/*.png
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={[
        "w-9 h-9 flex items-center justify-center rounded-md border hover:bg-gray-50",
        className,
      ].join(" ")}
    >
      <img src={icon} alt={title} className="w-5 h-5" />
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   New Record Live Preview (blank panel content)
──────────────────────────────────────────────────────────────────────────── */
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
        (Start typing in the form…)
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

/* Helpers for preview tables/labels */
function fmt(v?: string, unit?: string) {
  if (!v) return "";
  return unit ? `${v} ${unit}` : v;
}
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

/* Past-record header */
function PastRecordTitle({ rec }: { rec?: RecordEntry }) {
  if (!rec) return null;
  const { type, hospital, doctor } = rec;
  return (
    <div className="text-sm">
      <span className="font-semibold">{type}</span>
      <span className="text-gray-500"> • {hospital}</span>
      <span className="text-gray-500">
        {" "}
        • {doctor.name}
        {doctor.specialty ? ` (${doctor.specialty})` : ""}
        {doctor.regNo ? ` • Reg: ${doctor.regNo}` : ""}
      </span>
    </div>
  );
}
//------------- onSave helpers ---------
function cryptoId() {
  // small id helper for keys
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
function formatDateLabel(d: Date) {
  // "22 Aug 2025" (matches your style)
  const day = d.getDate().toString().padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/* Render a single past record type */
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
          <KV label="Temperature" value={record.data.temperature} />
        </div>
      );

    case "ClinicalDetails":
      return (
        <div className="grid gap-1 text-sm text-gray-800">
          <KV label="Chief Complaints" value={record.data.chiefComplaints} />
          <KV label="Past Medical History" value={record.data.pastHistory} />
          <KV label="Family History" value={record.data.familyHistory} />
          <KV label="Allergy" value={record.data.allergy} />
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

/* Toast */
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
