// app/doctor/patients/page.tsx
"use client";

/**
 * ARAN • Doctor → Patients
 * - Right dock is a slim toolbar (64px).
 * - Language = icon button → floating selection window.
 * - Save/Submit = tiny icon buttons (blue/green).
 * - Print = icon button → floating panel.
 * - Health-record paper widens only within its column (never overlaps the dock).
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";

// --------------------------- Types ---------------------------
type TopMenuKey = "consultation" | "lab" | "immunization" | "discharge" | "consent";
type HealthRecordType = "Vitals" | "Prescription" | "Immunization" | "Lab" | "DischargeSummary";

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

// --------------------------- Mock Data ---------------------------
const PAST_DAYS: DayRecords[] = [
  {
    dateLabel: "02 Feb 2025",
    dateISO: "2025-02-02",
    items: [
      {
        id: "d1-r1",
        type: "Vitals",
        hospital: "Sushila Mathrutva Clinic",
        doctor: { name: "Dr. A. Banerjee", specialty: "Internal Medicine", regNo: "KMC/2011/12345" },
        data: { height: "162 cm", weight: "64 kg", bp: "120/78", pulse: "76 bpm", spo2: "98%" },
      },
      {
        id: "d1-r2",
        type: "Prescription",
        hospital: "Sushila Mathrutva Clinic",
        doctor: { name: "Dr. A. Banerjee", specialty: "Internal Medicine", regNo: "KMC/2011/12345" },
        data: {
          medications: [
            { name: "Paracetamol 500 mg", dose: "1-0-1", duration: "5 days", notes: "After food" },
            { name: "Cetirizine 10 mg", dose: "0-0-1", duration: "5 days", notes: "Night" },
          ],
          advice: "Hydration, rest",
        },
      },
      {
        id: "d1-r3",
        type: "Immunization",
        hospital: "Sushila Mathrutva Clinic",
        doctor: { name: "Dr. A. Banerjee", specialty: "Internal Medicine", regNo: "KMC/2011/12345" },
        data: { vaccine: "Tdap", lot: "TD-8821", site: "Left deltoid", nextDose: "After 10 years" },
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
        doctor: { name: "Dr. A. Banerjee", specialty: "Internal Medicine", regNo: "KMC/2011/12345" },
        data: {
          medications: [{ name: "Vitamin D3 60k IU", dose: "1/week", duration: "8 weeks", notes: "" }],
          advice: "Sun exposure 20 mins/day",
        },
      },
    ],
  },
];

// --------------------------- Tab Colors ---------------------------
const TAB_COLORS = [
  { bg: "#E0F2FE", text: "#0C4A6E" }, // Sky
  { bg: "#FDE68A", text: "#92400E" }, // Amber
  { bg: "#FBCFE8", text: "#831843" }, // Pink
  { bg: "#C7D2FE", text: "#3730A3" }, // Indigo
  { bg: "#BBF7D0", text: "#065F46" }, // Green
  { bg: "#FEF9C3", text: "#854D0E" }, // Yellow
  { bg: "#E9D5FF", text: "#6B21A8" }, // Purple
];

// --------------------------- Page ----------------------------
export default function PatientsPage() {
  // Language
  const [lang, setLang] = useState("English");
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);

  // Print
  const [printOpen, setPrintOpen] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  const onPrint = useCallback(() => window.print(), []);

  // Close popovers on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (langOpen && langRef.current && !langRef.current.contains(t)) setLangOpen(false);
      if (printOpen && printRef.current && !printRef.current.contains(t)) setPrintOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [langOpen, printOpen]);

  // Top menu
  const [active, setActive] = useState<TopMenuKey>("consultation");

  // Sidebar toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem("aran:sidebarCollapsed") === "1");
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

  // Tabs: 0 = New Record, 1.. = PAST_DAYS[i-1]
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  useEffect(() => setSelectedItemIdx(0), [tabIndex]);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);
  const show = (t: typeof toast) => setToast(t);
  const onSave = useCallback(() => show({ type: "info", message: "Draft saved." }), []);
  const onSubmit = useCallback(() => show({ type: "success", message: "Record submitted." }), []);

  // Current day/record
  const selectedDay = tabIndex > 0 ? PAST_DAYS[tabIndex - 1] : undefined;
  const currentRecord = selectedDay?.items[selectedItemIdx];
  const canGoLeft = !!selectedDay && selectedItemIdx > 0;
  const canGoRight = !!selectedDay && selectedItemIdx < selectedDay.items.length - 1;
  const goLeft = () => canGoLeft && setSelectedItemIdx((i) => i - 1);
  const goRight = () => canGoRight && setSelectedItemIdx((i) => i + 1);

  const colorFor = (i: number) => TAB_COLORS[i % TAB_COLORS.length];

  return (
    <div className="space-y-3">
      {/* 1) Horizontal Menu + Sidebar Toggle */}
      <div className="ui-card px-3 py-2">
        <div className="flex items-center gap-2">
          <TopMenuButton active={active === "consultation"} onClick={() => setActive("consultation")} label="Consultation" />
          <TopMenuButton active={active === "lab"} onClick={() => setActive("lab")} label="Lab Request" />
          <TopMenuButton active={active === "immunization"} onClick={() => setActive("immunization")} label="Immunization Record" />
          <TopMenuButton active={active === "discharge"} onClick={() => setActive("discharge")} label="Discharge Summary" />
          <TopMenuButton active={active === "consent"} onClick={() => setActive("consent")} label="Consent" />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600">Write Record</span>
            <Switch checked={sidebarCollapsed} onChange={toggleSidebar} />
          </div>
        </div>
      </div>

      {/* 2) Health-record Pane + Slim Right Dock */}
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_64px] gap-4 items-start">
          {/* LEFT: Paper panel (health record canvas) */}
          <div>
            <div
              className="relative mx-auto bg-white border rounded-xl shadow-sm overflow-visible"
              style={{
                // widen only the PAPER, never into the dock column
                maxWidth: sidebarCollapsed ? 1220 : 1100,
                minHeight: 700,
                background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,252,1) 100%)",
              }}
            >
              {/* ------- Tabs rail (behind panel by default) ------- */}
              <div className="absolute left-4 -top-5 flex flex-wrap gap-2 z-0" aria-label="Health record tabs">
                {/* Tab 0: New Record */}
                {(() => {
                  const col = colorFor(0);
                  const activeTab = tabIndex === 0;
                  return (
                    <button
                      key="new-record"
                      onClick={() => setTabIndex(0)}
                      aria-pressed={activeTab}
                      className={["px-4 py-2 text-sm font-semibold border-2 shadow-sm rounded-tl-none rounded-tr-lg", activeTab ? "ring-2 z-20" : "hover:brightness-[.98] z-0"].join(" ")}
                      style={{
                        background: col.bg,
                        color: col.text,
                        borderColor: activeTab ? "#1b1a1aff" : "#b8b5b5ff",
                        boxShadow: activeTab ? "0 2px 0 rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)" : undefined,
                        transform: activeTab ? "translateY(-4px)" : undefined,
                        outline: "none",
                      }}
                    >
                      <span className="relative -top-[7px] ">+ New Record</span>
                    </button>
                  );
                })()}

                {/* Date tabs */}
                {PAST_DAYS.map((d, idx) => {
                  const i = idx + 1;
                  const activeTab = tabIndex === i;
                  const col = colorFor(i);
                  return (
                    <button
                      key={d.dateISO}
                      onClick={() => setTabIndex(i)}
                      aria-pressed={activeTab}
                      title={`Records from ${d.dateLabel}`}
                      className={["px-4 py-2 text-sm font-semibold border-2 shadow-sm rounded-tl-none rounded-tr-lg", activeTab ? "ring-2 z-20" : "hover:brightness-[.98] z-0"].join(" ")}
                      style={{
                        background: col.bg,
                        color: col.text,
                        borderColor: activeTab ? "#1b1a1aff" : "#b8b5b5ff",
                        boxShadow: activeTab ? "0 2px 0 rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)" : undefined,
                        transform: activeTab ? "translateY(-4px)" : undefined,
                        outline: "none",
                      }}
                    >
                      <span className="relative -top-[7px] ">{d.dateLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Top cover band so inactive tabs sit behind */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-xl z-10"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,252,1) 100%)" }}
                aria-hidden
              />

              {/* Paper inner padding (content sits above cover band) */}
              <div className="relative z-10 p-4 md:p-6">
                {/* Header row inside paper */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-start">
                  {/* Left: Patient demographics */}
                  <div className="min-w-0 pr-3">
                    <div className="text-xs text-gray-500 mb-1">Patient</div>
                    <div className="text-sm font-semibold">{patient.name}</div>
                    <div className="text-xs text-gray-700 mt-0.5">{patient.gender} • {patient.age}</div>
                    <div className="text-xs text-gray-600 mt-1">ABHA No: {patient.abhaNumber}</div>
                    <div className="text-xs text-gray-600">ABHA Address: {patient.abhaAddress}</div>
                  </div>

                  {/* Center: Logo */}
                  <Image src="/whitelogo.png" alt="ARAN Logo" width={40} height={40} />

                  {/* Right: Patient Summary */}
                  <div className="flex items-start justify-end pl-3">
                    <button className="inline-flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900" title="Open Patient Summary">
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
                    <div className="ui-card p-6 text-sm text-gray-700">
                      <div className="min-h-[320px] grid place-items-center text-gray-400">
                        (Your new record form goes here…)
                      </div>
                    </div>
                  ) : (
                    <>
                      {currentRecord ? (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="text-sm">
                            <span className="font-semibold">{currentRecord.type}</span>
                            <span className="text-gray-500"> • {currentRecord.hospital}</span>
                            <span className="text-gray-500">
                              {" "}• {currentRecord.doctor.name}
                              {currentRecord.doctor.specialty ? ` (${currentRecord.doctor.specialty})` : ""}
                              {currentRecord.doctor.regNo ? ` • Reg: ${currentRecord.doctor.regNo}` : ""}
                            </span>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={goLeft}
                              disabled={!canGoLeft}
                              className={["inline-flex items-center justify-center w-8 h-8 rounded-md border",
                                canGoLeft ? "bg-white hover:bg-gray-50" : "bg-gray-50 opacity-50 cursor-not-allowed"].join(" ")}
                              aria-label="Previous record" title="Previous record"
                            >
                              <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            <div className="text-xs text-gray-500">{selectedItemIdx + 1} / {selectedDay?.items.length || 0}</div>
                            <button
                              type="button"
                              onClick={goRight}
                              disabled={!canGoRight}
                              className={["inline-flex items-center justify-center w-8 h-8 rounded-md border",
                                canGoRight ? "bg-white hover:bg-gray-50" : "bg-gray-50 opacity-50 cursor-not-allowed"].join(" ")}
                              aria-label="Next record" title="Next record"
                            >
                              <ChevronRightIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No records found for this day.</div>
                      )}

                      <div className="mt-3 ui-card p-4">
                        {currentRecord ? <RecordRenderer record={currentRecord} /> : <div className="text-sm text-gray-500">—</div>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Slim outside dock (vertical tools + compact action icons) */}
          <aside className="hidden md:block sticky top-20 self-start w-[64px]">
            <div className="flex flex-col items-center gap-2">
              {/* Vertical tool buttons */}
              <ToolButton label="Voice"><MicIcon className="w-4 h-4" /></ToolButton>
              <ToolButton label="Form"><FormIcon className="w-4 h-4" /></ToolButton>
              <ToolButton label="Scribe"><ScribeIcon className="w-4 h-4" /></ToolButton>

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
                    <div className="px-1 pb-1 text-[11px] text-gray-600">Select language</div>
                    <ul className="max-h-48 overflow-auto text-sm">
                      {["English", "Hindi", "Bengali", "Kannada", "Tamil", "Telugu"].map((opt) => (
                        <li key={opt}>
                          <button
                            className={[
                              "w-full text-left px-2 py-1 rounded-md hover:bg-gray-100",
                              opt === lang ? "font-medium" : "",
                            ].join(" ")}
                            onClick={() => {
                              setLang(opt);
                              setLangOpen(false);
                              show({ type: "info", message: `Language: ${opt}` });
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
              <IconBtn label="Save" tone="info" onClick={() => show({ type: "info", message: "Draft saved." })}>
                <SaveIcon className="w-4 h-4" />
              </IconBtn>

              {/* Submit (tiny, green) */}
              <IconBtn label="Submit" tone="success" onClick={() => show({ type: "success", message: "Record submitted." })}>
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
                    <div className="px-1 pb-1 text-[11px] text-gray-600">Print options</div>
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
}

// ------------------------- Record Renderer -------------------------
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
                  <Th>Medicine</Th><Th>Dose</Th><Th>Duration</Th><Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {(record.data.medications || []).map((m: any, i: number) => (
                  <tr key={i} className="border-t">
                    <Td>{m.name}</Td><Td>{m.dose}</Td><Td>{m.duration}</Td><Td>{m.notes || "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {record.data.advice ? (
            <div className="text-gray-700"><span className="font-medium">Advice: </span>{record.data.advice}</div>
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
            <span className="font-medium">Comment: </span>{record.data.comment}
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
      return <div className="text-sm text-gray-500">No renderer for {record.type}.</div>;
  }
}

function KV({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-500 w-36">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-2 py-1.5 text-left text-gray-700 border">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1.5 text-gray-900">{children}</td>;
}

// ------------------------- Small UI pieces -------------------------
function TopMenuButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={["px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition", active ? "bg-gray-900 text-white" : "hover:bg-gray-100"].join(" ")}
    >
      {label}
    </button>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
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

/** Neutral tool button with tooltip */
function ToolButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button className="group relative inline-flex items-center justify-center w-9 h-9 rounded-full border bg-white shadow hover:bg-gray-50" title={label} aria-label={label}>
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </button>
  );
}

/** Tiny colored icon button (info/success/neutral) with tooltip */
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
      className={["group relative inline-flex items-center justify-center w-9 h-9 rounded-full border shadow", styles].join(" ")}
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

// --------------------------- Icons (inline, no deps) ---------------------------
function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 19v2" />
    </svg>
  );
}
function FormIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
function ScribeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="M4 20h12l4-4V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16Z" />
      <path d="M14 2v6h6" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  );
}
function SummaryIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
function ChevronLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function ChevronRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function PenIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="green" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
function LanguagesIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18" />
    </svg>
  );
}
function SaveIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4z" />
      <path d="M16 22V13H8v9" />
      <path d="M8 4v5h6" />
    </svg>
  );
}
function TickIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function PrinterIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 9V3h12v6" />
      <rect x="6" y="13" width="12" height="8" rx="1.5" />
      <path d="M6 13H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

// --------------------------- Helpers ---------------------------
type TabKey = TopMenuKey;
function labelFor(key: TabKey) {
  switch (key) {
    case "consultation":
      return "Consultation";
    case "lab":
      return "Lab Request";
    case "immunization":
      return "Immunization Record";
    case "discharge":
      return "Discharge Summary";
    case "consent":
      return "Consent";
  }
}

// Simple toast
function Toast({ type, children, onClose }: { type: "success" | "error" | "info"; children: React.ReactNode; onClose: () => void }) {
  const color = type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#2563eb";
  useEffect(() => {
    const t = setTimeout(onClose, 1800);
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
