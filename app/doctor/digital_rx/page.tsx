// app/doctor/digital_rx/page.tsx
"use client";
import { useCompanionMode } from "@/components/use-companion-mode";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import Image from "next/image";
import Link from "next/link";

/* --------------------------- Types --------------------------- */
type TopMenuKey =
  | "consultation"
  | "lab"
  | "immunization"
  | "discharge"
  | "consent";

type DayTab = { dateLabel: string; dateISO: string };

/* --------------------------- Mock Data --------------------------- */
const PAST_DAYS: DayTab[] = [
  { dateLabel: "02 Feb 2025", dateISO: "2025-02-02" },
  { dateLabel: "19 Jan 2025", dateISO: "2025-01-19" },
  { dateLabel: "03 Jan 2025", dateISO: "2025-01-03" },
];

const TAB_COLORS = [
  { bg: "#E0F2FE", text: "#0C4A6E" },
  { bg: "#FDE68A", text: "#92400E" },
  { bg: "#FBCFE8", text: "#831843" },
  { bg: "#C7D2FE", text: "#3730A3" },
  { bg: "#BBF7D0", text: "#065F46" },
  { bg: "#FEF9C3", text: "#854D0E" },
  { bg: "#E9D5FF", text: "#6B21A8" },
];

/* --------------------------- Page --------------------------- */
export default function DigitalRxPage() {
  // Top menu active state
  const [active, setActive] = useState<TopMenuKey>("consultation");

  // Sidebar collapsed toggle (sync with /doctor layout via localStorage + custom event)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isOn: companionOn, toggle: toggleCompanion } = useCompanionMode();
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

  // Tabs (0 = current/blank, 1.. = past dates)
  const [tabIndex, setTabIndex] = useState(0);
  const colorFor = (i: number) => TAB_COLORS[i % TAB_COLORS.length];

  // Patient snapshot (mock)
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

  // Language / Print small panels (toolbar)
  const [lang, setLang] = useState("English");
  const [langOpen, setLangOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);
  const onPrint = useCallback(() => window.print(), []);
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

  // Tiny toast
  const [toast, setToast] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);
  const show = (t: typeof toast) => setToast(t);

  return (
    <div className="space-y-3">
      {/* 1) Top menu + sidebar toggle (exact look/behavior as consultations) */}
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
            label="Immunization"
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
            <span className="text-xs text-gray-600">
              Collapse/Expand Sidebar
            </span>
            <Switch checked={sidebarCollapsed} onChange={toggleSidebar} />
          </div>
        </div>
      </div>

      {/* 2) Paper panel with tabs + patient demographics; no form below it */}
      <div className="mt-8 px-3 md:px-6 lg:px-8">
        <div className="grid gap-4 items-start grid-cols-1 md:grid-cols-[minmax(0,1fr)_64px]">
          {/* LEFT: Paper */}
          <div className="min-w-0">
            <div
              className="relative mx-auto bg-white border rounded-xl shadow-sm overflow-visible"
              style={{
                minHeight: 600,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,252,1) 100%)",
              }}
            >
              {/* Tabs rail (behind) */}
              <div
                className="absolute left-4 -top-5 flex flex-wrap gap-2 z-0"
                aria-label="Health record tabs"
              >
                {/* Tab 0: Current Record (blank) */}
                {(() => {
                  const col = colorFor(0);
                  const activeTab = tabIndex === 0;
                  return (
                    <button
                      key="current"
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
                      <span className="relative -top-[7px]">Current</span>
                    </button>
                  );
                })()}

                {/* Past date tabs */}
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
                      <span className="relative -top-[7px]">{d.dateLabel}</span>
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

              {/* Paper inner */}
              <div className="relative z-10 p-4 md:p-6">
                {/* Header row: Patient demographics + logo + summary icon */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-start">
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

                  {/* Center: Logo (put your asset in /public if needed) */}
                  <Image
                    src="/whitelogo.png"
                    alt="ARAN Logo"
                    width={40}
                    height={40}
                  />

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

                {/* CONTENT AREA: keep blank by design for current; simple placeholder for past */}
                <div className="mt-2">
                  {tabIndex === 0 ? (
                    <div className="min-h-[300px] grid place-items-center text-gray-400">
                      {/* Intentionally blank area under demographics */}
                      (Digital Rx area — blank by design)
                    </div>
                  ) : (
                    <div className="ui-card p-4 text-sm text-gray-600">
                      {/* Light placeholder for past tabs (you can swap with real data later) */}
                      Past record from{" "}
                      <span className="font-medium">
                        {PAST_DAYS[tabIndex - 1].dateLabel}
                      </span>{" "}
                      — content not rendered here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Slim outside dock (same toolbar as consultations) */}
          <aside className="hidden md:block sticky top-20 self-start w-[64px]">
            <div className="flex flex-col items-center gap-2">
              {/* Vertical tool buttons */}
              <ToolButton label="Voice">
                <MicIcon className="w-4 h-4" />
              </ToolButton>

              {/* Form button present linking to companin page */}
              {/* Companion Mode toggle (stays in toolbar) */}
              <button
                onClick={toggleCompanion}
                aria-pressed={companionOn}
                className={[
                  "group relative inline-flex items-center justify-center w-9 h-9 rounded-full border shadow",
                  companionOn
                    ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                    : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300",
                ].join(" ")}
                title={
                  companionOn ? "Companion Mode: ON" : "Companion Mode: OFF"
                }
                aria-label="Toggle Companion Mode"
              >
                {/* Simple split-view icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M12 4v16" />
                </svg>
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
                  {companionOn ? "Companion ON" : "Companion OFF"}
                </span>
              </button>

              <Link
                href="/doctor/digital_rx"
                className="group relative inline-flex items-center justify-center w-9 h-9 rounded-full border shadow bg-white text-gray-900 hover:bg-gray-50 border-gray-300"
                title="Digital Rx"
                aria-label="Open Digital Rx"
              >
                {/* Use any icon you prefer here */}
                <FormIcon className="w-4 h-4" />
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
                  Digital&nbsp;Rx
                </span>
              </Link>

              <ToolButton label="Scribe">
                <ScribeIcon className="w-4 h-4" />
              </ToolButton>

              <div className="my-1 h-px w-8 bg-gray-200" />

              {/* Language (icon → floating selection) */}
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

              {/* Save / Submit / Print */}
              <IconBtn
                label="Save"
                tone="info"
                onClick={() => show({ type: "info", message: "Saved (mock)." })}
              >
                <SaveIcon className="w-4 h-4" />
              </IconBtn>

              <IconBtn
                label="Submit"
                tone="success"
                onClick={() =>
                  show({ type: "success", message: "Submitted (mock)." })
                }
              >
                <TickIcon className="w-4 h-4" />
              </IconBtn>

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
}

/* --------------------------- Small UI pieces --------------------------- */
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

/* --------------------------- Icons --------------------------- */
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

/* --------------------------- Toast --------------------------- */
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
    const t = setTimeout(onClose, 1600);
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
