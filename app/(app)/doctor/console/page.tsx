"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import CompanionToggle from "@/components/doctor/CompanionToggle";
import VoiceOverlay from "@/components/doctor/VoiceOverlay";
import ScribePanel from "@/components/doctor/ScribePanel";
import ImmunizationForm from "@/components/doctor/ImmunizationForm";

/* External forms */
import DigitalRxForm, {
  type DigitalRxFormState as RxState,
} from "@/components/doctor/DigitalRxForm";

/* Past records tiny controller */
import PastRecordButton from "@/components/doctor/PastRecordButton";

import { generatePrescriptionPdf } from "@/lib/pdf/prescription";

/* ------------------------------ Canonical types ------------------------------ */
type DigitalRxFormState = RxState;

type CanonicalRecord = {
  id: string;
  patientId: string;
  dateISO: string; // dd-mm-yyyy
  type: "Prescription" | "Vitals" | "Immunization" | "Lab" | "DischargeSummary";
  source: "digital-rx";
  canonical: DigitalRxFormState;
};

type DayRecords = {
  dateISO: string;
  items: CanonicalRecord[];
};

/* --------------------------------- Helpers --------------------------------- */
const nonEmpty = (v: unknown) =>
  v !== undefined && v !== null && (typeof v !== "string" || v.trim() !== "");
const safe = (s?: string) => (nonEmpty(s) ? String(s) : "");

const anyRowHas = <T extends Record<string, any>>(
  rows?: T[],
  keys: (keyof T)[] = []
) => !!rows?.some((r) => keys.some((k) => nonEmpty(r?.[k as string])));

const compactRows = <T extends Record<string, any>>(
  rows?: T[],
  keys: (keyof T)[] = []
) => (rows ?? []).filter((r) => keys.some((k) => nonEmpty(r?.[k as string])));

function parseDDMMYYYY(s: string) {
  const [dd, mm, yyyy] = s.split("-").map((n) => parseInt(n, 10));
  return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
}

async function loadMockRecords(patientId?: string): Promise<CanonicalRecord[]> {
  if (typeof window === "undefined") return [];
  const res = await fetch("/data/mock-records.json", { cache: "no-store" });
  if (!res.ok)
    throw new Error("Mock JSON not found at /public/data/mock-records.json");
  const all = (await res.json()) as CanonicalRecord[];
  return patientId ? all.filter((r) => r.patientId === patientId) : all;
}

function groupByDate<T extends { dateISO: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  rows.forEach((r) => map.set(r.dateISO, [...(map.get(r.dateISO) || []), r]));
  return Array.from(map.entries())
    .sort((a, b) => parseDDMMYYYY(b[0]) - parseDDMMYYYY(a[0]))
    .map(([dateISO, items]) => ({ dateISO, items }));
}

/* -------------------------------- Constants -------------------------------- */
type TopMenuKey = "consultation" | "consent" | "queue";
type CompanionMode = "off" | "form" | "voice" | "scribe";
type ActiveTool = "none" | "digitalrx" | "immunization" | "discharge" | "lab";

/* Sidebar collapse broadcast (from your base) */
const collapseSidebar = (collapse: boolean) => {
  try {
    localStorage.setItem("aran:sidebarCollapsed", collapse ? "1" : "0");
    window.dispatchEvent(new Event("aran:sidebar"));
  } catch {}
};

/* --------------------------------- Page --------------------------------- */
const INITIAL_RX: DigitalRxFormState = {
  vitals: {
    temperature: "",
    bp: "",
    bpSys: "",
    bpDia: "",
    spo2: "",
    pulse: "",
  },
  chiefComplaints: "",
  allergies: "",
  medicalHistory: "",
  investigationAdvice: "",
  procedure: "",
  followUpText: "",
  followUpDate: "",
  medications: [
    {
      medicine: "",
      frequency: "",
      timing: "",
      duration: "",
      dosage: "",
      instruction: "",
    },
  ],
  uploads: { files: [], note: "" },
};

type ImmunizationState = {
  patient?: { name?: string; id?: string };
  entries: Array<{
    vaccine?: string;
    dose?: string;
    date?: string;
    batch?: string;
    nextDue?: string;
    notes?: string;
  }>;
};

