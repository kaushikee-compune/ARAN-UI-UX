// app/doctor/consultations/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

/** External modules (lean) */
import DigitalRxForm, { type DigitalRxFormState } from "@/components/doctor/DigitalRxForm";
import ImmunizationForm from "@/components/doctor/ImmunizationForm";
import DischargeSummaryForm from "@/components/doctor/DischargeSummary";
import LabRequestForm from "@/components/doctor/LabRequestForm";

/** UI bits loaded client-side */
const QueueQuickView = dynamic(() => import("@/components/doctor/QueueQuickView"), { ssr: false });
const VoiceOverlay = dynamic(() => import("@/components/doctor/VoiceOverlay"), { ssr: false });

/** Use your Companion Toggle (treat as any to avoid prop typing mismatches) */
const CompanionToggle: any = dynamic(() => import("@/components/doctor/CompanionToggle"), { ssr: false });

/* -------------------------------- Types -------------------------------- */
type TopMenuKey = "consultation" | "consent" | "queue";
type ActiveTool = "none" | "digitalrx" | "immunization" | "discharge" | "lab";
type CompanionMode = "off" | "form" | "voice" | "scribe";

type SavedTab = {
  id: string;    // ISO timestamp
  label: string; // e.g., "24 Aug 2025, 10:42"
  payload?: any; // snapshot of the saved record (here: rx form)
};

/* ------------------------------ Constants ------------------------------ */
const TAB_COLORS = [
  { bg: "#E0F2FE", text: "#0C4A6E" }, // Sky
  { bg: "#FDE68A", text: "#92400E" }, // Amber
  { bg: "#FBCFE8", text: "#831843" }, // Pink
  { bg: "#C7D2FE", text: "#3730A3" }, // Indigo
  { bg: "#BBF7D0", text: "#065F46" }, // Green
  { bg: "#FEF9C3", text: "#854D0E" }, // Yellow
  { bg: "#E9D5FF", text: "#6B21A8" }, // Purple
];

function colorFor(i: number) {
  return TAB_COLORS[i % TAB_COLORS.length];
}

