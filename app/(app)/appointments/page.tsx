"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Paper, Box, TextField as MuiTextField, MenuItem } from "@mui/material";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { readClientSession } from "@/lib/auth/client-session";

/* =============================================================================
   Types
============================================================================= */
type Role = "doctor" | "staff" | "admin";

type Patient = {
  name: string;
  gender: string;
  age: number;
  phone: string;
  abhanumber: string;
  abhaaddress: string;
  regDate: string;
  uhid: string;
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  qualifications?: string;
  bio?: string;
  room?: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  booked: string[];
};

type Slot = { time: string; available: boolean; withinWorking: boolean };

type BookingDraft = {
  time: string;
  patientName: string;
  mobile: string;
  abhaNumber?: string;
  abhaAddress?: string;
  uhid?: string;
  note?: string;
};

/* =============================================================================
   Utility helpers
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

/* =============================================================================
   Page
============================================================================= */
export default function AppointmentsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDept, setSelectedDept] = useState("All");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [session, setSession] = useState(() => readClientSession());

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  // ---------- Detect role ----------
  useEffect(() => {
    setSession(readClientSession());
  }, []);
  const role = session?.role ?? "doctor";
  const doctorName = session?.name ?? "Dr. Vasanth Shetty";

  const isDoctorLogin = role === "doctor";
  // useEffect(() => {
  //   setRole(readClientRoleFromCookie());
  // }, []);

  // ---------- Load data ----------
  useEffect(() => {
    (async () => {
      try {
        const [docRes, patRes] = await Promise.all([
          fetch("/data/doctors.json", { cache: "no-store" }),
          fetch("/data/patients.json", { cache: "no-store" }),
        ]);
        const docs = (await docRes.json()) as Doctor[];
        const pats = (await patRes.json()) as Patient[];
        setDoctors(docs);
        setPatients(pats);

        if (role === "doctor") {
          // hardcoded doctor name for doctor login
          const match = docs.find(
            (d) => d.name.toLowerCase() === "dr. vasanth shetty"
          );
          if (match) {
            setSelectedDoctor(match);
            setSelectedDept(match.specialty);
          }
        } else {
          setSelectedDoctor(null);
        }
      } catch (err) {
        console.error("Error loading doctors or patients", err);
      }
    })();
  }, [role]);

  /* ---------- Slot actions ---------- */
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
    if (!draft || !selectedDoctor) return;
    if (!draft.patientName.trim() || !draft.mobile.trim()) return;
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === selectedDoctor.id
          ? {
              ...d,
              booked: Array.from(new Set([...(d.booked || []), draft.time])),
            }
          : d
      )
    );
    setSelectedSlot(null);
    setDraft(null);
  }

  /* =============================================================================
     Render
  ============================================================================= */
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* ---------- Header Filters ---------- */}
      <Paper
        sx={{
          p: 2.5,
          borderRadius: 3,
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          mb: 3,
        }}
      >
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
          }}
        >
          {!isDoctorLogin && (
            <>
              {/* Department filter */}
              <MuiTextField
                select
                size="small"
                label="Department"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                sx={{ minWidth: 180, background: "white", borderRadius: 1 }}
              >
                <MenuItem value="All">All</MenuItem>
                {[...new Set(doctors.map((d) => d.specialty))].map((dep) => (
                  <MenuItem key={dep} value={dep}>
                    {dep}
                  </MenuItem>
                ))}
              </MuiTextField>

              {/* Doctor filter */}
              <MuiTextField
                select
                size="small"
                label="Doctor"
                value={selectedDoctor?.id || "All"}
                onChange={(e) =>
                  setSelectedDoctor(
                    e.target.value === "All"
                      ? null
                      : doctors.find((d) => d.id === e.target.value) || null
                  )
                }
                sx={{ minWidth: 200, background: "white", borderRadius: 1 }}
              >
                <MenuItem value="All">All Doctors</MenuItem>
                {doctors
                  .filter(
                    (d) =>
                      selectedDept === "All" || d.specialty === selectedDept
                  )
                  .map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
              </MuiTextField>
            </>
          )}

          {/* Search patients */}
          <MuiTextField
            size="small"
            placeholder="Search (name, UHID, phone, ABHA no/address)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ flex: 1, background: "white", borderRadius: 1 }}
          />

          {/* Quick booking */}
          <button
            className="btn-primary px-3 py-1 rounded-md text-sm"
            onClick={() =>
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              })
            }
          >
            Quick Booking
          </button>
        </Box>
      </Paper>

      {/* ---------- Calendars ---------- */}
      {(selectedDoctor ? [selectedDoctor] : doctors)
        .filter((d) =>
          isDoctorLogin
            ? d.name.toLowerCase() === "dr. vasanth shetty"
            : selectedDept === "All" || d.specialty === selectedDept
        )
        .map((doc) => {
          const slots = buildSlots(doc);
          return (
            <div
              key={doc.id}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start"
            >
              {/* LEFT: Calendar */}
              <div className="ui-card p-4 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold">{doc.name}</div>
                    <div className="text-sm text-gray-700">
                      {doc.specialty}
                      {doc.qualifications ? ` • ${doc.qualifications}` : ""}
                    </div>
                    {doc.bio && (
                      <div className="text-xs text-gray-600 mt-1">
                        {doc.bio}
                      </div>
                    )}
                    {doc.room && (
                      <div className="text-xs text-gray-500 mt-1">
                        Room: {doc.room}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Today</div>
                    <div className="text-sm font-medium">
                      {doc.startTime}–{doc.endTime}
                    </div>
                    {doc.breakStart && doc.breakEnd && (
                      <div className="text-xs text-gray-500">
                        Break {doc.breakStart}–{doc.breakEnd}
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

                {/* Slots */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {slots.map((s) => {
                    const base =
                      "text-xs px-2 py-1.5 rounded border text-center select-none transition";
                    if (!s.withinWorking)
                      return (
                        <div
                          key={s.time}
                          className={`${base} cursor-not-allowed bg-gray-50 text-gray-400 border-gray-300`}
                        >
                          {s.time}
                        </div>
                      );
                    const isBooked = !s.available;
                    const isSelected = selectedSlot === s.time;
                    if (isBooked)
                      return (
                        <div
                          key={s.time}
                          className={`${base} bg-red-50 text-red-900 border-red-500 cursor-not-allowed`}
                        >
                          {s.time}
                        </div>
                      );
                    return (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => {
                          setSelectedDoctor(doc);
                          pickSlot(s.time);
                        }}
                        className={[
                          base,
                          isSelected
                            ? "bg-green-600 text-white border-green-700"
                            : "bg-green-50 text-green-900 border-green-500 hover:bg-green-100",
                        ].join(" ")}
                      >
                        {s.time}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Booking Panel */}
              {selectedDoctor && selectedDoctor.id === doc.id && (
                <RightBookingPanel
                  doctor={doc}
                  selectedSlot={selectedSlot}
                  draft={draft}
                  patients={patients}
                  onDraftChange={setDraft}
                  onClearSlot={clearSlot}
                  onConfirm={commitBooking}
                />
              )}
            </div>
          );
        })}
    </div>
  );
}

/* =============================================================================
   Booking panel + form rows
============================================================================= */
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
  const confirmDisabled =
    !draft || !(draft.patientName?.trim() && draft.mobile?.trim());

  return (
    <div className="ui-card p-4 sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">New Appointment</h2>
        {selectedSlot && (
          <button
            onClick={onClearSlot}
            className="btn-accent text-xs px-2 py-1 border rounded hover:bg-gray-50"
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

          {/* Form */}
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <tbody>
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
            <span />
            <button 
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={[
                "btn-primary px-4 py-2 text-sm rounded-md font-medium shadow-sm",
                confirmDisabled
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-amber-600 text-grey hover:opacity-90",
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