export default function DoctorConsolePage() {
  /* Header */
  const [activeTop, setActiveTop] = useState<TopMenuKey>("consultation");

  /* Companion */
  const [companionMode, setCompanionMode] = useState<CompanionMode>("off");
  const companionOn = companionMode !== "off";

  /* Right tools */
  const [activeTool, setActiveTool] = useState<ActiveTool>("none");

  const [activeForm, setActiveForm] = useState<
    "digitalRx" | "immunization" | "lab" | null
  >(null);

  const [showImmunization, setShowImmunization] = useState(false);

  const [bpTrend, setBpTrend] = useState<
    Array<{ date: string; sys: number; dia: number }>
  >([]);

  /* Patient header (placeholder) */
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

  // Preview convenience (kept so you don’t get unused-vars errors elsewhere)
  const [previewChiefComplaints, setPreviewChiefComplaints] = useState<
    string[]
  >([]);
  const [previewDoctorNote, setPreviewDoctorNote] = useState<string[]>([]);

  /* Digital Rx form (live) */
  const [rxForm, setRxForm] = useState<DigitalRxFormState>(INITIAL_RX);

  /* Past records */
  const [pastDays, setPastDays] = useState<DayRecords[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [errorPast, setErrorPast] = useState<string | null>(null);

  const doctor = useMemo(
    () => ({
      name: "Dr. A. Banerjee",
      regNo: "KMC/2011/12345",
      specialty: "Internal Medicine",
      qualifications: "MBBS, MD",
    }),
    []
  );

  const clinic = useMemo(
    () => ({
      name: "Sushila Mathrutva Clinic",
      address: "Banashankari, Bengaluru, KA 560070",
      phone: "+91 97420 00134",
      website: "sushilamathrutvaclinic.com",
    }),
    []
  );

  /*** Voice Overlay Code */
  // Voice overlay
  const [voiceOpen, setVoiceOpen] = useState(false);

  const handleVoiceInsert = useCallback(
    (target: "chiefComplaints" | "doctorNote", text: string) => {
      const t = (text || "").trim();
      if (!t) {
        setVoiceOpen(false);
        return;
      }

      setRxForm((prev) => {
        if (target === "chiefComplaints") {
          const prevCC = prev.chiefComplaints || "";
          const merged = [prevCC, t].filter(Boolean).join(prevCC ? " " : "");
          return { ...prev, chiefComplaints: merged };
        }

        // doctorNote maps to followUpText in the new flat structure
        const prevNote = prev.followUpText || "";
        const merged = [prevNote, t].filter(Boolean).join(prevNote ? " " : "");
        return { ...prev, followUpText: merged };
      });

      setVoiceOpen(false);
    },
    []
  );

  /* ---------- NEW: merge bullets helper for Scribe submit (dedupe + bullets) ---------- */
  function mergeUniqueBullets(existing: string | undefined, items: string[]) {
    const clean = (s: string) => s.replace(/^[•\-\s]+/, "").trim();
    const current = (existing || "").split(/\n+/).map(clean).filter(Boolean);
    const next = [...current];
    for (const it of items) {
      const c = clean(it);
      if (c && !next.includes(c)) next.push(c);
    }
    return next.map((t) => `• ${t}`).join("\n");
  }

  /**
   * VIRTUAL INDEX for PastRecordButton:
   *   0 ............. = CURRENT (live / blank preview)
   *   1..totalDays .. = pastDays[0..totalDays-1]
   */
  const [virtIdx, setVirtIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoadingPast(true);
    loadMockRecords("pat_001")
      .then((canon) => {
        if (!alive) return;

        // Group by date for Past Records viewer
        const grouped = groupByDate(canon);
        setPastDays(grouped);
        setErrorPast(null);

        // ✅ Prefill Allergies + Medical History from the LATEST record that has them
        const latest = canon
          .slice()
          .reverse()
          .find(
            (r) =>
              (r.canonical?.allergies && r.canonical.allergies.trim() !== "") ||
              (r.canonical?.medicalHistory &&
                r.canonical.medicalHistory.trim() !== "")
          );

        if (latest) {
          setRxForm((prev) => ({
            ...prev,
            allergies: latest.canonical.allergies || prev.allergies,
            medicalHistory:
              latest.canonical.medicalHistory || prev.medicalHistory,
          }));
        }

        // ✅ Derive BP trend from all available vitals
        const bpData = canon
          .map((r) => {
            const v = r.canonical?.vitals || {};
            const sys = parseFloat(v.bpSys || "");
            const dia = parseFloat(v.bpDia || "");
            if (!isNaN(sys) && !isNaN(dia)) {
              return { date: r.dateISO, sys, dia };
            }
            return null;
          })
          .filter(Boolean) as Array<{ date: string; sys: number; dia: number }>;

        setBpTrend(bpData);
      })
      .catch((e: any) => {
        if (!alive) return;
        setErrorPast(e?.message ?? "Failed to load mock data");
      })
      .finally(() => alive && setLoadingPast(false));
    return () => {
      alive = false;
    };
  }, []);

  const totalDays = pastDays.length;
  const totalSlots = totalDays + 1; // include "0 = current"
  const clampDayIdx = (i: number) =>
    totalDays === 0 ? 0 : Math.min(Math.max(i, 0), totalDays - 1);
  const clampVirt = (i: number) =>
    totalSlots === 0 ? 0 : Math.min(Math.max(i, 0), totalSlots - 1);

  const showPast = virtIdx > 0;
  const dayIdx = showPast ? clampDayIdx(virtIdx - 1) : 0;

  const prevSlot = () => setVirtIdx((i) => Math.max(i - 1, 0));
  const nextSlot = () => setVirtIdx((i) => Math.min(i + 1, totalDays));

  /* Actions */
  const onSave = useCallback(() => {
    // 1) Make a canonical record from the current DigitalRx form
    const record: CanonicalRecord = {
      id: cuidLike(),
      patientId: "pat_001", // same patient your mock loader filters by
      dateISO: ddmmyyyy(new Date()), // groups under "today"
      type: "Prescription",
      source: "digital-rx",
      canonical: rxForm, // snapshot of what you just filled
    };

    setPastDays((prev) => {
      // If the first day is today, prepend into that day
      if (prev.length > 0 && prev[0].dateISO === record.dateISO) {
        const updatedFirstDay: DayRecords = {
          dateISO: prev[0].dateISO,
          items: [record, ...prev[0].items],
        };
        return [updatedFirstDay, ...prev.slice(1)];
      }
      // Otherwise create a new "today" bucket and put it at the top
      return [{ dateISO: record.dateISO, items: [record] }, ...prev];
    });

    // 3) Reset the live/current tab so it’s blank again
    setRxForm(INITIAL_RX);

    // 4) Optional UX: immediately show Past view on the new entry (1/N)
    //    If you prefer to stay on the live blank form, change 1 -> 0.
    setVirtIdx(1);

    // (Optional) close companion or keep it — leaving as-is to not surprise the user
    console.log("Saved to Past Records.");
  }, [rxForm]);

  const onSend = useCallback(() => console.log("Send (no-op)"), []);
  const onPrint = useCallback(() => {
    // Creates and downloads a PDF using current DigitalRxForm + patient context
    generatePrescriptionPdf({
      rx: rxForm,
      patient,
      doctor,
      clinic,
    });
  }, [rxForm, patient, doctor, clinic]);
  const onLanguage = useCallback(() => console.log("Language (no-op)"), []);

  /* Companion switch + picks */
  const handleCompanionSwitch = useCallback((checked: boolean) => {
    if (checked) {
      setCompanionMode("form"); // default ON → Form
      setActiveTool("none");
      collapseSidebar(true);
      setVirtIdx(0); // leave any past-view, back to current
    } else {
      setCompanionMode("off");
      setActiveTool("none");
      collapseSidebar(false);
    }
  }, []);

  const pickCompanion = useCallback(
    (mode: Extract<CompanionMode, "form" | "voice" | "scribe">) => {
      if (!companionOn) return;
      setCompanionMode(mode);
      setActiveTool("none");
      setVirtIdx(0); // leave past when changing companion view
      collapseSidebar(true);
    },
    [companionOn]
  );

  /* Tool open — clicking DigitalRx must return to form-in-preview */
  const openTool = useCallback((tool: ActiveTool) => {
    setCompanionMode("off");
    setActiveTool(tool);
    setVirtIdx(0); // ALWAYS leave past view
    collapseSidebar(true);
  }, []);

  /* Layout (kept from your base file, but simplified for no tabs/filters) */
  const layout =
    companionMode === "scribe"
      ? "grid-cols-1 md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)_72px]"
      : companionMode === "form"
      ? "grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_72px]"
      : activeTool !== "none"
      ? "grid-cols-1 md:grid-cols-[minmax(0,1fr)_72px]"
      : "grid-cols-1 md:grid-cols-[minmax(0,1fr)_72px]";

  return (
    <div className="space-y-3">
      {/* ------------------------------- Header Panel ------------------------------- */}
      <div className="ui-card px-5 py-1  mt-2 mx-4">
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

          {/* Companion cluster (right) */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600">Companion Mode</span>
            <CompanionToggle
              checked={companionOn}
              onChange={(v) => handleCompanionSwitch(!!v)}
              onCheckedChange={(v) => handleCompanionSwitch(!!v)}
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
              onClick={() => {
                // keep your current companion selection behavior
                pickCompanion("voice");
                // open the voice overlay modal
                setVoiceOpen(true);
              }}
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

      {/* --------------------- Main Area & Sticky Right Toolbar --------------------- */}
      <div className="mt-2 px-1 md:px-6 lg:px-8">
        <div className={`grid gap-2 items-start ${layout}`}>
          {/* LEFT: Preview paper (NO tabs, NO filter) */}
          <PreviewPaper
            patient={patient}
            /* Embed form inside paper body depending on active tool */
            bodyOverride={
              virtIdx === 0 && companionMode === "off" ? (
                activeTool === "digitalrx" ? (
                  <DigitalRxForm
                    value={rxForm}
                    onChange={setRxForm}
                    bpHistory={bpTrend}
                  />
                ) : activeTool === "immunization" ? (
                  <ImmunizationForm />
                ) : // ) : activeTool === "lab" ? (
                //   <LabRequestForm />
                // ) : activeTool === "discharge" ? (
                //   <DischargeSummaryForm />
                undefined
              ) : undefined
            }
            /* Only show live DigitalRx preview when the DigitalRx tool is active */
            payload={
              virtIdx === 0 && activeTool === "digitalrx" ? rxForm : undefined
            }
            /* Past records control & data (derived from virtual slot) */
            past={{
              active: virtIdx > 0,
              index: virtIdx > 0 ? virtIdx - 1 : 0,
              total: totalDays,
              loading: loadingPast,
              error: errorPast ?? undefined,
              day: virtIdx > 0 ? pastDays[virtIdx - 1] : undefined,
              onOpen: () => setVirtIdx(1),
              onClose: () => setVirtIdx(0),
              onPrev: prevSlot,
              onNext: nextSlot,
            }}
          />

          {/* RIGHT panel appears ONLY in Companion modes (split screen) */}
          {companionMode === "form" && (
            <SectionCard ariaLabel="Consultation form (Companion)">
              <DigitalRxForm
                value={rxForm}
                onChange={setRxForm}
                bpHistory={bpTrend}
              />
            </SectionCard>
          )}

          {companionMode === "scribe" && (
            <SectionCard ariaLabel="Scribe editor">
              <ScribePanel
                onSubmit={({ complaints, advice }) => {
                  setPreviewChiefComplaints(complaints);
                  setPreviewDoctorNote(advice);
                  setRxForm((prev) => {
                    const next: DigitalRxFormState = {
                      ...prev,
                      chiefComplaints: mergeUniqueBullets(
                        prev.chiefComplaints,
                        complaints
                      ),
                      followUpText: mergeUniqueBullets(
                        prev.followUpText,
                        advice
                      ),
                    };
                    return next;
                  });
                }}
                onCancel={() => {}}
              />
            </SectionCard>
          )}

          {/* RIGHT: Sticky toolbar (always on md+) */}
          <aside className="hidden md:block sticky top-20 self-start w-[72px]">
            <div className="flex flex-col items-center gap-4">
              <div className="ui-card p-1.5 w-[58px] flex flex-col items-center gap-2">
                {/* Group A */}
                <RoundPill
                  label=""
                  img="/icons/digitalrx.png"
                  onClick={() => openTool("digitalrx")}
                  variant="green"
                />
                <RoundPill
                  label=""
                  img="/icons/syringe.png"
                  onClick={() => openTool("immunization")}
                  variant="pink"
                />
                <RoundPill
                  label=""
                  img="/icons/discharge-summary.png"
                  onClick={() => openTool("discharge")}
                  variant="blue"
                />
                <RoundPill
                  label=""
                  img="/icons/lab-request.png"
                  onClick={() => openTool("lab")}
                  variant="gray"
                />

                {/* Divider */}
                <div className="my-10 h-px w-full bg-gray-300" />

                {/* Group B */}
                <TinyIcon img="/icons/save.png" label="Save" onClick={onSave} />
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

      <VoiceOverlay
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSubmit={({ complaints, advice }) => {
          // Update DigitalRx form fields (Chief Complaints + Doctor’s Note + Advice)
          setRxForm((prev) => ({
            ...prev,
            chiefComplaints: mergeUniqueBullets(
              prev.chiefComplaints,
              complaints
            ),
            followUpText: mergeUniqueBullets(prev.followUpText, advice),
          }));

          setVoiceOpen(false);
        }}
      />
    </div>
  );
}

/* -------------------------------- Preview -------------------------------- */
function PreviewPaper({
  patient,
  payload,
  bodyOverride,
  past,
}: {
  patient: {
    name: string;
    age: string;
    gender: string;
    abhaNumber: string;
    abhaAddress: string;
  };
  payload?: DigitalRxFormState;
  bodyOverride?: React.ReactNode;
  past: {
    active: boolean;
    index: number; // 0..total-1 (0 = current)
    total: number; // total slots incl. current
    loading: boolean;
    error?: string;
    day?: DayRecords;
    onOpen: () => void;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
  };
}) {
  const showingPast = past.active;

  return (
    <div className="min-w-0 md:sticky md:top-20 self-start">
      <div
        className="relative mx-auto bg-white border border-gray-300 rounded-xl shadow-sm overflow-visible"
        style={{
          minHeight: 680,
          background: "linear-gradient(180deg,#ffffff 0%,#fcfcfc 100%)",
        }}
      >
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
            <Image
              src="/icons/logo.png"
              alt="Test Clinic"
              width={40}
              height={40}
            />

            <div className="flex items-start justify-end pl-3">
              <div className="flex flex-col items-end gap-2">
                <button
                  className="inline-flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900"
                  title="Open Patient Summary"
                  type="button"
                >
                  <SummaryIcon className="w-4 h-4" />
                  <span className="font-medium">Patient Summary</span>
                </button>
                {/* Just below Patient Summary: either CTA or the pager */}
                {!past.active ? (
                  <button
                    type="button"
                    onClick={past.onOpen}
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-green-600 text-gray-700 hover:bg-gray-50"
                  >
                    View Past Record
                  </button>
                ) : (
                  <div className="backdrop-blur bg-white/70 border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                    <PastRecordButton
                      active={past.active}
                      index={past.index}
                      total={past.total}
                      onOpen={past.onClose} /* close back to live */
                      onPrev={past.onPrev}
                      onNext={past.onNext}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="my-3 border-t border-gray-200" />

          {/* Record body */}
          <div className="mt-2">
            {showingPast ? (
              past.loading ? (
                <div className="ui-card p-4 text-sm text-gray-500">
                  Loading past records…
                </div>
              ) : past.error ? (
                <div className="ui-card p-4 text-sm text-red-600">
                  Error: {past.error}
                </div>
              ) : past.total === 0 || !past.day ? (
                <div className="ui-card p-4 text-sm text-gray-500">
                  No past records available.
                </div>
              ) : (
                <PastRecordsPanel day={past.day} />
              )
            ) : (
              bodyOverride ?? <LivePreview payload={payload} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Past Records (per selected day) -------------------- */
function PastRecordsPanel({ day }: { day: DayRecords }) {
  // Show the canonical DigitalRx-mapped preview for this date
  const first = day?.items?.[0];
  const payload = first?.canonical;
  return <LivePreview payload={payload} />;
}

/* ------------------------------ Live Preview ------------------------------ */
function LivePreview({ payload }: { payload?: DigitalRxFormState }) {
  if (!payload) {
    return (
      <div className="ui-card p-4 text-sm text-gray-700 min-h-[320px]">
        <div className="text-gray-400">
          (Blank preview — start typing in the form or select a past record.)
        </div>
      </div>
    );
  }

  const {
    vitals = {},
    chiefComplaints = "",
    allergies = "",
    medicalHistory = "",
    investigationAdvice = "",
    procedure = "",
    followUpText = "",
    followUpDate = "",
    medications = [],
    uploads = { files: [], note: "" },
  } = payload;

  const rxRows = compactRows(medications, [
    "medicine",
    "frequency",
    "dosage",
    "duration",
    "instruction",
  ]);

  const hasVitals =
    nonEmpty(vitals.temperature) ||
    nonEmpty(vitals.bp) ||
    (nonEmpty(vitals.bpSys) && nonEmpty(vitals.bpDia)) ||
    nonEmpty(vitals.spo2) ||
    nonEmpty(vitals.pulse);

  const hasClinical =
    nonEmpty(chiefComplaints) ||
    nonEmpty(allergies) ||
    nonEmpty(medicalHistory) ||
    nonEmpty(investigationAdvice) ||
    nonEmpty(procedure) ||
    nonEmpty(followUpText) ||
    nonEmpty(followUpDate);

  const hasRx = rxRows.length > 0;

  const hasPlan =
    nonEmpty(followUpText) ||
    nonEmpty(followUpDate) ||
    (uploads?.files?.length ?? 0) > 0 ||
    nonEmpty(uploads?.note);

  const showVitals = hasVitals;
  const showClinical = hasClinical;
  const showRx = rxRows.length > 0;
  const showPlan = hasPlan;

  const nothing = !showVitals && !showClinical && !showRx && !showPlan;
  if (nothing) {
    return (
      <div className="ui-card p-4 text-sm text-gray-700 min-h-[320px]">
        <div className="text-gray-400">
          (Nothing to preview for the current record.)
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🩺 Vitals */}
      {showVitals && (
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
                    ? `${safe(vitals.bp)} mmHg`
                    : `${safe(vitals.bpSys)}/${safe(vitals.bpDia)} mmHg`
                }
              />
            )}
            {nonEmpty(vitals.spo2) && (
              <KV k="SpO₂" v={`${safe(vitals.spo2)} %`} />
            )}
            {nonEmpty(vitals.pulse) && (
              <KV k="Pulse" v={`${safe(vitals.pulse)} bpm`} />
            )}
          </div>
        </section>
      )}

      {/* 🧾 Clinical Summary */}
      {showClinical && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Clinical Summary</h3>
          <div className="space-y-2 text-sm">
            {nonEmpty(chiefComplaints) && (
              <Block k="Chief Complaints" v={safe(chiefComplaints)} />
            )}
            {nonEmpty(allergies) && <Block k="Allergies" v={safe(allergies)} />}
            {nonEmpty(medicalHistory) && (
              <Block k="Medical History" v={safe(medicalHistory)} />
            )}
            {nonEmpty(investigationAdvice) && (
              <Block k="Investigation Advice" v={safe(investigationAdvice)} />
            )}
            {nonEmpty(procedure) && <Block k="Procedure" v={safe(procedure)} />}
          </div>
        </section>
      )}

      {/* 💊 Prescription */}
      {showRx && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Medications</h3>
          <div className="overflow-auto rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-2 py-1.5 text-left font-medium">
                    Medicine
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Frequency
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">Timings</th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Duration
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">Dosage</th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Instructions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(rxRows ?? []).length > 0 ? (
                  rxRows.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1.5 font-medium">
                        {safe(m.medicine)}
                      </td>
                      <td className="px-2 py-1.5">{safe(m.frequency)}</td>
                      <td className="px-2 py-1.5">{safe(m.timing)}</td>
                      <td className="px-2 py-1.5">{safe(m.duration)}</td>
                      <td className="px-2 py-1.5">{safe(m.dosage)}</td>
                      <td className="px-2 py-1.5">{safe(m.instruction)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-500 py-2 text-xs"
                    >
                      No medications added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 🩹 Follow-up & Attachments */}
      <section className="ui-card p-4">
        <h3 className="text-sm font-semibold mb-3">Follow-Up & Advice</h3>
        <div className="space-y-3 text-sm">
          {nonEmpty(followUpText) && (
            <Block k="Doctor’s Note / Advice" v={safe(followUpText)} />
          )}
          {nonEmpty(followUpDate) && (
            <KV k="Next Follow-Up Date" v={safe(followUpDate)} />
          )}

          {(uploads?.files?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                Attachments
              </h4>
              <ul className="list-disc ml-5 space-y-1">
                {(uploads?.files ?? []).map((f, i) => (
                  <li key={i}>{(f as any)?.name ?? "File"}</li>
                ))}
              </ul>
            </div>
          )}
          {nonEmpty(uploads?.note) && (
            <Block k="Attachment Note" v={safe(uploads?.note)} />
          )}
        </div>
      </section>
    </div>
  );
}

/* ----------------------------- Small preview UI ---------------------------- */
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

/* --------------------------------- UI bits -------------------------------- */
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
      type="button"
    >
      {children}
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
        disabled
          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          : pressed
          ? "bg-green-600 text-black border-gray-900"
          : "bg-white text-gray-900 hover:bg-gray-50 border-gray-300",
      ].join(" ")}
      title={label}
      aria-label={label}
      type="button"
    >
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </button>
  );
}

