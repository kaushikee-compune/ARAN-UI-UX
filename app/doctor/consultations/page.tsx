// app/doctor/consultations/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState, useLayoutEffect, useRef, } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";


/** External modules (lean) */
import DigitalRxForm, {
  type DigitalRxFormState,
} from "@/components/doctor/DigitalRxForm";
import ImmunizationForm from "@/components/doctor/ImmunizationForm";
import DischargeSummaryForm from "@/components/doctor/DischargeSummary";
import LabRequestForm from "@/components/doctor/LabRequestForm";

/** Client-only bits */
const QueueQuickView = dynamic(
  () => import("@/components/doctor/QueueQuickView"),
  { ssr: false }
);
const VoiceOverlay = dynamic(() => import("@/components/doctor/VoiceOverlay"), {
  ssr: false,
});
const CompanionToggle: any = dynamic(
  () => import("@/components/doctor/CompanionToggle"),
  { ssr: false }
);

/* -------------------------------- Types -------------------------------- */
type TopMenuKey = "consultation" | "consent" | "queue";
type ActiveTool = "none" | "digitalrx" | "immunization" | "discharge" | "lab";
type CompanionMode = "off" | "form" | "voice" | "scribe";

type SavedTab = {
  id: string; // ISO timestamp
  label: string; // e.g., "24 Aug 2025, 10:42"
  payload?: DigitalRxFormState; // snapshot of Rx form
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

/* ------------------------------ Small utils ---------------------------- */
const nonEmpty = (v: unknown) =>
  v !== undefined && v !== null && (typeof v !== "string" || v.trim() !== "");

const anyRowHas = <T extends Record<string, any>>(
  rows?: T[],
  keys: (keyof T)[] = []
) => !!rows?.some((r) => keys.some((k) => nonEmpty(r?.[k as string])));

const safe = (s?: string) => (nonEmpty(s) ? String(s) : "");

const compactRows = <T extends Record<string, any>>(
  rows?: T[],
  keys: (keyof T)[] = []
) => (rows ?? []).filter((r) => keys.some((k) => nonEmpty(r?.[k as string])));

/** empty form template used after Save to blank preview */
const INITIAL_RXFORM: DigitalRxFormState = {
  vitals: {},
  clinical: {},
  prescription: [
    { medicine: "", frequency: "", instruction: "", duration: "", dosage: "" },
  ],
  plan: {},
};

/* --------------------------------- Page --------------------------------- */
export default function ConsultationsPage() {
  // 1) Top header menu
  const [activeTop, setActiveTop] = useState<TopMenuKey>("consultation");

  // 2) Companion mode
  const [companionMode, setCompanionMode] = useState<CompanionMode>("off");
  const companionOn = companionMode !== "off";

  // 3) Sticky right toolbar (external tools)
  const [activeTool, setActiveTool] = useState<ActiveTool>("none");

  // 4) Collapse/expand app sidebar
  const collapseSidebar = useCallback((collapse: boolean) => {
    try {
      localStorage.setItem("aran:sidebarCollapsed", collapse ? "1" : "0");
      window.dispatchEvent(new Event("aran:sidebar"));
    } catch {}
  }, []);

  // 5) Patient header (placeholder)
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
  const [rxForm, setRxForm] = useState<DigitalRxFormState>(INITIAL_RXFORM);
  const handleRxChange = useCallback(
    (next: DigitalRxFormState) => setRxForm(next),
    []
  );

  // 7) Tabs: Tab0 = Current (live), Tab1+ = saved
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [tabIndex, setTabIndex] = useState(0); // 0 => Current; 1.. => saved
  const addSavedTab = useCallback((payload?: DigitalRxFormState) => {
    const now = new Date();
    const label = now.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      // hour: "2-digit",
      // minute: "2-digit",
      // hour12: false,
    });
    const id = now.toISOString();
    setTabs((t) => [...t, { id, label, payload }]);
  }, []);

  // 8) Toasts
  const [toast, setToast] = useState<{
    type: "info" | "success";
    msg: string;
  } | null>(null);
  const showInfo = (msg: string) => setToast({ type: "info", msg });
  const showSuccess = (msg: string) => setToast({ type: "success", msg });

  // 9) Actions
  const onSave = useCallback(() => {
    // 1) snapshot current form to a new tab
    addSavedTab(rxForm);
    // 2) clear form to template
    setRxForm(INITIAL_RXFORM);
    // 3) jump to Current (tab 0) so preview is blank
    setTabIndex(0);
    // 4) toast
    showSuccess("Saved. Preview cleared for a new record.");
  }, [addSavedTab, rxForm]);

  const onSend = useCallback(() => showInfo("Record sent to patient."), []);
  const onPrint = useCallback(() => {
    window.print();
    showInfo("Opening print preview…");
  }, []);
  const onLanguage = useCallback(
    () => showInfo("Language selector coming soon."),
    []
  );

  // 10) Right toolbar (Group A) clicks
  const openTool = useCallback(
    (tool: ActiveTool) => {
      setCompanionMode("off");
      collapseSidebar(true);
      setActiveTool(tool);
      setTabIndex(0);
    },
    [collapseSidebar]
  );

  // 11) Companion switch via your toggle
  const handleCompanionSwitch = useCallback(
    (checked: boolean) => {
      if (checked) {
        setCompanionMode("form"); // default ON → Form
        setActiveTool("none");
        collapseSidebar(true);
        setTabIndex(0);
      } else {
        setCompanionMode("off");
        setActiveTool("none");
        collapseSidebar(false); // OFF → show sidebar
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
        collapseSidebar(false);
      } else {
        collapseSidebar(true);
        setTabIndex(0);
      }
    },
    [companionOn, collapseSidebar]
  );

  // Scribe text -> live preview
  const [scribeText, setScribeText] = useState("");

  const scribePayload = useMemo<DigitalRxFormState>(() => {
    // Keep it simple: show scribe text as Doctor’s Note in the Plan section
    // (Live preview already renders plan.doctorNote)
    return {
      vitals: {},
      clinical: {},
      prescription: [],
      plan: { doctorNote: scribeText.trim() },
    };
  }, [scribeText]);

  // Save Scribe -> new tab + clear + toast (mirrors DigitalRx onSave)
  const onSaveScribe = useCallback(() => {
    const clean = scribeText.trim();
    if (!clean) {
      showInfo("Nothing to save from Scribe.");
      return;
    }
    addSavedTab(scribePayload); // snapshot the scribe preview into a new tab
    setScribeText(""); // clear the scribe editor
    setTabIndex(0); // jump back to Current
    showSuccess("Scribe saved. Preview cleared for a new note.");
  }, [scribeText, scribePayload, addSavedTab]);

  /* ------------------------------- Layout calc ------------------------------- */
  const layout = useMemo(() => {
    if (companionMode === "form")
      return "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_72px]";
    if (companionMode === "scribe")
      return "grid-cols-1 md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)_72px]";
    if (activeTool !== "none")
      return "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_72px]";
    return "grid-cols-1 md:grid-cols-[minmax(0,1fr)_72px]";
  }, [companionMode, activeTool]);

  /* -------------------------------- Render -------------------------------- */
  return (
    <div className="space-y-3">
      {/* Header Panel */}
      <div className="ui-card px-3 py-2">
        <div className="flex items-center gap-2">
          <TopMenuButton
            active={activeTop === "consultation"}
            onClick={() => setActiveTop("consultation")}
          >
            Consultation
          </TopMenuButton>
          <TopMenuButton
            active={activeTop === "consent"}
            onClick={() => setActiveTop("consent")}
          >
            Consent
          </TopMenuButton>
          <TopMenuButton
            active={activeTop === "queue"}
            onClick={() => setActiveTop("queue")}
          >
            OPD Queue
          </TopMenuButton>

          {activeTop === "queue" && (
            <QueueQuickView onClose={() => setActiveTop("consultation")} />
          )}

          {/* Companion cluster (right) */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600">Companion Mode</span>
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

      {/* Main Area + Sticky Right Toolbar */}
      <div className="mt-6 px-3 md:px-6 lg:px-8">
        <div className={`grid gap-4 items-start ${layout}`}>
          {companionMode === "form" ? (
            <>
              {/* LEFT: Preview (LIVE) */}
              <PreviewPaper
                patient={patient}
                tabIndex={tabIndex}
                tabs={tabs}
                setTabIndex={setTabIndex}
                liveForm={rxForm}
              />
              {/* RIGHT: Digital Rx Form */}
              <SectionCard ariaLabel="Consultation form (Companion)">
                <DigitalRxForm
                  value={rxForm}
                  onChange={handleRxChange}
                  onSave={onSave}
                />
              </SectionCard>
            </>
          ) : companionMode === "scribe" ? (
            <>
              {/* LEFT: Preview (hide 'Current' tab; show scribe-driven payload) */}
              <PreviewPaper
                patient={patient}
                tabIndex={tabIndex}
                tabs={tabs}
                setTabIndex={setTabIndex}
                showCurrentTab={true} // The preview window should always have tab(0) as current tab
                payloadOverride={scribePayload} // 👈 new
              />

              {/* RIGHT: Scribe */}
              <SectionCard ariaLabel="Scribe area">
                <div className="text-sm text-gray-600">Write notes here…</div>
                <div className="mt-2 grid gap-2">
                  <textarea
                    className="ui-textarea w-full min-h-[420px]"
                    placeholder="Free writing space… (shows live as Doctor’s Note in preview)"
                    value={scribeText}
                    onChange={(e) => setScribeText(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-gray-500">
                      {scribeText.trim().length} characters
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
                        onClick={() => setScribeText("")}
                        title="Clear scribe"
                      >
                        Clear
                      </button>
                      <button
                        className="px-3 py-1.5 text-sm rounded-md border bg-gray-900 text-white hover:opacity-95"
                        onClick={onSaveScribe}
                        title="Save scribe"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          ) : activeTool !== "none" ? (
            <>
              {/* Tool split: Preview | Form */}
              <PreviewPaper
                patient={patient}
                tabIndex={tabIndex}
                tabs={tabs}
                setTabIndex={setTabIndex}
                liveForm={rxForm}
              />
              <SectionCard ariaLabel="Active tool form">
                {activeTool === "digitalrx" && (
                  <DigitalRxForm
                    value={rxForm}
                    onChange={handleRxChange}
                    onSave={onSave}
                  />
                )}
                {/* {activeTool === "immunization" && <ImmunizationForm />}
                {activeTool === "discharge" && <DischargeSummaryForm />}
                {activeTool === "lab" && <LabRequestForm />} */}
              </SectionCard>
            </>
          ) : (
            // Default: only Preview
            <PreviewPaper
              patient={patient}
              tabIndex={tabIndex}
              tabs={tabs}
              setTabIndex={setTabIndex}
              liveForm={rxForm}
            />
          )}

          {/* RIGHT: Sticky toolbar */}
          <aside className="hidden md:block sticky top-20 self-start w-[72px]">
            <div className="flex flex-col items-center gap-2">
              <div className="ui-card p-1.5 w-[58px] flex flex-col items-center gap-2">
                {/* Group A */}
                <RoundPill
                  label="Digital Rx"
                  onClick={() => openTool("digitalrx")}
                  img="/icons/digitalrx.png"
                />
                <RoundPill
                  label="Immunization"
                  onClick={() => openTool("immunization")}
                  img="/icons/syringe.png"
                />
                <RoundPill
                  label="Discharge"
                  onClick={() => openTool("discharge")}
                  img="/icons/discharge-summary.png"
                />
                <RoundPill
                  label="Lab"
                  onClick={() => openTool("lab")}
                  img="/icons/lab-request.png"
                />
                {/* Divider with extra breathing room */}
                <div className="my-10 h-px w-full bg-gray-300" />
                {/* Group B */}
                <TinyIcon
                  img="/icons/save.png"
                  label="Save"
                  onClick={companionMode === "scribe" ? onSaveScribe : onSave}
                />
                <TinyIcon img="/icons/send.png" label="Send" onClick={onSend} />
                <TinyIcon
                  img="/icons/print.png"
                  label="Print"
                  onClick={onPrint}
                />
                <TinyIcon
                  img="/icons/language.png"
                  label="Language"
                  onClick={onLanguage}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Voice overlay */}
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
  liveForm,
  payloadOverride, // 👈 top-level prop
}: {
  patient: {
    name: string;
    age: string;
    gender: string;
    abhaNumber: string;
    abhaAddress: string;
  };
  tabIndex: number;
  tabs: SavedTab[]; // or: { id: string; label: string; payload?: DigitalRxFormState }[]
  setTabIndex: React.Dispatch<React.SetStateAction<number>>;
  showCurrentTab?: boolean;
  liveForm?: DigitalRxFormState;
  payloadOverride?: DigitalRxFormState; // 👈 declare here, NOT inside `patient`
}) {
  // If the Current tab is hidden (scribe mode) and user is on "current",
  // keep preview blank rather than jumping to first saved tab.
  const effectiveTabIndex = !showCurrentTab && tabIndex === 0 ? -1 : tabIndex;
  const payload: DigitalRxFormState | undefined =
    payloadOverride ?? // 👈 if provided (scribe), take precedence
    (effectiveTabIndex <= 0 ? liveForm : tabs[effectiveTabIndex - 1]?.payload);

  return (
    <div className="min-w-0 md:sticky md:top-20 self-start">
  <div
    className="relative mx-auto bg-white border border-gray-300 rounded-xl shadow-sm overflow-visible" // ← allow rail to overflow
    style={{
      minHeight: 680,
      background: "linear-gradient(180deg,#ffffff 0%,#fcfcfc 100%)",
    }}
  >
    {/* Tabs rail */}
    <div
      className="absolute left-4 -top-5 flex flex-wrap gap-2 z-0"
        aria-label="Health record tabs"
    >
      {showCurrentTab &&
        (() => {
          const col = colorFor(0);
          const active = effectiveTabIndex === 0;
          return (
            <button
              key="tab-current"
              onClick={() => setTabIndex(0)}
              aria-pressed={active}
              className={[
                "px-4 py-2 text-sm font-semibold border-1 border-gray-300 shadow-lg rounded-tl-none rounded-tr-lg",
                  active ? "ring-2 z-20" : "hover:brightness-[.98] z-0",
              ].join(" ")}
              style={{
                background: col.bg,
                color: col.text,
                borderColor: active ? "#1b1a1a" : "#b8b5b5",
                boxShadow: active
                  ? "0 2px 0 rgba(0,0,0,.04), 0 8px 16px rgba(0,0,0,.06)"
                  : undefined,
                transform: active ? "translateY(-4px)" : undefined,
                outline: "none",
              }}
            >
              <span className="relative -top-[7px]">Current Record</span>
            </button>
          );
        })()}
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
              "px-4 py-2 text-sm font-semibold border-1 border-gray-300 shadow-lg rounded-tl-none rounded-tr-lg",
                active ? "ring-2 z-20" : "hover:brightness-[.98] z-0",
            ].join(" ")}
            style={{
              background: col.bg,
              color: col.text,
              borderColor: active ? "#1b1a1a" : "#b8b5b5",
              boxShadow: active
                ? "0 2px 0 rgba(0,0,0,.04), 0 8px 16px rgba(0,0,0,.06)"
                : undefined,
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

    {/* top cover band stays under the rail */}
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-xl z-10"
      style={{ background: "linear-gradient(180deg,#ffffff 0%,#fcfcfc 100%)" }}
      aria-hidden
    />

    {/* Paper inner */}
    <div className="relative z-0 p-4 md:p-6">
      {/* Patient demography header */}
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

      {/* Content */}
      <div className="mt-2">
        <LivePreviewOrEmpty payload={payload} />
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
        <div className="text-gray-400">
          (Blank preview — start typing in the form.)
        </div>
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
    // lifestyle
    nonEmpty(vitals.lifestyle?.smokingStatus) ||
    nonEmpty(vitals.lifestyle?.alcoholIntake) ||
    nonEmpty(vitals.lifestyle?.dietType) ||
    nonEmpty(vitals.lifestyle?.sleepHours) ||
    nonEmpty(vitals.lifestyle?.stressLevel) ||
    // notes & other groups
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
    anyRowHas(vitals.physicalActivity?.logs, [
      "activity",
      "durationMin",
      "intensity",
      "frequencyPerWeek",
    ]) ||
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

  const rxRows = compactRows(prescription, [
    "medicine",
    "frequency",
    "dosage",
    "duration",
    "instruction",
  ]);
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
        <div className="text-gray-400">
          (Nothing to preview yet — fields appear as you fill them.)
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vitals */}
      {hasVitals && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Vitals</h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {nonEmpty(vitals.temperature) && (
              <KV k="Temperature" v={`${safe(vitals.temperature)} °C`} />
            )}
            {(nonEmpty(vitals.bp) ||
              (nonEmpty(vitals.bpSys) && nonEmpty(vitals.bpDia))) && (
              <KV
                k="Blood Pressure"
                v={
                  nonEmpty(vitals.bp)
                    ? safe(vitals.bp)
                    : `${safe(vitals.bpSys)}/${safe(vitals.bpDia)} mmHg`
                }
              />
            )}
            {nonEmpty(vitals.spo2) && (
              <KV k="SpO₂" v={`${safe(vitals.spo2)} %`} />
            )}
            {nonEmpty(vitals.weight) && (
              <KV k="Weight" v={`${safe(vitals.weight)} kg`} />
            )}
            {nonEmpty(vitals.height) && (
              <KV k="Height" v={`${safe(vitals.height)} cm`} />
            )}
            {nonEmpty(vitals.bmi) && <KV k="BMI" v={safe(vitals.bmi)} />}
            {nonEmpty(vitals.lmpDate) && (
              <KV k="LMP" v={safe(vitals.lmpDate)} />
            )}
          </div>

          {(nonEmpty(vitals.bodyMeasurement?.waist) ||
            nonEmpty(vitals.bodyMeasurement?.hip) ||
            nonEmpty(vitals.bodyMeasurement?.neck) ||
            nonEmpty(vitals.bodyMeasurement?.chest)) && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                Body Measurements
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {nonEmpty(vitals.bodyMeasurement?.waist) && (
                  <KV
                    k="Waist"
                    v={`${safe(vitals.bodyMeasurement?.waist)} cm`}
                  />
                )}
                {nonEmpty(vitals.bodyMeasurement?.hip) && (
                  <KV k="Hip" v={`${safe(vitals.bodyMeasurement?.hip)} cm`} />
                )}
                {nonEmpty(vitals.bodyMeasurement?.neck) && (
                  <KV k="Neck" v={`${safe(vitals.bodyMeasurement?.neck)} cm`} />
                )}
                {nonEmpty(vitals.bodyMeasurement?.chest) && (
                  <KV
                    k="Chest"
                    v={`${safe(vitals.bodyMeasurement?.chest)} cm`}
                  />
                )}
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
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                Women’s Health
              </h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {nonEmpty(vitals.womensHealth?.lmpDate) && (
                  <KV k="LMP" v={safe(vitals.womensHealth?.lmpDate)} />
                )}
                {nonEmpty(vitals.womensHealth?.cycleLengthDays) && (
                  <KV
                    k="Cycle (days)"
                    v={safe(vitals.womensHealth?.cycleLengthDays)}
                  />
                )}
                {nonEmpty(vitals.womensHealth?.cycleRegularity) && (
                  <KV
                    k="Regularity"
                    v={safe(vitals.womensHealth?.cycleRegularity)}
                  />
                )}
                {nonEmpty(vitals.womensHealth?.gravidity) && (
                  <KV k="Gravidity" v={safe(vitals.womensHealth?.gravidity)} />
                )}
                {nonEmpty(vitals.womensHealth?.parity) && (
                  <KV k="Parity" v={safe(vitals.womensHealth?.parity)} />
                )}
                {nonEmpty(vitals.womensHealth?.abortions) && (
                  <KV k="Abortions" v={safe(vitals.womensHealth?.abortions)} />
                )}
              </div>
            </div>
          )}

          {(nonEmpty(vitals.lifestyle?.smokingStatus) ||
            nonEmpty(vitals.lifestyle?.alcoholIntake) ||
            nonEmpty(vitals.lifestyle?.dietType) ||
            nonEmpty(vitals.lifestyle?.sleepHours) ||
            nonEmpty(vitals.lifestyle?.stressLevel)) && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                Lifestyle
              </h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {nonEmpty(vitals.lifestyle?.smokingStatus) && (
                  <KV k="Smoking" v={safe(vitals.lifestyle?.smokingStatus)} />
                )}
                {nonEmpty(vitals.lifestyle?.alcoholIntake) && (
                  <KV k="Alcohol" v={safe(vitals.lifestyle?.alcoholIntake)} />
                )}
                {nonEmpty(vitals.lifestyle?.dietType) && (
                  <KV k="Diet" v={safe(vitals.lifestyle?.dietType)} />
                )}
                {nonEmpty(vitals.lifestyle?.sleepHours) && (
                  <KV k="Sleep (hrs)" v={safe(vitals.lifestyle?.sleepHours)} />
                )}
                {nonEmpty(vitals.lifestyle?.stressLevel) && (
                  <KV
                    k="Stress level"
                    v={safe(vitals.lifestyle?.stressLevel)}
                  />
                )}
              </div>
            </div>
          )}

          {anyRowHas(vitals.physicalActivity?.logs, [
            "activity",
            "durationMin",
            "intensity",
            "frequencyPerWeek",
          ]) && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                Physical Activity
              </h4>
              <ul className="list-disc ml-5 space-y-1 text-sm">
                {compactRows(vitals.physicalActivity?.logs, [
                  "activity",
                  "durationMin",
                  "intensity",
                  "frequencyPerWeek",
                ]).map((r, i) => (
                  <li key={i}>
                    {[
                      r.activity,
                      r.durationMin && `${r.durationMin} min`,
                      r.intensity,
                      r.frequencyPerWeek && `${r.frequencyPerWeek}/wk`,
                    ]
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
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                General Assessment
              </h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {nonEmpty(vitals.GeneralAssessment?.painScore) && (
                  <KV
                    k="Pain score"
                    v={safe(vitals.GeneralAssessment?.painScore)}
                  />
                )}
                {nonEmpty(vitals.GeneralAssessment?.temperatureSite) && (
                  <KV
                    k="Temp site"
                    v={safe(vitals.GeneralAssessment?.temperatureSite)}
                  />
                )}
                {nonEmpty(vitals.GeneralAssessment?.posture) && (
                  <KV k="Posture" v={safe(vitals.GeneralAssessment?.posture)} />
                )}
                {nonEmpty(vitals.GeneralAssessment?.edema) && (
                  <KV k="Edema" v={safe(vitals.GeneralAssessment?.edema)} />
                )}
                {nonEmpty(vitals.GeneralAssessment?.pallor) && (
                  <KV k="Pallor" v={safe(vitals.GeneralAssessment?.pallor)} />
                )}
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

      {/* Clinical */}
      {hasClinical && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Clinical Details</h3>
          <div className="space-y-3 text-sm">
            {nonEmpty(clinical.chiefComplaints) && (
              <Block k="Chief complaints" v={safe(clinical.chiefComplaints)} />
            )}
            {nonEmpty(clinical.pastHistory) && (
              <Block k="Past history" v={safe(clinical.pastHistory)} />
            )}
            {nonEmpty(clinical.familyHistory) && (
              <Block k="Family history" v={safe(clinical.familyHistory)} />
            )}
            {nonEmpty(clinical.allergy) && (
              <Block k="Allergy" v={safe(clinical.allergy)} />
            )}

            {anyRowHas(clinical.currentMedications, [
              "medicine",
              "dosage",
              "since",
            ]) && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">
                  Current Medications
                </h4>
                <ul className="list-disc ml-5 space-y-1">
                  {compactRows(clinical.currentMedications, [
                    "medicine",
                    "dosage",
                    "since",
                  ]).map((r, i) => (
                    <li key={i} className="text-sm">
                      {[r.medicine, r.dosage, r.since && `since ${r.since}`]
                        .filter(Boolean)
                        .join(" • ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {anyRowHas(clinical.familyHistoryRows, ["relation", "ailment"]) && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">
                  Family History (rows)
                </h4>
                <ul className="list-disc ml-5 space-y-1">
                  {compactRows(clinical.familyHistoryRows, [
                    "relation",
                    "ailment",
                  ]).map((r, i) => (
                    <li key={i} className="text-sm">
                      {[r.relation, r.ailment].filter(Boolean).join(" — ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {anyRowHas(clinical.proceduresDone, ["name", "date"]) && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">
                  Procedures Done
                </h4>
                <ul className="list-disc ml-5 space-y-1">
                  {compactRows(clinical.proceduresDone, ["name", "date"]).map(
                    (r, i) => (
                      <li key={i} className="text-sm">
                        {[r.name, r.date].filter(Boolean).join(" — ")}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {anyRowHas(clinical.investigationsDone, ["name", "date"]) && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">
                  Investigations Done
                </h4>
                <ul className="list-disc ml-5 space-y-1">
                  {compactRows(clinical.investigationsDone, [
                    "name",
                    "date",
                  ]).map((r, i) => (
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

      {/* Prescription */}
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

      {/* Plan */}
      {hasPlan && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Plan / Advice</h3>
          <div className="space-y-3 text-sm">
            {nonEmpty(plan.investigations) && (
              <Block k="Investigations" v={safe(plan.investigations)} />
            )}
            {nonEmpty(plan.investigationInstructions) && (
              <Block
                k="Investigation Instructions"
                v={safe(plan.investigationInstructions)}
              />
            )}
            {nonEmpty(plan.advice) && (
              <Block k="Advice" v={safe(plan.advice)} />
            )}
            {nonEmpty(plan.doctorNote) && (
              <Block k="Doctor’s Note" v={safe(plan.doctorNote)} />
            )}
            {nonEmpty(plan.followUpInstructions) && (
              <Block
                k="Follow-up Instructions"
                v={safe(plan.followUpInstructions)}
              />
            )}
            {nonEmpty(plan.followUpDate) && (
              <KV k="Follow-up Date" v={safe(plan.followUpDate)} />
            )}
            {nonEmpty(plan.investigationNote) && (
              <Block k="Investigation Note" v={safe(plan.investigationNote)} />
            )}
            {nonEmpty(plan.patientNote) && (
              <Block k="Patient Note" v={safe(plan.patientNote)} />
            )}

            {(plan.attachments?.files?.length ?? 0) > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">
                  Attachments
                </h4>
                <ul className="list-disc ml-5 space-y-1">
                  {(plan.attachments?.files ?? []).map((f, i) => (
                    <li key={i}>{(f as any)?.name ?? "File"}</li>
                  ))}
                </ul>
              </div>
            )}
            {nonEmpty(plan.attachments?.note) && (
              <Block k="Attachment Note" v={safe(plan.attachments?.note)} />
            )}
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
      className={[
        "px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition",
        active ? "bg-gray-900 text-white" : "hover:bg-gray-100",
      ].join(" ")}
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
        "group relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-500",
        disabled
          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          : pressed
          ? "bg-green-600 text-black border-gray-900"
          : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300",
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

function SectionCard({
  ariaLabel,
  children,
}: {
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="ui-card p-4" aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );
}

// One accent map used by BOTH RoundPill and TinyIcon
const ICON_ACCENT: Record<string, string> = {
  // existing RoundPill labels
  "Digital Rx":
    "border-blue-500 hover:bg-sky-50 text-sky-700 focus-visible:ring-sky-500",
  Immunization:
    "border-amber-500 hover:bg-emerald-50 text-emerald-700 focus-visible:ring-emerald-500",
  Discharge:
    "border-green-500 hover:bg-amber-50 text-amber-700 focus-visible:ring-amber-500",
  Lab: "border-violet-500 hover:bg-violet-50 text-violet-700 focus-visible:ring-violet-500",

  // tiny tool labels
  Save: "border-green-500 hover:bg-emerald-50 text-emerald-700 focus-visible:ring-emerald-500",
  Send: "border-pink-500 hover:bg-sky-50 text-sky-700 focus-visible:ring-sky-500",
  Print:
    "border-gray-500 hover:bg-gray-50 text-gray-700 focus-visible:ring-gray-400",
  Language:
    "border-indigo-500 hover:bg-indigo-50 text-indigo-700 focus-visible:ring-indigo-500",
};

const ICON_ACCENT_DEFAULT =
  "border-gray-300 hover:bg-gray-50 text-gray-700 focus-visible:ring-gray-400";

function RoundPill({
  img,
  label,
  onClick,
}: {
  img: string;
  label: string;
  onClick?: () => void;
}) {
  const accent = ICON_ACCENT[label] ?? ICON_ACCENT_DEFAULT;

  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        "group relative grid place-items-center",
        "w-9 h-9", // square
        "rounded-xl", // rounded-corner square
        "border-2 bg-white shadow-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        accent, // per-icon color
      ].join(" ")}
    >
      <Image
        src={img}
        alt={label}
        width={18}
        height={18}
        className="pointer-events-none"
      />
    </button>
  );
}

//----------------- Kaushikee -----------//
function TinyIcon({
  img, // e.g. "/icons/save.png"
  label,
  onClick,
  disabled,
  children, // optional fallback (old usage with inline SVGs)
}: {
  img?: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const accent = ICON_ACCENT[label] ?? ICON_ACCENT_DEFAULT;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={[
        "group relative grid place-items-center",
        "w-9 h-9", // match RoundPill size
        "rounded-xl", // match RoundPill shape
        "border-2 bg-white shadow-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled ? "opacity-50 cursor-not-allowed" : accent,
      ].join(" ")}
    >
      {img ? (
        <Image
          src={img}
          alt={label}
          width={18}
          height={18}
          className="pointer-events-none"
        />
      ) : (
        children
      )}

      {/* tooltip */}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </button>
  );
}

/* --------------------------------- Icons --------------------------------- */
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
      <div
        className="rounded-lg shadow-lg border bg-white px-4 py-3 text-sm"
        style={{ borderColor: color }}
      >
        <div className="flex items-start gap-2">
          <div className="mt-[2px]" style={{ color }}>
            {type === "success" ? "✔" : "ℹ"}
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

function PageFlip({ children }: { children: React.ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(0);

  // Keep column width equal to the visible frame width
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setColWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const page = (dir: -1 | 1) => {
    if (!scrollerRef.current || !colWidth) return;
    // 32px ≈ 2rem column gap
    scrollerRef.current.scrollBy({ left: dir * (colWidth + 32), behavior: "smooth" });
  };

  return (
    <div ref={frameRef} className="relative" style={{ height: "calc(100vh - 8rem)", minHeight: 680 }}>
      {/* Horizontal pager (no vertical scroll) */}
      <div
        ref={scrollerRef}
        className="h-full overflow-x-auto overflow-y-hidden touch-pan-x"
        style={{
          // hide scrollbar in most browsers
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {/* Columnized content: each column = one “page” */}
        <div
          className="h-full"
          style={{
            columnWidth: colWidth ? `${colWidth}px` : "800px",
            columnGap: "2rem",
            columnFill: "auto",
          }}
        >
          {/* TIP: add className="break-inside-avoid" on blocks you don’t want split */}
          {children}
        </div>
      </div>

      {/* Page flip arrows (hidden on small screens) */}
      <button
        onClick={() => page(-1)}
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow items-center justify-center"
        aria-label="Previous page"
        title="Previous"
      >
        ‹
      </button>
      <button
        onClick={() => page(1)}
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow items-center justify-center"
        aria-label="Next page"
        title="Next"
      >
        ›
      </button>
    </div>
  );
}
