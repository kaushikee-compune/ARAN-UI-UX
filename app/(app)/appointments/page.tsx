// D:\ARAN Care\ARAN UI\aran-ux\app\doctor\appointments\page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paper, Box, TextField as MuiTextField, MenuItem } from "@mui/material";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

/* =============================================================================
   Types
============================================================================= */
type Patient = {
  name: string;
  gender: "Male" | "Female" | "Other" | string;
  age: number;
  phone: string;
  abhanumber: string; // ABHA Number from /public/data/patients.json
  abhaaddress: string; // ABHA Address from /public/data/patients.json
  regDate: string; // YYYY-MM-DD
  uhid: string; // e.g., UHID-0001
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  qualifications?: string;
  bio?: string;
  room?: string;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  breakStart?: string; // "13:00"
  breakEnd?: string; // "14:00"
  booked: string[]; // array of "HH:MM" booked starts
};

type Slot = {
  time: string; // "HH:MM"
  available: boolean;
  withinWorking: boolean;
};

type BookingDraft = {
  time: string;
  patientName: string;
  mobile: string;
  abhaNumber?: string; // new
  abhaAddress?: string; // e.g., name@abdm (optional)
  uhid?: string;
  note?: string;
};

/* =============================================================================
   Utilities
============================================================================= */
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h)}:${pad(m)}`;
}
function inRange(target: number, start: number, end: number) {
  return target >= start && target < end;
}
function normalizePhone(p: string) {
  return (p || "").replace(/\D/g, "");
}

/** Build 30-minute slots between startTime..endTime excluding break window if given. */
function buildSlots(d: Doctor): Slot[] {
  const st = toMinutes(d.startTime);
  const et = toMinutes(d.endTime);
  const brS = d.breakStart ? toMinutes(d.breakStart) : null;
  const brE = d.breakEnd ? toMinutes(d.breakEnd) : null;
  const bookedSet = new Set(d.booked || []);
  const out: Slot[] = [];

  for (let t = st; t < et; t += 30) {
    const label = fromMinutes(t);
    const insideBreak =
      brS !== null && brE !== null ? inRange(t, brS, brE) : false;
    const withinWorking = !insideBreak;
    const available = withinWorking && !bookedSet.has(label);
    out.push({ time: label, available, withinWorking });
  }
  return out;
}

/** Detect the dominant intent of a free-text query. */
type QueryType = "UHID" | "MOBILE" | "NAME" | "EMPTY";
function detectQueryType(q: string): QueryType {
  const s = (q || "").trim();
  if (!s) return "EMPTY";
  const digits = normalizePhone(s);
  if (/^uhid[\s:-]?/i.test(s)) return "UHID";
  if (digits.length >= 10) return "MOBILE"; // handles +91... too
  return "NAME";
}

/** Score for sorting patient matches. */
function scorePatientMatch(p: Patient, q: string, kind: QueryType) {
  const qNorm = q.trim().toLowerCase();
  const qDigits = normalizePhone(q);
  const name = (p.name || "").toLowerCase();
  const phoneDigits = normalizePhone(p.phone || "");
  const uhid = (p.uhid || "").toLowerCase();

  let score = 0;

  if (kind === "UHID") {
    if (uhid === qNorm) score += 100;
    else if (uhid.startsWith(qNorm)) score += 90;
    else if (uhid.includes(qNorm)) score += 70;
  } else if (kind === "MOBILE") {
    if (qDigits && phoneDigits === qDigits) score += 100;
    else if (qDigits && phoneDigits.endsWith(qDigits)) score += 85;
    else if (qDigits && phoneDigits.includes(qDigits)) score += 75;
  } else if (kind === "NAME") {
    if (name === qNorm) score += 100;
    else if (name.startsWith(qNorm)) score += 90;
    else if (name.includes(qNorm)) score += 80;
  }

  // soft boosts
  if (name.includes(qNorm)) score += 5;
  if (uhid.includes(qNorm)) score += 5;
  if (qDigits && phoneDigits.includes(qDigits)) score += 5;

  return score;
}

/* =============================================================================
   Single Doctor (mock) — replace later with scheduler feed
============================================================================= */
const SINGLE_DOCTOR_DEFAULT: Doctor = {
  id: "d1",
  name: "Dr. R. Kapoor",
  specialty: "Obstetrics & Gynaecology",
  qualifications: "MBBS, MS (OBG), FMF",
  bio: "Consultant Gynecologist; fetal medicine expertise.",
  room: "OPD-2 / USG",
  startTime: "10:00",
  endTime: "18:00",
  breakStart: "14:00",
  breakEnd: "14:30",
  booked: ["11:30", "12:00", "16:30"], // demo
};

/* =============================================================================
   Page
============================================================================= */
export default function AppointmentsPage() {
  const [doctor, setDoctor] = useState<Doctor>(SINGLE_DOCTOR_DEFAULT);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  // Header bar state
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "booked" | "available">("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/data/patients.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load patients.json");
        const data = (await res.json()) as Patient[];
        if (mounted) {
          setPatients(data);
          setPatientsLoaded(true);
        }
      } catch (e: any) {
        if (mounted) setPatientsError(e?.message || "Failed to load patients.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Selection
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  const slots = useMemo(() => buildSlots(doctor), [doctor]);

  function pickSlot(time: string) {
    setSelectedSlot(time);
    setDraft({
      time,
      patientName: "",
      mobile: "",
      abhaNumber: "",
      abhaAddress: "",
      uhid: "",
      note: "",
    });
  }

  function clearSlot() {
    setSelectedSlot(null);
    setDraft(null);
  }

  function commitBooking() {
    if (!draft) return;
    if (!draft.patientName.trim() || !draft.mobile.trim()) return;

    // Persist locally; replace with API call later
    setDoctor((prev) => ({
      ...prev,
      booked: Array.from(new Set([...(prev.booked || []), draft.time])),
    }));

    // Reset form after booking
    setSelectedSlot(null);
    setDraft(null);
  }

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
        minHeight: "calc(100vh - 80px)",
      }}
    >
      {/* ---------- Header Bar (Search / Filter / Quick Booking) ---------- */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          backgroundColor: "#f9fafb",
          borderRadius: 2,
          px: 1.5,
          py: 1.2,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          mb: 3,
        }}
      >
        {/* Search patients (by name, UHID, phone, ABHA) */}
        <MuiTextField
          size="small"
          placeholder="Search (name, UHID, phone, ABHA no/address)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1, background: "white", borderRadius: 1 }}
        />

        {/* Filter (optional — by slot type or doctor) */}
        <MuiTextField
          select
          size="small"
          label="Filter"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "all" | "booked" | "available")
          }
          sx={{ minWidth: 150, background: "white", borderRadius: 1 }}
        >
          <MenuItem value="all">All Slots</MenuItem>
          <MenuItem value="booked">Booked</MenuItem>
          <MenuItem value="available">Available</MenuItem>
        </MuiTextField>

        {/* Quick Booking button */}
        <button
          style={{
            background: "var(--secondary, #64ac44)",
            color: "#fff",
            padding: "7px 16px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
          onClick={() =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            })
          }
        >
          <Plus size={16} />
          Quick Booking
        </button>
      </Box>

      {/* ---------- Section Header (Title + Slot length) ---------- */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <h1 className="text-lg font-semibold">Appointments</h1>
        <div className="text-sm text-gray-600">
          Slot length: <span className="font-medium">30 minutes</span>
        </div>
      </Box>

      {/* ---------- Main Content ---------- */}
      {!patientsLoaded && !patientsError && (
        <div className="text-sm text-gray-600 mb-4">Loading patient index…</div>
      )}
      {patientsError && (
        <div className="text-sm text-red-600 mb-4">Error: {patientsError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT: Doctor card + slot grid */}
        <div className="ui-card p-4 flex flex-col gap-4 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold">{doctor.name}</div>
              <div className="text-sm text-gray-700">
                {doctor.specialty}
                {doctor.qualifications ? ` • ${doctor.qualifications}` : ""}
              </div>
              {doctor.bio && (
                <div className="text-xs text-gray-600 mt-1">{doctor.bio}</div>
              )}
              {doctor.room && (
                <div className="text-xs text-gray-500 mt-1">
                  Room: {doctor.room}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Today</div>
              <div className="text-sm font-medium">
                {doctor.startTime}–{doctor.endTime}
              </div>
              {doctor.breakStart && doctor.breakEnd && (
                <div className="text-xs text-gray-500">
                  Break {doctor.breakStart}–{doctor.breakEnd}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-500" />
              Available
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-500" />
              Booked
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-300" />
              Unavailable
            </span>
          </div>

          {/* Slots grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {slots.map((s) => {
              const base =
                "text-xs px-2 py-1.5 rounded border text-center select-none transition";
              if (!s.withinWorking) {
                return (
                  <div
                    key={s.time}
                    className={`${base} cursor-not-allowed bg-gray-50 text-gray-400 border-gray-300`}
                    title="Not available (break/off)"
                  >
                    {s.time}
                  </div>
                );
              }
              const isBooked = !s.available;
              const isSelected = selectedSlot === s.time;
              if (isBooked) {
                return (
                  <div
                    key={s.time}
                    className={`${base} bg-red-50 text-red-900 border-red-500 cursor-not-allowed`}
                    title="Already booked"
                  >
                    {s.time}
                  </div>
                );
              }
              return (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => pickSlot(s.time)}
                  className={[
                    base,
                    isSelected
                      ? "bg-green-600 text-white border-green-700"
                      : "bg-green-50 text-green-900 border-green-500 hover:bg-green-100",
                  ].join(" ")}
                  title="Book this slot"
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Booking panel (persistent) */}
        <RightBookingPanel
          doctor={doctor}
          selectedSlot={selectedSlot}
          draft={draft}
          patients={patients}
          onDraftChange={setDraft}
          onClearSlot={clearSlot}
          onConfirm={commitBooking}
        />
      </div>
    </Paper>
  );
}

function RightBookingPanel({
  doctor,
  selectedSlot,
  draft,
  patients,
  onDraftChange,
  onClearSlot,
  onConfirm,
}: {
  doctor: Doctor;
  selectedSlot: string | null;
  draft: BookingDraft | null;
  patients: Patient[];
  onDraftChange: (d: BookingDraft | null) => void;
  onClearSlot: () => void;
  onConfirm: () => void;
}) {
  const [query, setQuery] = useState("");
  const [detected, setDetected] = useState<QueryType>("EMPTY");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    setDetected(detectQueryType(query));
  }, [query]);

  const matches = useMemo(() => {
    if (!query.trim()) return [] as Patient[];
    const kind = detected;
    return [...patients]
      .map((p) => ({ p, s: scorePatientMatch(p, query, kind) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map(({ p }) => p);
  }, [patients, query, detected]);

  const confirmDisabled =
    !draft || !(draft.patientName?.trim() && draft.mobile?.trim());
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "booked" | "available">("all");

  return (
    <div className="ui-card p-4 sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">New Appointment</h2>
        {selectedSlot && (
          <button
            onClick={onClearSlot}
            className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
          >
            Change Slot
          </button>
        )}
      </div>

      {!selectedSlot && (
        <div className="text-sm text-gray-600 py-10 text-center">
          Select an available slot from the left to start booking.
        </div>
      )}

      {selectedSlot && draft && (
        <>
          <div className="text-sm text-gray-700 mb-3">
            <div>
              <span className="font-medium">Doctor:</span>{" "}
              <span className="font-semibold">{doctor.name}</span>
            </div>
            <div>
              <span className="font-medium">Slot:</span>{" "}
              <span className="font-semibold">{selectedSlot}</span>
            </div>
          </div>

          {/* Smart search */}
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            UHID / Name / Mobile
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient..."
            className="ui-input w-full mb-2"
          />
          {query && matches.length > 0 && (
            <ul className="rounded-md max-h-40 overflow-auto mb-3">
              {matches.map((m) => (
                <li
                  key={m.uhid}
                  onClick={() => {
                    setSelectedPatient(m);
                    onDraftChange({
                      ...draft,
                      patientName: m.name,
                      mobile: m.phone,
                      abhaNumber: m.abhanumber,
                      abhaAddress: m.abhaaddress,
                      uhid: m.uhid,
                    });
                  }}
                  className="p-2 hover:bg-gray-50 cursor-pointer text-sm  last:border-0"
                >
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-500">
                    {m.uhid} • {m.phone} • {m.abhaaddress}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Material-style table form */}
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium"></th>
                  <th className="text-left px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="">
                <FormRow
                  label="Patient Name"
                  value={draft.patientName}
                  onChange={(v) => onDraftChange({ ...draft, patientName: v })}
                />
                <FormRow
                  label="Mobile"
                  value={draft.mobile}
                  onChange={(v) => onDraftChange({ ...draft, mobile: v })}
                />
                <FormRow
                  label="ABHA Number"
                  value={draft.abhaNumber ?? ""}
                  onChange={(v) => onDraftChange({ ...draft, abhaNumber: v })}
                />
                <FormRow
                  label="ABHA Address"
                  value={draft.abhaAddress ?? ""}
                  onChange={(v) => onDraftChange({ ...draft, abhaAddress: v })}
                />
                <FormRow
                  label="UHID"
                  value={draft.uhid ?? ""}
                  onChange={(v) => onDraftChange({ ...draft, uhid: v })}
                />
                <FormRow
                  label="Note"
                  textarea
                  value={draft.note ?? ""}
                  onChange={(v) => onDraftChange({ ...draft, note: v })}
                />
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {/* Left: Clear selected patient (only if one is selected) */}
            {selectedPatient ? (
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  onDraftChange({
                    ...draft,
                    patientName: "",
                    mobile: "",
                    abhaNumber: "",
                    abhaAddress: "",
                    uhid: "",
                  });
                }}
                className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
              >
                Clear selected patient
              </button>
            ) : (
              <span /> // keeps spacing even when no button
            )}

            {/* Right: Confirm Booking */}
            <button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={[
                "px-4 py-2 text-sm rounded-md font-medium shadow-sm",
                confirmDisabled
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[--secondary] text-gray-400 hover:opacity-100",
              ].join(" ")}
            >
              Confirm Booking
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* Material table row component */
function FormRow({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2 text-gray-700 w-40 align-top">{label}</td>
      <td className="px-3 py-2">
        {textarea ? (
          <textarea
            rows={2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="ui-textarea w-full"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="ui-input w-full"
          />
        )}
      </td>
    </tr>
  );
}

/* =============================================================================
   Small inputs
============================================================================= */
function TextField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="border-1 border-gray-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-1 border-gray-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
      />
    </label>
  );
}

/* =============================================================================
   Visual badge for detected input intent
============================================================================= */
function DetectBadge({ kind }: { kind: QueryType }) {
  const label =
    kind === "UHID"
      ? "UHID"
      : kind === "MOBILE"
      ? "Mobile"
      : kind === "NAME"
      ? "Name"
      : "—";
  return (
    <span className="text-[10px] px-2 py-1 border rounded bg-white">
      {label}
    </span>
  );
}
