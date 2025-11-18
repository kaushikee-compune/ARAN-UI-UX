"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/* Companion / Voice */
import CompanionToggle from "@/components/doctor/CompanionToggle";
import VoiceOverlay from "@/components/doctor/VoiceOverlay";
import ScribePanel from "@/components/doctor/ScribePanel";

/* Tools */
import ImmunizationForm from "@/components/doctor/ImmunizationForm";
import DaycareSummary from "@/components/doctor/DaycareSummary";
import LabRequestForm from "@/components/lab/LabRequestForm";

/* Common */
import UploadModal from "@/components/common/UploadModal";
import InvoiceModal from "@/components/common/InvoiceModal";
import { RoundPill } from "@/components/common/RoundPill";

/* Digital Rx Plugin Loader */
import { getDigitalRxPlugin } from "@/components/doctor/digital-rx/plugin-loader";

/* Past records button */
import PastRecordButton from "@/components/doctor/PastRecordButton";

/* Types */
import type { DigitalRxFormState } from "@/components/doctor/DigitalRxForm";

/* Icons */
//import { MicIcon, ScribeIcon, SummaryIcon } from "@/components/";

/* -------------------------------------------------------------------------- */
/*                               Types & Constants                            */
/* -------------------------------------------------------------------------- */

type CompanionMode = "off" | "form" | "voice" | "scribe";

type ActiveTool = "digitalrx" | "immunization" | "daycare" | "lab" | "none";

type CanonicalRecord = {
  id: string;
  patientId: string;
  dateISO: string;
  type: "Prescription";
  source: "digital-rx";
  canonical: any;
};

type DayRecords = {
  dateISO: string;
  items: CanonicalRecord[];
};

/* -------------------------------------------------------------------------- */
/*                            Utility functions                               */
/* -------------------------------------------------------------------------- */

const nonEmpty = (v: unknown) =>
  v !== undefined && v !== null && (typeof v !== "string" || v.trim() !== "");

const safe = (s?: string) => (nonEmpty(s) ? String(s) : "");

function compactRows<T extends Record<string, any>>(
  rows?: T[],
  keys: (keyof T)[] = []
) {
  return (rows ?? []).filter((r) =>
    keys.some((k) => nonEmpty(r?.[k as string]))
  );
}

function parseDDMMYYYY(s: string) {
  const [dd, mm, yyyy] = s.split("-").map((n) => parseInt(n, 10));
  return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
}

async function loadMockRecords(patientId?: string): Promise<CanonicalRecord[]> {
  if (typeof window === "undefined") return [];
  const res = await fetch("/data/mock-records.json", { cache: "no-store" });
  if (!res.ok) throw new Error("mock-records.json missing");
  const all = (await res.json()) as CanonicalRecord[];
  return patientId ? all.filter((r) => r.patientId === patientId) : all;
}



function groupByDate<T extends { dateISO: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  rows.forEach((r) => {
    map.set(r.dateISO, [...(map.get(r.dateISO) || []), r]);
  });
  return Array.from(map.entries())
    .sort((a, b) => parseDDMMYYYY(b[0]) - parseDDMMYYYY(a[0]))
    .map(([dateISO, items]) => ({ dateISO, items }));
}