type PillVariant = "green" | "pink" | "blue" | "gray";
const VARIANT = {
  green:
    "border-green-500 text-green-700 hover:bg-green-50 focus-visible:ring-green-400",
  pink: "border-pink-500 text-pink-700 hover:bg-pink-50 focus-visible:ring-pink-400",
  blue: "border-blue-500 text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-400",
  amber:
    "border-amber-500 text-amber-700 hover:bg-amber-50 focus-visible:ring-amber-400",
  gray: "border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400",
} as const;

export function RoundPill({
  img,
  label,
  onClick,
  variant = "gray",
}: {
  img: string;
  label: string;
  onClick?: () => void;
  variant?: PillVariant;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      type="button"
      className={[
        "group relative grid place-items-center overflow-visible",
        "w-9 h-9 rounded-xl border-1 bg-white shadow-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        VARIANT[variant],
      ].join(" ")}
    >
      <Image
        src={img}
        alt={label}
        width={18}
        height={18}
        className="pointer-events-none"
      />

      {/* ---------- Plain text label on hover ---------- */}
      <span
        className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[11px] text-black font-medium 
                   opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-20"
      >
        {label}
      </span>
    </button>
  );
}



function TinyIcon({
  img,
  label,
  onClick,
}: {
  img: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
      title={label}
      aria-label={label}
      type="button"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" className="w-4 h-4" />
    </button>
  );
}