/* --------------------------------- Page --------------------------------- */
export default function ConsultationsPage() {
  // 1) Top header menu
  const [activeTop, setActiveTop] = useState<TopMenuKey>("consultation");

  // 2) Companion mode
  const [companionMode, setCompanionMode] = useState<CompanionMode>("off");
  const companionOn = companionMode !== "off";

  // 3) Sticky right toolbar (external tools)
  const [activeTool, setActiveTool] = useState<ActiveTool>("none");

  // 4) Collapse/expand the app sidebar (Doctor layout listens to this)
  const collapseSidebar = useCallback((collapse: boolean) => {
    try {
      localStorage.setItem("aran:sidebarCollapsed", collapse ? "1" : "0");
      window.dispatchEvent(new Event("aran:sidebar"));
    } catch {}
  }, []);

  // 5) Patient header (placeholder demo data)
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

  // 6) Digital Rx Form (controlled)
  const [rxForm, setRxForm] = useState<DigitalRxFormState>(() => ({
    vitals: {},
    clinical: {},
    prescription: [{ medicine: "", frequency: "", instruction: "", duration: "", dosage: "" }],
    plan: {},
  }));
  const handleRxChange = useCallback((next: DigitalRxFormState) => setRxForm(next), []);

  // 7) Tabs: Tab 0 = Current Record (live preview host); Tab1+ = saved
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [tabIndex, setTabIndex] = useState(0); // 0 => Current; 1.. => saved
  const addSavedTab = useCallback(
    (payload?: any) => {
      const now = new Date();
      const label = now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const id = now.toISOString();
      setTabs((t) => [...t, { id, label, payload }]);
      setTabIndex(tabs.length + 1);
    },
    [tabs.length]
  );

  // 8) Toast (Send/Print/Language)
  const [toast, setToast] = useState<{ type: "info" | "success"; msg: string } | null>(null);
  const showInfo = (msg: string) => setToast({ type: "info", msg });
  const showSuccess = (msg: string) => setToast({ type: "success", msg });

  // 9) Actions (Save = snapshot current rxForm)
  const onSave = useCallback(() => {
    addSavedTab(rxForm);
    showSuccess("Saved as a new record tab.");
  }, [addSavedTab, rxForm]);
  const onSend = useCallback(() => showInfo("Record sent to patient."), []);
  const onPrint = useCallback(() => {
    window.print();
    showInfo("Opening print preview…");
  }, []);
  const onLanguage = useCallback(() => showInfo("Language selector coming soon."), []);

  // 10) Right toolbar (Group A) clicks: collapse sidebar + 50/50 split
  const openTool = useCallback(
    (tool: ActiveTool) => {
      setCompanionMode("off");       // leave companion
      collapseSidebar(true);         // collapse for tool forms
      setActiveTool(tool);
      setTabIndex(0);                // stay on current live canvas
    },
    [collapseSidebar]
  );

  // 11) Companion switch (use your toggle component)
  const handleCompanionSwitch = useCallback(
    (checked: boolean) => {
      if (checked) {
        // ON: default to form, collapse sidebar
        setCompanionMode("form");
        setActiveTool("none");
        collapseSidebar(true);
        setTabIndex(0);
      } else {
        // OFF: expand sidebar and clear modes
        setCompanionMode("off");
        setActiveTool("none");
        collapseSidebar(false);
      }
    },
    [collapseSidebar]
  );

  // 12) Companion icon picks
  const pickCompanion = useCallback(
    (mode: Extract<CompanionMode, "form" | "voice" | "scribe">) => {
      if (!companionOn) return;
      setCompanionMode(mode);
      setActiveTool("none");
      if (mode === "voice") {
        // Voice keeps sidebar visible; no split
        collapseSidebar(false);
      } else {
        // Form / Scribe collapse sidebar and use split
        collapseSidebar(true);
        setTabIndex(0);
      }
    },
    [companionOn, collapseSidebar]
  );

  /* ------------------------------- Layout calc ------------------------------- */
  // Companion "form": Preview (L) | Form (R) | Dock
  // Companion "scribe": Scribe L (70) | Preview R (30) | Dock
  // Tool active: Preview (L) | Tool Form (R) | Dock
  // Default: Preview | Dock
  const layout = useMemo(() => {
    if (companionMode === "form") return "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_72px]";
    if (companionMode === "scribe") return "grid-cols-1 md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)_72px]";
    if (activeTool !== "none") return "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_72px]";
    return "grid-cols-1 md:grid-cols-[minmax(0,1fr)_72px]";
  }, [companionMode, activeTool]);

  /* -------------------------------- Render -------------------------------- */
  return (
    <div className="space-y-3">
      {/* 1) Header Panel: Top menu + Companion cluster */}
      <div className="ui-card px-3 py-2">
        <div className="flex items-center gap-2">
          <TopMenuButton active={activeTop === "consultation"} onClick={() => setActiveTop("consultation")}>
            Consultation
          </TopMenuButton>
          <TopMenuButton active={activeTop === "consent"} onClick={() => setActiveTop("consent")}>
            Consent
          </TopMenuButton>
          <TopMenuButton active={activeTop === "queue"} onClick={() => setActiveTop("queue")}>
            OPD Queue
          </TopMenuButton>

          {/* Queue quick view */}
          {activeTop === "queue" && <QueueQuickView onClose={() => setActiveTop("consultation")} />}

          {/* Companion cluster (right) */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600">Companion Mode</span>
            {/* Use your toggle. We send both common handler names for flexibility. */}
            <CompanionToggle
              checked={companionOn}
              onChange={(v: boolean) => handleCompanionSwitch(!!v)}
              onCheckedChange={(v: boolean) => handleCompanionSwitch(!!v)}
            />
            <IconButton
              label="Form"
              disabled={!companionOn}
              pressed={companionMode === "form"}
              onClick={() => pickCompanion("form")}
            >
              <FormIcon className="w-4 h-4" />
            </IconButton>
            <IconButton
              label="Voice"
              disabled={!companionOn}
              pressed={companionMode === "voice"}
              onClick={() => pickCompanion("voice")}
            >
              <MicIcon className="w-4 h-4" />
            </IconButton>
            <IconButton
              label="Scribe"
              disabled={!companionOn}
              pressed={companionMode === "scribe"}
              onClick={() => pickCompanion("scribe")}
            >
              <ScribeIcon className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* 2) Main Area + Sticky Right Toolbar */}
      <div className="mt-6 px-3 md:px-6 lg:px-8">
        <div className={`grid gap-4 items-start ${layout}`}>
          {/* Companion: FORM (Preview left | Form right) */}
          {companionMode === "form" ? (
            <>
              {/* LEFT: Preview */}
              <PreviewPaper patient={patient} tabIndex={tabIndex} tabs={tabs} setTabIndex={setTabIndex} />
              {/* RIGHT: Digital Rx Form (controlled) */}
              <SectionCard ariaLabel="Consultation form (Companion)">
                <DigitalRxForm value={rxForm} onChange={handleRxChange} onSave={onSave} />
              </SectionCard>
            </>
          ) : companionMode === "scribe" ? (
            <>
              {/* LEFT: Scribe writing area (blank) */}
              <SectionCard ariaLabel="Scribe area">
                <div className="text-sm text-gray-600">Write notes here…</div>
                <textarea className="ui-textarea w-full mt-2 min-h-[420px]" placeholder="Free writing space…" />
              </SectionCard>
              {/* RIGHT: Preview (hide Current Record tab in scribe) */}
              <PreviewPaper
                patient={patient}
                tabIndex={tabIndex}
                tabs={tabs}
                setTabIndex={setTabIndex}
                showCurrentTab={false}
              />
            </>
          ) : activeTool !== "none" ? (
            <>
              {/* Tool split: Preview LEFT | Form RIGHT */}
              <PreviewPaper patient={patient} tabIndex={tabIndex} tabs={tabs} setTabIndex={setTabIndex} />
              <SectionCard ariaLabel="Active tool form">
                {activeTool === "digitalrx" && (
                  <DigitalRxForm value={rxForm} onChange={handleRxChange} onSave={onSave} />
                )}
                {/* {activeTool === "immunization" && <ImmunizationForm />}
                {activeTool === "discharge" && <DischargeSummaryForm />}
                {activeTool === "lab" && <LabRequestForm />} */}
              </SectionCard>
            </>
          ) : (
            // Default: only Preview
            <PreviewPaper patient={patient} tabIndex={tabIndex} tabs={tabs} setTabIndex={setTabIndex} />
          )}

          {/* RIGHT: Sticky Slim Toolbar */}
          <aside className="hidden md:block sticky top-20 self-start w-[72px]">
            <div className="flex flex-col items-center gap-2">
              <div className="ui-card p-1.5 w-[58px] flex flex-col items-center gap-2">
                {/* Group A */}
                <RoundPill label="Digital Rx" onClick={() => openTool("digitalrx")} img="/icons/digitalrx.png" />
                <RoundPill label="Immunization" onClick={() => openTool("immunization")} img="/icons/syringe.png" />
                <RoundPill label="Discharge" onClick={() => openTool("discharge")} img="/icons/discharge-summary.png" />
                <RoundPill label="Lab" onClick={() => openTool("lab")} img="/icons/lab-request.png" />

                <div className="my-1 h-px w-full bg-gray-200" />

                {/* Group B */}
                <TinyIcon label="Save" tone="info" onClick={onSave}>
                  <SaveIcon className="w-4 h-4" />
                </TinyIcon>
                <TinyIcon label="Send" tone="success" onClick={onSend}>
                  <TickIcon className="w-4 h-4" />
                </TinyIcon>
                <TinyIcon label="Print" onClick={onPrint}>
                  <PrinterIcon className="w-4 h-4" />
                </TinyIcon>
                <TinyIcon label="Language" onClick={onLanguage}>
                  <LanguagesIcon className="w-4 h-4" />
                </TinyIcon>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Voice overlay floats when chosen */}
      {/* {companionMode === "voice" && <VoiceOverlay />} */}

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} onClose={() => setToast(null)}>
          {toast.msg}
        </Toast>
      )}
    </div>
  );
}