/* Simple ID + Date helpers */
function ddmmyyyy(now = new Date()) {
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function cuidLike() {
  return `rec_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/* Sidebar collapse state sync */
const collapseSidebar = (b: boolean) => {
  try {
    localStorage.setItem("aran:sidebarCollapsed", b ? "1" : "0");
    window.dispatchEvent(new Event("aran:sidebar"));
  } catch {}
};
/* -------------------------------------------------------------------------- */
/*                             MAIN PAGE COMPONENT                            */
/* -------------------------------------------------------------------------- */

export default function DoctorConsolePage() {
  const router = useRouter();

  /* ------------------------------------------------------------ */
  /*                  Load Doctor from staff.json                  */
  /* ------------------------------------------------------------ */

  const [doctor, setDoctor] = useState<any>(null);
  const doctorId = "u1"; // TODO replace with real login user

  useEffect(() => {
    async function loadDoctor() {
      try {
        const res = await fetch("/data/staff.json");
        const list = await res.json();

        const found = list.find(
          (u: any) => u.id === doctorId && u.roles?.includes("Doctor")
        );

        setDoctor(found || null);
      } catch (e) {
        console.error("Failed to load staff.json", e);
      }
    }
    loadDoctor();
  }, []);

  console.log("Loaded doctor:", doctor);
  


  const plugin = useMemo(() => {
    const departments: string[] = doctor?.departments ?? [];
    const dept = departments[0] ?? "default";
    console.log("Plugin dept:", dept);
    return getDigitalRxPlugin(dept);
  }, [doctor]);
  

  const DigitalRxFormComponent = plugin.Form;
  const DigitalRxPreviewComponent = plugin.Preview;
  const canonicalFn = plugin.canonical;

  /* -------------------------------------------------------------------------- */
  /*               NOW it is SAFE to return early without breaking hooks        */
  /* -------------------------------------------------------------------------- */

  const doctorLoading = doctor === null;
  /* -------------------------------------------------------------------------- */
  /*                            Patient placeholder                             */
  /* -------------------------------------------------------------------------- */
  const patient = useMemo(
    () => ({
      id: "pat_001",
      name: "Ms Ananya Sharma",
      age: "34 yrs",
      gender: "Female",
      abhaNumber: "91-5510-2061-4469",
      abhaAddress: "ananya.sharma@sbx",
    }),
    []
  );

  /* -------------------------------------------------------------------------- */
  /*                                Companion Mode                              */
  /* -------------------------------------------------------------------------- */

  const [companionMode, setCompanionMode] = useState<CompanionMode>("off");

  const companionOn = companionMode !== "off";

  const handleCompanionSwitch = useCallback((v: boolean) => {
    if (v) {
      setCompanionMode("form");
      collapseSidebar(true);
      setVirtIndex(0);
    } else {
      setCompanionMode("off");
      collapseSidebar(false);
    }
  }, []);

  const pickCompanion = useCallback(
    (mode: Exclude<CompanionMode, "off">) => {
      if (!companionOn) return;
      setCompanionMode(mode);
      collapseSidebar(true);
      setVirtIndex(0);
    },
    [companionOn]
  );

  const [voiceOpen, setVoiceOpen] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                                   Tools                                    */
  /* -------------------------------------------------------------------------- */

  const [activeTool, setActiveTool] = useState<ActiveTool>("digitalrx");

  const openTool = useCallback((tool: ActiveTool) => {
    setCompanionMode("off");
    setActiveTool(tool);
    setVirtIndex(0);
    collapseSidebar(true);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                            Digital Rx Form State                           */
  /* -------------------------------------------------------------------------- */

  const INITIAL_RX: DigitalRxFormState = {
    vitals: {
      temperature: "",
      bp: "",
      bpSys: "",
      bpDia: "",
      spo2: "",
      pulse: "",
      weight: "",
      height: "",
    },
    chiefComplaintRows: [{ symptom: "", since: "", severity: "" }],
    diagnosisRows: [{ diagnosis: "", type: "", status: "" }],
    allergies: "",
    medicalHistory: "",
    investigationRows: [{ investigation: "", notes: "", status: "" }],
    procedureRows: [{ procedure: "", notes: "", status: "" }],
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
        snomedCode: "",
      },
    ],
  };

  const [rxForm, setRxForm] = useState<DigitalRxFormState>(INITIAL_RX);

  /* -------------------------------------------------------------------------- */
  /*                       🔍 Past Records (unchanged)                          */
  /* -------------------------------------------------------------------------- */

  const [pastDays, setPastDays] = useState<DayRecords[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [errorPast, setErrorPast] = useState<string | null>(null);

  const [virtIndex, setVirtIndex] = useState(0);

  const totalDays = pastDays.length;
  const totalSlots = totalDays + 1;
  const showPast = virtIndex > 0;
  const dayIdx = showPast ? Math.max(0, virtIndex - 1) : 0;

  const prevSlot = () => setVirtIndex((i) => Math.max(0, i - 1));
  const nextSlot = () => setVirtIndex((i) => Math.min(i + 1, totalDays));

  useEffect(() => {
    let alive = true;
    setLoadingPast(true);

    loadMockRecords(patient.id)
      .then((canon) => {
        if (!alive) return;
        const grouped = groupByDate(canon);
        setPastDays(grouped);
        setErrorPast(null);
      })
      .catch((e) => {
        if (!alive) return;
        setErrorPast(e?.message ?? "Failed to load records");
      })
      .finally(() => {
        if (alive) setLoadingPast(false);
      });

    // ✅ Cleanup returns void
    return () => {
      alive = false;
    };
  }, [patient.id]);

  /* -------------------------------------------------------------------------- */
  /*                  State/handlers referenced in JSX                  */
  /* -------------------------------------------------------------------------- */

  // Layout for main content
  const layout = "grid-cols-1 md:grid-cols-[minmax(0,1fr)_72px]";

  // Consultation status state (In / Pause / Done)
  const [consultStatus, setConsultStatus] = useState<
    "idle" | "active" | "paused" | "done"
  >("idle");

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);

  // Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Lab request modal
  const [showLabModal, setShowLabModal] = useState(false);

  const handleLabSubmit = (data: any) => {
    console.log("Lab submitted:", data);
    setShowLabModal(false);
  };

  // Save prescription
  const onSave = () => {
    console.log("Saving prescription…");
    // existing logic already above
  };

  // Send prescription
  const onSend = () => {
    console.log("Sending prescription…");
  };

  // Print prescription
  const onPrint = () => {
    console.log("Printing prescription…");
  };

  // Merge scribe/voice bullets
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

  /* (Remaining code continues here… just keep all hooks BEFORE return) */

  return (
    <div className="space-y-3">
      {/* ------------------------------------------------------------------ */}
      {/*                            HEADER AREA                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="ui-card px-5 py-1 mt-2 mx-4">
        <div className="flex items-center gap-2">
          {/* Doctor In/Out toggle */}
          <button
            onClick={() => console.log("Doctor in/out toggled")}
            className="btn-neutral text-xs rounded px-2 py-1 hover:bg-gray-50"
          >
            In
          </button>

          {/* Pause / Resume Toggle */}
          {consultStatus !== "paused" ? (
            <button
              title="Pause Consultation"
              onClick={() => setConsultStatus("paused")}
              className="btn-neutral text-xs rounded px-2 py-1 hover:bg-gray-50"
            >
              ❚❚
            </button>
          ) : (
            <button
              title="Resume Consultation"
              onClick={() => setConsultStatus("active")}
              className="btn-neutral text-xs rounded px-2 py-1 hover:bg-gray-50"
            >
              ►
            </button>
          )}

          {/* Queue Icon */}
          <button
            onClick={() => console.log("Queue clicked")}
            title="OPD Queue"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border bg-white hover:bg-gray-50 text-gray-900"
          >
            <img src="/icons/queue.png" className="w-5 h-5" />
          </button>

          {/* Consultation Done */}
          <button
            type="button"
            onClick={() => alert("Consultation done")}
            className="btn-accent inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-green-600 text-gray-700 hover:bg-gray-50"
          >
            Consultation Done
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Companion controls (unchanged) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Companion Mode</span>

            <CompanionToggle
              checked={companionOn}
              onChange={(v) => handleCompanionSwitch(!!v)}
              onCheckedChange={(v) => handleCompanionSwitch(!!v)}
            />

            {/* Voice */}
            <button
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full border ${
                companionMode === "voice"
                  ? "bg-green-600 text-black"
                  : "bg-white hover:bg-gray-50 text-gray-900"
              }`}
              onClick={() => {
                pickCompanion("voice");
                setVoiceOpen(true);
              }}
            >
              <MicIcon className="w-4 h-4" />
            </button>

            {/* Scribe */}
            <button
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full border ${
                companionMode === "scribe"
                  ? "bg-green-600 text-black"
                  : "bg-white hover:bg-gray-50 text-gray-900"
              }`}
              onClick={() => pickCompanion("scribe")}
            >
              <ScribeIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                           MAIN GRID AREA                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-2 px-1 md:px-6 lg:px-8">
        <div className={`grid gap-2 items-start ${layout}`}>
          {/* ================================================================== */}
          {/*                         LEFT: PREVIEW PAPER                        */}
          {/* ================================================================== */}
          <PreviewPaper
            patient={patient}
            past={{
              active: showPast,
              index: showPast ? dayIdx : 0,
              total: totalDays,
              loading: loadingPast,
              error: errorPast ?? undefined,
              day: showPast ? pastDays[dayIdx] : undefined,
              onOpen: () => setVirtIndex(1),
              onClose: () => setVirtIndex(0),
              onPrev: prevSlot,
              onNext: nextSlot,
            }}
            bodyOverride={
              !showPast &&
              activeTool === "digitalrx" &&
              companionMode === "off" ? (
                <DigitalRxFormComponent value={rxForm} onChange={setRxForm} />
              ) : undefined
            }
          />

          {/* ================================================================== */}
          {/*                      RIGHT: COMPANION PANEL                        */}
          {/* ================================================================== */}
          {companionMode === "form" && (
            <div className="hidden md:block sticky top-20 self-start w-[72px]">
              <div className="ui-card p-1.5 flex flex-col items-center gap-3">
                <RoundPill
                  label="Digital Rx"
                  img="/icons/digitalrx.png"
                  onClick={() => openTool("digitalrx")}
                  variant="green"
                />
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/*                     RIGHT: STICKY TOOLBAR                          */}
          {/* ================================================================== */}
          <aside className="hidden md:block sticky top-20 self-start w-[72px]">
            <div className="flex flex-col items-center gap-4">
              <div className="ui-card p-1.5 w-[58px] flex flex-col items-center gap-4">
                {/* Group A */}
                <RoundPill
                  label="Digital Rx"
                  img="/icons/digitalrx.png"
                  onClick={() => openTool("digitalrx")}
                  variant="green"
                />
                <RoundPill
                  label="Immunization"
                  img="/icons/syringe.png"
                  onClick={() => openTool("immunization")}
                  variant="blue"
                />
                <RoundPill
                  label="Daycare"
                  img="/icons/discharge-summary.png"
                  onClick={() => openTool("daycare")}
                  variant="blue"
                />
                <RoundPill
                  label="Lab"
                  img="/icons/lab-request.png"
                  onClick={() => setShowLabModal(true)}
                  variant="gray"
                />

                {/* Separator */}
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
                  img="/icons/rupee.png"
                  label="Payment"
                  onClick={() => setShowInvoiceModal(true)}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                         COMPANION RIGHT PANEL                        */}
      {/* ------------------------------------------------------------------ */}
      {companionMode === "form" && (
        <div className="ui-card p-4 md:hidden">
          <DigitalRxFormComponent value={rxForm} onChange={setRxForm} />
        </div>
      )}

      {companionMode === "scribe" && (
        <div className="ui-card p-4 md:hidden">
          <ScribePanel
            onSubmit={({ complaints, advice }) => {
              setRxForm((prev) => ({
                ...prev,
                chiefComplaintRows: [
                  ...(prev.chiefComplaintRows ?? []),
                  ...complaints.map((c) => ({
                    symptom: c,
                    since: "",
                    severity: "",
                  })),
                ],
                followUpText: mergeUniqueBullets(prev.followUpText, advice),
              }));
            }}
            onCancel={() => {}}
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*                             VOICE OVERLAY                           */}
      {/* ------------------------------------------------------------------ */}
      <VoiceOverlay
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSubmit={({ complaints, advice }) => {
          setRxForm((prev) => ({
            ...prev,
            chiefComplaintRows: [
              ...(prev.chiefComplaintRows ?? []),
              ...complaints.map((c) => ({
                symptom: c,
                since: "",
                severity: "",
              })),
            ],
            followUpText: mergeUniqueBullets(prev.followUpText, advice),
          }));
          setVoiceOpen(false);
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/*                           UPLOAD MODAL                              */}
      {/* ------------------------------------------------------------------ */}
      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        patient={{ name: patient.name, uhid: patient.id }}
        onUpload={(formData) => {
          console.log("Uploaded:", Object.fromEntries(formData));
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/*                           INVOICE MODAL                             */}
      {/* ------------------------------------------------------------------ */}
      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSave={(amount, patientName) => {
          console.log("Invoice saved: ", { amount, patientName });
          setShowInvoiceModal(false);
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/*                           LAB REQUEST MODAL                         */}
      {/* ------------------------------------------------------------------ */}
      {showLabModal && (
        <LabRequestForm
          isDoctorContext
          patientName={patient.name}
          onSubmit={handleLabSubmit}
          onCancel={() => setShowLabModal(false)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PREVIEW PAPER                                 */
/* -------------------------------------------------------------------------- */

function PreviewPaper({
  patient,
  past,
  bodyOverride,
}: {
  patient: any;
  past: {
    active: boolean;
    index: number;
    total: number;
    loading: boolean;
    error?: string;
    day?: DayRecords;
    onOpen: () => void;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
  };
  bodyOverride?: React.ReactNode;
}) {
  const showingPast = past.active;

  return (
    <div className="min-w-0 md:sticky md:top-20 self-start">
      <div
        className="relative mx-auto bg-white border border-gray-300 rounded-xl shadow-sm"
        style={{ minHeight: 680 }}
      >
        <div className="p-4 md:p-6">
          {/* HEADER: Patient */}
          <div className="text-sm font-semibold">{patient.name}</div>
          <div className="text-xs text-gray-700">
            {patient.gender} • {patient.age}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            ABHA No: {patient.abhaNumber}
          </div>
          <div className="text-xs text-gray-600">
            ABHA Address: {patient.abhaAddress}
          </div>

          <div className="my-3 border-t border-gray-200" />

          {/* BODY */}
          <div className="mt-2">
            {showingPast ? (
              past.loading ? (
                <div className="ui-card p-4 text-sm text-gray-500">
                  Loading…
                </div>
              ) : past.error ? (
                <div className="ui-card p-4 text-red-600">{past.error}</div>
              ) : !past.day ? (
                <div className="ui-card p-4 text-sm text-gray-500">
                  No records.
                </div>
              ) : (
                <PastRecordDay day={past.day} />
              )
            ) : (
              bodyOverride ?? (
                <div className="ui-card p-4 text-gray-400">
                  (Preview will appear here)
                </div>
              )
            )}
          </div>

          {/* NAVIGATION */}
          {showingPast && (
            <div className="flex items-center justify-between mt-4">
              <button
                className="btn-neutral text-xs px-2 py-1"
                onClick={past.onPrev}
                disabled={past.index <= 0}
              >
                ← Prev
              </button>
              <div className="text-xs">
                {past.index + 1}/{past.total}
              </div>
              <button
                className="btn-neutral text-xs px-2 py-1"
                onClick={past.onNext}
                disabled={past.index >= past.total - 1}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                     PAST RECORD (show first item canonical)                 */
/* -------------------------------------------------------------------------- */

function PastRecordDay({ day }: { day: DayRecords }) {
  const first = day.items?.[0];
  if (!first) {
    return <div className="ui-card p-4 text-gray-500">No records</div>;
  }

  const canonical = first.canonical;

  return (
    <div className="ui-card p-4">
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(canonical, null, 2)}
      </pre>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   ICONS                                    */
/* -------------------------------------------------------------------------- */

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
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300"
      title={label}
    >
      <img src={img} alt="" className="w-4 h-4" />
    </button>
  );
}

/* ------------------------------ Icons ------------------------------ */

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