/* --------------------------------- Icons --------------------------------- */
function FormIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 3h10l6 6v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm10 1v5h5" />
    </svg>
  );
}
function MicIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm7-3a7 7 0 0 1-14 0H3a9 9 0 0 0 18 0h-2zM11 19h2v3h-2z" />
    </svg>
  );
}
function ScribeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 4h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0 4h10v2H4z" />
    </svg>
  );
}
function SummaryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 5h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0 4h10v2H4z" />
    </svg>
  );
}

/* ------------------------------- Scribe mock ------------------------------- */
// function ScribePanel({
//   onPayload,
// }: {
//   onPayload: (p: { doctorNote?: string }) => void;
// }) {
//   const [note, setNote] = useState("");
//   return (
//     <div className="space-y-2">
//       <textarea
//         value={note}
//         onChange={(e) => setNote(e.target.value)}
//         className="w-full h-40 rounded border p-2 text-sm"
//         placeholder="Type scribe note here…"
//       />
//       <button
//         className="px-3 py-1.5 bg-gray-900 text-white rounded text-sm"
//         onClick={() => onPayload({ doctorNote: note })}
//         type="button"
//       >
//         Analyze
//       </button>
//     </div>
//   );
// }
function ddmmyyyy(now = new Date()) {
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function cuidLike() {
  return `rec_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
