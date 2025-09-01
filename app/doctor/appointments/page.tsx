// D:\ARAN Care\ARAN UI\aran-ux\app\doctor\appointments\page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ============================================================================
   Types
============================================================================ */
type Patient = {
  name: string;
  gender: "Male" | "Female" | "Other" | string;
  age: number;
  phone: string;
  abha: string;    // using this as ABHA Address for now
  regDate: string; // YYYY-MM-DD
  uhid: string;    // e.g., UHID-0001
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  qualifications?: string;
  bio?: string;
  room?: string;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  breakStart?: string; // "13:00"
  breakEnd?: string;   // "14:00"
  booked: string[];  // array of "HH:MM" booked starts
};

type Slot = {
  time: string;         // "HH:MM"
  available: boolean;
  withinWorking: boolean;
};

type BookingDraft = {
  doctorId: string;
  time: string;
  patientName: string;
  mobile: string;
  uhid?: string;
  abhaAddress?: string;
  note?: string;
};

/* ============================================================================
   Utilities
============================================================================ */
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
  return (p || "").replace(/\D/g, ""); // digits only
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
  if (digits.length >= 10) return "MOBILE"; // Indian mobiles → 10 digits (allow +91)
  return "NAME";
}

/** Rank matches based on query & intent; higher score first. */
function scorePatientMatch(p: Patient, q: string, kind: QueryType) {
  const qNorm = q.trim().toLowerCase();
  const qDigits = normalizePhone(q);
  const name = (p.name || "").toLowerCase();
  const phoneDigits = normalizePhone(p.phone || "");
  const uhid = (p.uhid || "").toLowerCase();

  let score = 0;

  // Strong signals based on detected type
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

  // Weak cross-field signals to keep relevant results visible
  if (name.includes(qNorm)) score += 5;
  if (uhid.includes(qNorm)) score += 5;
  if (qDigits && phoneDigits.includes(qDigits)) score += 5;

  return score;
}

/* ============================================================================
   Mock Doctors (replace later with real scheduler feed)
============================================================================ */
const MOCK_DOCTORS: Doctor[] = [
  {
    id: "d1",
    name: "Dr. Vikram Sarabhai",
    specialty: "Internal Medicine",
    qualifications: "MBBS, MD",
    bio: "General physician with focus on chronic care.",
    room: "OPD-1",
    startTime: "09:00",
    endTime: "17:00",
    breakStart: "13:00",
    breakEnd: "14:00",
    booked: ["10:00", "10:30", "15:00"], // demo
  },
  // {
  //   id: "d2",
  //   name: "Dr. R. Kapoor",
  //   specialty: "Obstetrics & Gynaecology",
  //   qualifications: "MBBS, MS (OBG), FMF",
  //   bio: "Consultant Gynecologist; fetal medicine expertise.",
  //   room: "OPD-2 / USG",
  //   startTime: "10:00",
  //   endTime: "18:00",
  //   breakStart: "14:00",
  //   breakEnd: "14:30",
  //   booked: ["11:30", "12:00", "16:30"], // demo
  // },
];

/* ============================================================================
   Page
============================================================================ */
export default function AppointmentsPage() {
  // Doctors (local “db” until wired to scheduler)
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS);

  // Patients loaded from /public/data/patients.json
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);

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
        if (mounted) {
          setPatientsError(e?.message || "Failed to load patients.");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Slide-in panel state
  const [openPanel, setOpenPanel] = useState(false);
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  const doctorSlots = useMemo(() => {
    return doctors.map((d) => ({ doctor: d, slots: buildSlots(d) }));
  }, [doctors]);

  function startBooking(doctorId: string, time: string) {
    setDraft({
      doctorId,
      time,
      patientName: "",
      mobile: "",
      uhid: undefined,
      abhaAddress: "",
      note: "",
    });
    setOpenPanel(true);
  }

  function closePanel() {
    setOpenPanel(false);
    setDraft(null);
  }

  function commitBooking() {
    if (!draft) return;
    if (!draft.patientName.trim() || !draft.mobile.trim()) return;

    // Persist locally; replace with API when ready
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === draft.doctorId
          ? {
              ...d,
              booked: Array.from(new Set([...(d.booked || []), draft.time])),
            }
          : d
      )
    );
    closePanel();
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Appointments</h1>
        <div className="text-sm text-gray-600">
          Slot length: <span className="font-medium">30 minutes</span>
        </div>
      </div>

      {/* Patients loader status (simple) */}
      {!patientsLoaded && !patientsError && (
        <div className="text-sm text-gray-600">Loading patient index…</div>
      )}
      {patientsError && (
        <div className="text-sm text-red-600">Error: {patientsError}</div>
      )}

      {/* Doctor Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {doctorSlots.map(({ doctor, slots }) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            slots={slots}
            onPick={(time) => startBooking(doctor.id, time)}
          />
        ))}
      </div>

      {/* Slide-in Booking Panel */}
      <BookingPanel
        open={openPanel}
        draft={draft}
        patients={patients}
        onDraftChange={setDraft}
        onClose={closePanel}
        onConfirm={commitBooking}
      />
    </div>
  );
}

