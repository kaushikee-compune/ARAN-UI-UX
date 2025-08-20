"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */
type TopMenuKey = "consultation" | "consent" | "queue";
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
    weight?: string;
    height?: string;
    bmi?: string;
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
    followUpDate?: string;
  };
};

/* ------------------------------------------------------------
   Mock Past Tabs (datewise records)
------------------------------------------------------------ */
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
];

/* Pretty tab colors */
const TAB_COLORS = [
  { bg: "#E0F2FE", text: "#0C4A6E" },
  { bg: "#FDE68A", text: "#92400E" },
  { bg: "#FBCFE8", text: "#831843" },
  { bg: "#C7D2FE", text: "#3730A3" },
  { bg: "#BBF7D0", text: "#065F46" },
  { bg: "#FEF9C3", text: "#854D0E" },
];

/* ------------------------------------------------------------
   Page
------------------------------------------------------------ */
export default function ConsultationsPage() {
  /* ------------ Patient snapshot ------------ */
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

  /* ------------ Top menu ------------ */
  const [active, setActive] = useState<TopMenuKey>("consultation");

  /* ------------ Tabs & selection ------------ */
  const [tabIndex, setTabIndex] = useState(0); // 0 = New Record (live preview)
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  useEffect(() => setSelectedItemIdx(0), [tabIndex]);
  const selectedDay = tabIndex > 0 ? PAST_DAYS[tabIndex - 1] : undefined;
  const currentRecord = selectedDay?.items[selectedItemIdx];
  const colorFor = (i: number) => TAB_COLORS[i % TAB_COLORS.length];

  /* ------------ Form state ------------ */
  const [form, setForm] = useState<FormState>({
    vitals: {},
    clinical: {},
    prescription: [
      {
        medicine: "",
        frequency: "",
        instruction: "",
        duration: "",
        dosage: "",
      },
    ],
    plan: {},
  });

  // BMI auto-calc
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

  /* ------------ Companion Mode + Sidebar collapse ------------ */
  const [companionOn, setCompanionOn] = useState(false);
  const [formOpenSplit, setFormOpenSplit] = useState(false); // RIGHT column form
  const [formInline, setFormInline] = useState(false); // form inside the paper

  // On mount, sync with persisted sidebar state
  useEffect(() => {
    try {
      const collapsed = localStorage.getItem("aran:sidebarCollapsed") === "1";
      if (collapsed) {
        // If user arrives with collapsed sidebar, assume Companion was ON
        setCompanionOn(true);
        setFormOpenSplit(true); // split open
        setFormInline(false);
        setTabIndex(0);
      }
    } catch {}
  }, []);

  const applySidebarCollapsed = useCallback((collapsed: boolean) => {
    try {
      localStorage.setItem("aran:sidebarCollapsed", collapsed ? "1" : "0");
      // Defer the event so DoctorLayout updates in a later task, not during this render
      setTimeout(() => {
        window.dispatchEvent(new Event("aran:sidebar"));
      }, 0);
    } catch {}
  }, []);

  const toggleCompanion = useCallback(() => {
    setCompanionOn((prev) => {
      const next = !prev;
      if (next) {
        // Companion ON → split view; ensure "New Record" tab
        setFormOpenSplit(true);
        setFormInline(false);
        setTabIndex(0);
      } else {
        // Companion OFF → close split
        setFormOpenSplit(false);
      }
      return next;
    });
  }, []);

  /* ------------ Right mini-dock popovers & actions ------------ */
  const [toast, setToast] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);
  const show = (t: typeof toast) => setToast(t);
  const onSave = useCallback(
    () => show({ type: "info", message: "Draft saved." }),
    []
  );
  const onSubmit = useCallback(
    () => show({ type: "success", message: "Record submitted." }),
    []
  );
  const [printOpen, setPrintOpen] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  const onPrint = useCallback(() => window.print(), []);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (printOpen && printRef.current && !printRef.current.contains(t))
        setPrintOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [printOpen]);

  /* ------------ Open form (from top chips or dock) ------------ */
  const openForm = useCallback(() => {
    // Always collapse sidebar when entering a form flow
    applySidebarCollapsed(true);
    // Inline vs Split depends on Companion switch
    if (companionOn) {
      setFormOpenSplit(true);
      setFormInline(false);
      setTabIndex(0);
    } else {
      setFormInline(true);
      setFormOpenSplit(false);
      setTabIndex(0);
    }
  }, [applySidebarCollapsed, companionOn]);

  useEffect(() => {
    applySidebarCollapsed(companionOn);
  }, [companionOn, applySidebarCollapsed]);

  /* ------------ Render ------------ */
  return (
    <div className="space-y-3">
      {/* ===== Top bar: Menu + Companion panel ===== */}
      <div className="ui-card px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Left: trimmed menu with tiny PNG icons */}
          <TopMenuButton
            active={active === "consultation"}
            onClick={() => setActive("consultation")}
          >
            <img
              src="/icons/consultation.png"
              className="w-4 h-4 mr-1.5"
              alt=""
            />
            Consultation
          </TopMenuButton>
          <TopMenuButton
            active={active === "consent"}
            onClick={() => setActive("consent")}
          >
            <img src="/icons/consent.png" className="w-4 h-4 mr-1.5" alt="" />
            Consent
          </TopMenuButton>
          <TopMenuButton
            active={active === "queue"}
            onClick={() => setActive("queue")}
          >
            <img src="/icons/queue.png" className="w-4 h-4 mr-1.5" alt="" />
            OPD Queue
          </TopMenuButton>

          {/* Right: Companion Mode panel */}
          <div className="ml-auto rounded-xl border bg-white shadow-sm px-3 py-1.5">
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-gray-700">
                Companion&nbsp;Mode
              </div>
              <TinySwitch checked={companionOn} onChange={toggleCompanion} />
              <div className="h-5 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                {/* Enabled only when companionOn */}
                <CompanionChip
                  label="Voice"
                  disabled={!companionOn}
                  onClick={() =>
                    companionOn &&
                    show({ type: "info", message: "Voice started." })
                  }
                >
                  <MicIcon className="w-3.5 h-3.5" />
                </CompanionChip>
                <CompanionChip
                  label="Scribe"
                  disabled={!companionOn}
                  onClick={() =>
                    companionOn &&
                    show({ type: "info", message: "Scribe listening…" })
                  }
                >
                  <ScribeIcon className="w-3.5 h-3.5" />
                </CompanionChip>
                <CompanionChip
                  label="Form"
                  disabled={!companionOn}
                  onClick={() => companionOn && openForm()}
                >
                  <FormIcon className="w-3.5 h-3.5" />
                </CompanionChip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Main grid: Paper + (optional) split Form + right dock ===== */}
      <div className="mt-6 px-3 md:px-6 lg:px-8">
        <div
          className={
            "grid gap-4 items-start " +
            (formOpenSplit
              ? "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_64px]"
              : "grid-cols-1 md:grid-cols-[minmax(0,1fr)_64px]")
          }
        >
          {/* ---------- PAPER (left) ---------- */}
          <div className="min-w-0">
            <div
              className="relative mx-auto bg-white border rounded-xl shadow-sm overflow-visible"
              style={{
                minHeight: 450,
                background: "linear-gradient(180deg, #fff 0%, #fcfcfc 100%)",
              }}
            >
              {/* Tabs rail */}
              <div
                className="absolute left-4 -top-5 flex flex-wrap gap-2 z-0"
                aria-label="Health record tabs"
              >
                {/* New record tab */}
                {(() => {
                  const col = colorFor(0);
                  const activeTab = tabIndex === 0;
                  return (
                    <button
                      key="new-tab"
                      onClick={() => setTabIndex(0)}
                      aria-pressed={activeTab}
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
                      <span className="relative -top-[7px]">+ New Record</span>
                    </button>
                  );
                })()}

                {/* Date tabs */}
                {PAST_DAYS.map((d, idx) => {
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

              {/* Cover band */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-xl z-10"
                style={{
                  background: "linear-gradient(180deg, #fff 0%, #fcfcfc 100%)",
                }}
                aria-hidden
              />

              {/* Paper body */}
              <div className="relative z-10 p-4 md:p-6">
                {/* Header row: patient & logo */}
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

                  {/* Center: Logo */}
                  <Image
                    src="/whitelogo.png"
                    alt="ARAN Logo"
                    width={40}
                    height={40}
                  />

                  {/* Right: Patient summary placeholder */}
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

                {/* ------- Tab content ------- */}
                <div className="mt-2">
                  {tabIndex === 0 ? (
                    // New Record: either live preview (default) OR inline form (when companion OFF and user clicked Form)
                    formInline ? (
                      <div className="ui-card p-4">
                        <FormBlock
                          form={form}
                          setForm={setForm}
                          onSave={() =>
                            setToast({ type: "info", message: "Draft saved." })
                          }
                          onSubmit={() =>
                            setToast({
                              type: "success",
                              message: "Record submitted.",
                            })
                          }
                        />
                      </div>
                    ) : (
                      <div className="ui-card p-4 text-sm text-gray-800 space-y-6">
                        <NewRecordPreview form={form} />
                      </div>
                    )
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
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md border bg-white hover:bg-gray-50"
                              disabled={selectedItemIdx <= 0}
                              onClick={() =>
                                setSelectedItemIdx((i) => Math.max(0, i - 1))
                              }
                              title="Previous record"
                              aria-label="Previous record"
                            >
                              <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            <div className="text-xs text-gray-500">
                              {selectedItemIdx + 1} /{" "}
                              {selectedDay?.items.length || 0}
                            </div>
                            <button
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md border bg-white hover:bg-gray-50"
                              disabled={
                                !selectedDay ||
                                selectedItemIdx >= selectedDay.items.length - 1
                              }
                              onClick={() =>
                                setSelectedItemIdx((i) =>
                                  selectedDay
                                    ? Math.min(
                                        selectedDay.items.length - 1,
                                        i + 1
                                      )
                                    : i
                                )
                              }
                              title="Next record"
                              aria-label="Next record"
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

          {/* ---------- SPLIT FORM (right column) when companion ON ---------- */}
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
                  <FormBlock
                    form={form}
                    setForm={setForm}
                    onSave={onSave}
                    onSubmit={onSubmit}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---------- RIGHT MINI-DOCK ToolBar ---------- */}
          {/* Side Toolbar Panel */}
          <div className="flex flex-col justify-between h-full w-14 border-r bg-gray-50">
            {/* --- Top group: Forms --- */}
            <div className="flex flex-col items-center gap-3 mt-4">
              <button
                title="Digital Rx"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <img
                  src="/icons/digitalrx.png"
                  alt="Digital Rx"
                  className="w-5 h-5"
                />
              </button>
              <button
                title="Immunization"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <img
                  src="/icons/syringe.png"
                  alt="Immunization"
                  className="w-5 h-5"
                />
              </button>
              <button
                title="Lab Request"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <img
                  src="/icons/lab-request.png"
                  alt="Lab Request"
                  className="w-5 h-5"
                />
              </button>
              <button
                title="Discharge Summary"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <img
                  src="/icons/discharge-summary.png"
                  alt="Discharge Summary"
                  className="w-5 h-5"
                />
              </button>
            </div>

            {/* --- Bottom group: Actions --- */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <button
                title="Save"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <img src="/icons/save.png" alt="Save" className="w-5 h-5" />
              </button>
              <button
                title="Send"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <img src="/icons/send.png" alt="Send" className="w-5 h-5" />
              </button>
              <button
                title="Print"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <img src="/icons/print.png" alt="Print" className="w-5 h-5" />
              </button>
              <button
                title="Language"
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <img
                  src="/icons/language.png"
                  alt="Language"
                  className="w-5 h-5"
                />
              </button>
            </div>
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
}

/* ------------------------------------------------------------
   Reusable: Top menu button, Companion chip, Tiny switch, Dock
------------------------------------------------------------ */
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
        active ? "bg-gray-900 text-white" : "hover:bg-gray-100",
      ].join(" ")}
    >
      <span className="inline-flex items-center">{children}</span>
    </button>
  );
}

function CompanionChip({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
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
      {children}
      <span className="font-medium">{label}</span>
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

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
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

/* ------------------------------------------------------------
   Form (reusable block used inline and in split)
------------------------------------------------------------ */
function FormBlock({
  form,
  setForm,
  onSave,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSave: () => void;
  onSubmit: () => void;
}) {
  const updateRx = (
    idx: number,
    patch: Partial<FormState["prescription"][number]>
  ) => {
    setForm((f) => {
      const next = f.prescription.slice();
      next[idx] = { ...next[idx], ...patch };
      return { ...f, prescription: next };
    });
  };

  return (
    <div className="grid gap-4">
      {/* 1) Vitals */}
      <section>
        <div className="text-xs font-medium text-gray-600 mb-2">Vitals</div>
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
              setForm((f) => ({ ...f, vitals: { ...f.vitals, bp: v } }))
            }
          />
          <LabeledInput
            label="Weight (kg)"
            type="number"
            value={form.vitals.weight || ""}
            onChange={(v) =>
              setForm((f) => ({ ...f, vitals: { ...f.vitals, weight: v } }))
            }
          />
          <LabeledInput
            label="Height (cm)"
            type="number"
            value={form.vitals.height || ""}
            onChange={(v) =>
              setForm((f) => ({ ...f, vitals: { ...f.vitals, height: v } }))
            }
          />
          <LabeledInput label="BMI" value={form.vitals.bmi || ""} readOnly />
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

      {/* 3) Prescription */}
      <section>
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-600">Prescription</div>
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
                      value={row.frequency}
                      onChange={(e) =>
                        updateRx(idx, { frequency: e.target.value })
                      }
                      placeholder="1-0-1"
                    />
                  </Td>
                  <Td>
                    <input
                      className="ui-input w-full"
                      value={row.instruction}
                      onChange={(e) =>
                        updateRx(idx, { instruction: e.target.value })
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
              setForm((f) => ({ ...f, plan: { ...f.plan, investigations: v } }))
            }
          />
          <LabeledTextarea
            label="Note"
            value={form.plan.note || ""}
            onChange={(v) =>
              setForm((f) => ({ ...f, plan: { ...f.plan, note: v } }))
            }
          />
          <LabeledTextarea
            label="Advice"
            value={form.plan.advice || ""}
            onChange={(v) =>
              setForm((f) => ({ ...f, plan: { ...f.plan, advice: v } }))
            }
          />
          <LabeledTextarea
            label="Doctor Note"
            value={form.plan.doctorNote || ""}
            onChange={(v) =>
              setForm((f) => ({ ...f, plan: { ...f.plan, doctorNote: v } }))
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
                    plan: { ...f.plan, followUpDate: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
  );
}

/* ------------------------------------------------------------
   Paper: New Record live preview (when inline form not shown)
------------------------------------------------------------ */
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

function fmt(v?: string, unit?: string) {
  if (!v) return "";
  return unit ? `${v} ${unit}` : v;
}

/* ------------------------------------------------------------
   Past Record Renderer
------------------------------------------------------------ */
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

/* ------------------------------------------------------------
   Little UI helpers
------------------------------------------------------------ */
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

/* ------------------------------------------------------------
   Inline icons (simple SVGs to avoid extra deps)
------------------------------------------------------------ */
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
function SaveIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
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
      strokeWidth={1.5}
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
      strokeWidth={1.5}
    >
      <path d="M6 9V3h12v6" />
      <rect x="6" y="13" width="12" height="8" rx="1.5" />
      <path d="M6 13H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}