/* =============================== Preview =============================== */
function PreviewPaper({
  patient,
  tabIndex,
  tabs,
  setTabIndex,
  showCurrentTab = true,
}: {
  patient: { name: string; age: string; gender: string; abhaNumber: string; abhaAddress: string };
  tabIndex: number;
  tabs: { id: string; label: string }[];
  setTabIndex: (i: number) => void;
  showCurrentTab?: boolean;
}) {
  // Handle hidden "Current Record" tab (scribe mode)
  const effectiveTabIndex = !showCurrentTab && tabIndex === 0 ? (tabs.length > 0 ? 1 : -1) : tabIndex;

  return (
    <div className="min-w-0">
      <div
        className="relative mx-auto bg-white border rounded-xl shadow-sm overflow-visible"
        style={{ minHeight: 680, background: "linear-gradient(180deg,#ffffff 0%,#fcfcfc 100%)" }}
      >
        {/* Tabs rail (behind) */}
        <div className="absolute left-4 -top-5 flex flex-wrap gap-2 z-0" aria-label="Health record tabs">
          {/* Tab 0: Current Record (optional) */}
          {showCurrentTab && (() => {
            const col = colorFor(0);
            const active = effectiveTabIndex === 0;
            return (
              <button
                key="tab-current"
                onClick={() => setTabIndex(0)}
                aria-pressed={active}
                className={[
                  "px-4 py-2 text-sm font-semibold border-2 shadow-sm rounded-tl-none rounded-tr-lg",
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
              >
                <span className="relative -top-[7px]">Current Record</span>
              </button>
            );
          })()}

          {/* Tab1+ : Saved tabs */}
          {tabs.map((t, idx) => {
            const i = idx + 1;
            const col = colorFor(i);
            const active = effectiveTabIndex === i;
            return (
              <button
                key={t.id}
                onClick={() => setTabIndex(i)}
                aria-pressed={active}
                className={[
                  "px-4 py-2 text-sm font-semibold border-2 shadow-sm rounded-tl-none rounded-tr-lg",
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
                title={t.label}
              >
                <span className="relative -top-[7px]">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Top cover band so inactive tabs tuck behind */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-xl z-10"
          style={{ background: "linear-gradient(180deg,#ffffff 0%,#fcfcfc 100%)" }}
          aria-hidden
        />

        {/* Paper inner */}
        <div className="relative z-10 p-4 md:p-6">
          {/* Patient demography header */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-start">
            {/* Left: Patient */}
            <div className="min-w-0 pr-3">
              <div className="text-xs text-gray-500 mb-1">Patient</div>
              <div className="text-sm font-semibold">{patient.name}</div>
              <div className="text-xs text-gray-700 mt-0.5">
                {patient.gender} • {patient.age}
              </div>
              <div className="text-xs text-gray-600 mt-1">ABHA No: {patient.abhaNumber}</div>
              <div className="text-xs text-gray-600">ABHA Address: {patient.abhaAddress}</div>
            </div>

            {/* Center: Logo */}
            <Image src="/whitelogo.png" alt="ARAN Logo" width={40} height={40} />

            {/* Right: Patient Summary icon */}
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

          {/* Content */}
          <div className="mt-2">
            {effectiveTabIndex === -1 ? (
              <div className="ui-card p-4 text-sm text-gray-700 min-h-[320px]">
                <div className="text-gray-400">(No past record selected.)</div>
              </div>
            ) : effectiveTabIndex === 0 ? (
              <div className="ui-card p-4 text-sm text-gray-700 min-h-[320px]">
                <div className="text-gray-400">(Blank preview — will reflect the current form.)</div>
              </div>
            ) : (
              <div className="ui-card p-4 text-sm text-gray-700 min-h-[320px]">
                Saved record. (Wire to components/doctor/PastHealthrecord.tsx later.)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================== UI Pieces =============================== */
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
      className={["px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition", active ? "bg-gray-900 text-white" : "hover:bg-gray-100"].join(" ")}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  disabled,
  pressed,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  pressed?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-pressed={!!pressed}
      className={[
        "group relative inline-flex items-center justify-center w-9 h-9 rounded-full border",
        disabled ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : pressed ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300",
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

function SectionCard({ ariaLabel, children }: { ariaLabel?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="ui-card p-4" aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );
}

function RoundPill({ img, label, onClick }: { img: string; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group w-10 h-10 rounded-full border bg-white hover:bg-gray-50 shadow flex items-center justify-center" title={label} aria-label={label}>
      <Image src={img} alt={label} width={18} height={18} />
      <span className="pointer-events-none absolute mt-12 opacity-0 group-hover:opacity-100 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">{label}</span>
    </button>
  );
}

function TinyIcon({
  label,
  onClick,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick?: () => void;
  tone?: "neutral" | "info" | "success";
  children: React.ReactNode;
}) {
  const styles =
    tone === "success"
      ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
      : tone === "info"
      ? "bg-sky-600 text-white hover:bg-sky-700 border-sky-700"
      : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300";
  return (
    <button onClick={onClick} className={`group relative inline-flex items-center justify-center w-9 h-9 rounded-full border shadow ${styles}`} title={label} aria-label={label}>
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </button>
  );
}

/* --------------------------------- Icons --------------------------------- */
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

/* -------------------------------- Helpers ------------------------------- */
function Toast({
  type,
  children,
  onClose,
}: {
  type: "success" | "info";
  children: React.ReactNode;
  onClose: () => void;
}) {
  const color = type === "success" ? "#16a34a" : "#2563eb";
  useEffect(() => {
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className="rounded-lg shadow-lg border bg-white px-4 py-3 text-sm" style={{ borderColor: color }}>
        <div className="flex items-start gap-2">
          <div className="mt-[2px]" style={{ color }}>
            {type === "success" ? "✔" : "ℹ"}
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