/* ============================================================================
   Components
============================================================================ */
function DoctorCard({
  doctor,
  slots,
  onPick,
}: {
  doctor: Doctor;
  slots: Slot[];
  onPick: (time: string) => void;
}) {
  return (
    <div className="ui-card p-4 flex flex-col gap-4">
      {/* Doctor header */}
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
            <div className="text-xs text-gray-500 mt-1">Room: {doctor.room}</div>
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
          if (s.available) {
            return (
              <button
                key={s.time}
                type="button"
                onClick={() => onPick(s.time)}
                className={`${base} bg-green-50 text-green-900 border-green-500 hover:bg-green-100`}
                title="Book this slot"
              >
                {s.time}
              </button>
            );
          }
          return (
            <div
              key={s.time}
              className={`${base} bg-red-50 text-red-900 border-red-500 cursor-not-allowed`}
              title="Already booked"
            >
              {s.time}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   Booking Panel with "intelligent" UHID/Name/Mobile input
============================================================================ */
function BookingPanel({
  open,
  draft,
  patients,
  onDraftChange,
  onClose,
  onConfirm,
}: {
  open: boolean;
  draft: BookingDraft | null;
  patients: Patient[];
  onDraftChange: (d: BookingDraft | null) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [query, setQuery] = useState("");
  const [detected, setDetected] = useState<QueryType>("EMPTY");
  const [selected, setSelected] = useState<Patient | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setQuery("");
      setDetected("EMPTY");
      setSelected(null);
    }
  }, [open]);

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

  function applyPatient(p: Patient) {
    setSelected(p);
    if (!draft) return;
    onDraftChange({
      ...draft,
      patientName: p.name,
      mobile: p.phone,
      abhaAddress: p.abha,
      uhid: p.uhid,
    });
  }

  function clearPatient() {
    setSelected(null);
    if (!draft) return;
    onDraftChange({
      ...draft,
      patientName: "",
      mobile: "",
      abhaAddress: "",
      uhid: undefined,
    });
  }

  // Press Enter to accept the top suggestion if present
  function handleQueryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && matches.length > 0) {
      e.preventDefault();
      applyPatient(matches[0]);
    }
  }

  const disabled =
    !draft ||
    !(draft.patientName?.trim() && draft.mobile?.trim()); // enable once filled (e.g., via selection)

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 bg-black/30 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={[
          "fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-xl",
          "transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">New Appointment</div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-2 py-1 rounded border hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          {/* Slot & Doctor */}
          {draft && (
            <div className="px-4 pt-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Doctor:</span>{" "}
                <span className="font-semibold">{doctorName(draft.doctorId)}</span>
              </div>
              <div>
                <span className="font-medium">Slot:</span>{" "}
                <span className="font-semibold">{draft.time}</span>
              </div>
            </div>
          )}

          {/* Intelligent Patient Picker */}
          <div className="p-4 space-y-3 overflow-auto">
            <div className="grid gap-1 text-sm">
              <label className="text-gray-700">
                UHID / Name / Mobile (smart search)
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleQueryKeyDown}
                  placeholder="Type UHID (e.g., UHID-0001), patient name, or mobile…"
                  className="flex-1 border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
                />
                <DetectBadge kind={detected} />
              </div>

              {/* Suggestions */}
              {query && matches.length > 0 && (
                <ul
                  ref={listRef}
                  className="mt-2 max-h-56 overflow-auto border rounded"
                >
                  {matches.map((m) => (
                    <li
                      key={m.uhid}
                      className="p-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      onClick={() => applyPatient(m)}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{m.name}</div>
                        <div className="text-xs text-gray-600 truncate">
                          {m.uhid} • {m.phone} • ABHA: {m.abha}
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 border rounded">
                        Select
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {query && matches.length === 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  No matches found. Keep typing or add manually below.
                </div>
              )}
            </div>

            {/* Auto-filled Patient Details (editable) */}
            {draft && (
              <div className="mt-2 grid gap-3">
                <TextField
                  label="Patient Name"
                  value={draft.patientName}
                  onChange={(v) => onDraftChange({ ...draft, patientName: v })}
                  autoFocus={false}
                />
                <TextField
                  label="Mobile"
                  value={draft.mobile}
                  onChange={(v) => onDraftChange({ ...draft, mobile: v })}
                  inputMode="tel"
                  placeholder="10-digit mobile"
                />
                <TextField
                  label="UHID"
                  value={draft.uhid ?? ""}
                  onChange={(v) => onDraftChange({ ...draft, uhid: v })}
                  placeholder="UHID-0000"
                />
                <TextField
                  label="ABHA Address"
                  value={draft.abhaAddress ?? ""}
                  onChange={(v) => onDraftChange({ ...draft, abhaAddress: v })}
                  placeholder="e.g., name@abdm"
                />
                <TextArea
                  label="Note (optional)"
                  value={draft.note ?? ""}
                  onChange={(v) => onDraftChange({ ...draft, note: v })}
                  rows={3}
                />

                {/* Selection controls */}
                <div className="flex items-center gap-2">
                  {selected ? (
                    <button
                      type="button"
                      onClick={clearPatient}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                    >
                      Clear selected patient
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto px-4 py-3 border-t flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={onConfirm}
              className={[
                "text-sm px-3 py-1.5 rounded",
                disabled
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:brightness-110",
              ].join(" ")}
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* Small re-usable inputs */
function TextField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoFocus?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoFocus={autoFocus}
        className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
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
        className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300"
      />
    </label>
  );
}

/* Visual badge for detected input intent */
function DetectBadge({ kind }: { kind: QueryType }) {
  const label =
    kind === "UHID" ? "UHID"
      : kind === "MOBILE" ? "Mobile"
      : kind === "NAME" ? "Name"
      : "—";
  return (
    <span className="text-[10px] px-2 py-1 border rounded bg-white">{label}</span>
  );
}

/** Look up doctor name for header (local helper) */
function doctorName(id: string) {
  const found = MOCK_DOCTORS.find((d) => d.id === id);
  return found ? found.name : id;
}
