// app/doctor/patients/page.tsx
"use client";

/**
 * ARAN • Doctor → Patients (OneNote-style tabs with behind/in-front layering)
 * --------------------------------------------------------------------------
 * Changes in this version:
 * - Tabs visually "emerge" from behind the paper panel.
 * - Inactive tabs are under the panel (z-0) and partially hidden by a top cover band.
 * - The active tab is raised (z-20) and slightly lifted to appear in front of the panel.
 */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";

// --------------------------- Types ---------------------------
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

// --------------------------- Tab Colors ---------------------------
const TAB_COLORS = [
  { bg: "#E0F2FE", text: "#0C4A6E", ring: "#93C5FD", border: "#BAE6FD" }, // Sky
  { bg: "#FDE68A", text: "#92400E", ring: "#FCD34D", border: "#FDE68A" }, // Amber
  { bg: "#FBCFE8", text: "#831843", ring: "#F472B6", border: "#FBCFE8" }, // Pink
  { bg: "#C7D2FE", text: "#3730A3", ring: "#A5B4FC", border: "#C7D2FE" }, // Indigo
  { bg: "#BBF7D0", text: "#065F46", ring: "#86EFAC", border: "#BBF7D0" }, // Green
  { bg: "#FEF9C3", text: "#854D0E", ring: "#FDE68A", border: "#FEF9C3" }, // Yellow
  { bg: "#E9D5FF", text: "#6B21A8", ring: "#C4B5FD", border: "#E9D5FF" }, // Purple
];

// --------------------------- Page ----------------------------
export default function PatientsPage() {
  // Top menu
  const [active, setActive] = useState<TopMenuKey>("consultation");

  // Sidebar toggle
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

  // Tabs: 0 = New Record, 1.. = PAST_DAYS[i-1]
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  useEffect(() => setSelectedItemIdx(0), [tabIndex]);

  // Toast
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

  // Current day/record
  const selectedDay = tabIndex > 0 ? PAST_DAYS[tabIndex - 1] : undefined;
  const currentRecord = selectedDay?.items[selectedItemIdx];
  const canGoLeft = !!selectedDay && selectedItemIdx > 0;
  const canGoRight =
    !!selectedDay && selectedItemIdx < selectedDay.items.length - 1;
  const goLeft = () => canGoLeft && setSelectedItemIdx((i) => i - 1);
  const goRight = () => canGoRight && setSelectedItemIdx((i) => i + 1);

  const colorFor = (i: number) => TAB_COLORS[i % TAB_COLORS.length];

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

      {/* 2) Health-record Pane */}
      <div className="relative mt-8">
        <div
          className="relative mx-auto bg-white border rounded-xl shadow-sm overflow-visible"
          style={{
            maxWidth: 1100,
            minHeight: 700,
            background:
              "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,252,1) 100%)",
          }}
        >
          {/* ------- Tabs rail (behind panel by default) ------- */}
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
                    activeTab ? "ring-2 z-20" : "hover:brightness-[.98] z-0",
                  ].join(" ")}
                  style={{
                    background: col.bg,
                    color: col.text,
                    borderColor: activeTab ? "#1b1a1aff" : "#b8b5b5ff",
                    boxShadow: activeTab
                      ? "0 2px 0 rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)"
                      : undefined,
                    transform: activeTab ? "translateY(-4px)" : undefined, // lift when active
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
                  className={[
                    "px-4 py-2 text-sm font-semibold border-2 shadow-sm rounded-tl-none rounded-tr-lg",
                    activeTab ? "ring-2 z-20" : "hover:brightness-[.98] z-0",
                  ].join(" ")}
                  style={{  
                    
                    background: col.bg,
                    color: col.text,
                    borderColor: activeTab ? "#1b1a1aff" : "#b8b5b5ff",
                    boxShadow: activeTab
                      ? "0 2px 0 rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)"
                      : undefined,
                    transform: activeTab ? "translateY(-4px)" : undefined, // lift when active
                    outline: "none",
                  }}
                >
                  <span className="relative -top-[7px] ">{d.dateLabel}</span>
                </button>
              );
            })}
          </div>

          {/* ------- Cover band that makes the panel sit above inactive tabs ------- */}
          {/* This band matches the panel's background and sits above z-0 tabs but below the active tab (z-20). */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-xl z-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,252,1) 100%)",
            }}
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

              {/* Right: Patient Summary */}
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
                <div className="ui-card p-6 text-sm text-gray-700">
                  {/* <div className="text-gray-900 font-semibold mb-2">
                    New Health Record
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    Start capturing vitals, prescription, immunization, etc.
                  </div> */}
                  <div className="min-h-[320px] grid place-items-center text-gray-400">
                    (Your new record form goes here…)
                  </div>
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

          {/* 3) Right-edge vertical toolbar */}
          <div className="absolute top-6 -right-14 flex flex-col gap-2">
            <ToolButton label="Voice">
              <MicIcon className="w-4 h-4" />
            </ToolButton>
            <ToolButton label="Form">
              <FormIcon className="w-4 h-4" />
            </ToolButton>
            <ToolButton label="Scribe">
              <ScribeIcon className="w-4 h-4" />
            </ToolButton>
          </div>
        </div>
      </div>

      {/* 4) Floating bottom bar */}
      <div className="sticky bottom-4">
        <div className="ui-card px-3 py-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Active:</span> {labelFor(active)}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-outline" onClick={onSave}>
              Save
            </button>
            <button className="btn-primary" onClick={onSubmit}>
              Submit
            </button>
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

function KV({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-500 w-36">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-2 py-1.5 text-left text-gray-700 border">{children}</th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1.5 text-gray-900">{children}</td>;
}

// ------------------------- Small UI pieces -------------------------
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

// 
function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className="inline-flex items-center justify-center w-8 h-8  hover:bg-gray-50 transition"
      title={checked ? "Expand sidebar" : "Collapse sidebar"}
    >
      <PenIcon className="w-4 h-4 text-green-700" />
    </button>
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
    >
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </button>
  );
}

// --------------------------- Icons ---------------------------
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
