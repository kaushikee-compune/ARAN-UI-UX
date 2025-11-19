"use client";

import React, { useEffect, useState } from "react";
import { Paper } from "@mui/material";
import { useAranSession } from "@/lib/auth/use-aran-session";

/* =============================================================================
   Types
============================================================================= */
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
  branches: string[];
  schedule: any | null;
  booked: string[];
};

type Slot = {
  time: string;
  available: boolean;
  withinWorking: boolean;
};

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
   Utilities
============================================================================= */
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/* =============================================================================
   Robust Slot Builder (supports multiple schedule shapes)
============================================================================= */
function buildSlots(doc: Doctor, session: any): Slot[] {
  const sched = doc.schedule;
  if (!sched) return [];

  const today = new Date();
  const dateISO = today.toISOString().slice(0, 10);
  const dowShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()];
  const dowLong = today.toLocaleDateString("en-GB", { weekday: "long" }); // e.g. "Monday"

  const activeBranch =
    session?.access?.[0]?.branchId ||
    session?.legacyBranches?.[0] ||
    doc.branches?.[0];

  // ---- Normalize branch-level schedule ----
  let branchSched: any = null;
  console.log("Today:", dowShort, "(" + dowLong + ")");
console.log("Matched dayBlock:", today);

  if (Array.isArray(sched.branches)) {
    branchSched =
      sched.branches.find((b: any) => b.branchId === activeBranch) ??
      sched.branches[0];
  } else if (sched.branchId) {
    // schedule with branchId at root
    branchSched = sched;
  } else {
    // no explicit branch nesting – treat whole sched as branchSched
    branchSched = sched;
  }

  if (!branchSched) return [];

  // ---- Exceptions / vacations ----
  const unavailable =
    branchSched.exceptions?.unavailable ??
    sched.exceptions?.unavailable ??
    [];

  const onLeave = unavailable.some(
    (v: any) => dateISO >= v.from && dateISO <= v.to
  );

  if (onLeave) {
    return [
      {
        time: "Doctor On Leave",
        available: false,
        withinWorking: false,
      },
    ];
  }

  // ---- Find today's day block ----
  // const dayList =
  //   branchSched.weeklySchedule ||
  //   branchSched.days ||
  //   sched.weeklySchedule ||
  //   sched.days ||
  //   [];
  const dayList = Array.isArray(branchSched.weeklySchedule)
  ? branchSched.weeklySchedule
  : [];

  const todayBlock =
  dayList.find((d: any) => d.day === dowShort) ||
  dayList.find((d: any) => d.day === dowLong) ||
  null;

  if (!todayBlock || !Array.isArray(todayBlock.sessions) || todayBlock.sessions.length === 0) {
    return [];
  }

  const slots: Slot[] = [];

  for (const s of todayBlock.sessions) {
    if (!s.start || !s.end) continue;
    const start = toMinutes(s.start);
    const end = toMinutes(s.end);
    const step = s.slotDuration || 15;

    for (let t = start; t < end; t += step) {
      const label = fromMinutes(t);
      const isBooked = doc.booked.includes(label);
      slots.push({
        time: label,
        available: !isBooked,
        withinWorking: true,
      });
    }
  }

  return slots;
}

/* =============================================================================
   Page
============================================================================= */
export default function AppointmentsPage() {
  const { session, isDoctor } = useAranSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(null);

  /* =============================================================================
     Load data after session becomes available
  ============================================================================= */
  useEffect(() => {
    if (!session) return;

    (async () => {
      try {
        const [staffRes, schedRes, patRes] = await Promise.all([
          fetch("/data/staff.json", { cache: "no-store" }),
          fetch("/data/doctor-schedule.json", { cache: "no-store" }),
          fetch("/data/patients.json", { cache: "no-store" }),
        ]);

        const staff = await staffRes.json();
        const schedules = await schedRes.json();
        const pats = await patRes.json();

        setPatients(pats);

        const doctorStaff = staff.filter((s: any) =>
          s.roles.includes("doctor")
        );

        const merged: Doctor[] = doctorStaff.map((s: any) => {
          const sched = schedules.find((x: any) => x.doctorId === s.id);

          return {
            id: s.id,
            name: s.name,
            specialty: s.departments?.[0] || "General",
            branches: s.branches || [],
            schedule: sched || null,
            booked: [],
          };
        });

        setDoctors(merged);
      } catch (err) {
        console.error("Failed to load appointment data:", err);
      }
    })();
  }, [session]);

  /* =============================================================================
     Auto-select doctor AFTER doctors[] loads
  ============================================================================= */
  useEffect(() => {
    if (isDoctor && session && doctors.length > 0) {
      const match = doctors.find((d) => d.id === session.id);
      if (match) setSelectedDoctor(match);
    }
  }, [isDoctor, session, doctors]);

  /* =============================================================================
     Slot actions
  ============================================================================= */
  function pickSlot(time: string, doc: Doctor) {
    setSelectedDoctor(doc);
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
          ? { ...d, booked: [...d.booked, draft.time] }
          : d
      )
    );

    clearSlot();
  }

  if (!session) {
    return <div className="p-4">Loading session…</div>;
  }

  /* =============================================================================
     Render
  ============================================================================= */
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
      }}
    >
      <div className="p-2 md:p-4 lg:p-6">

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <input
            type="text"
            className="ui-input flex-1 max-w-md"
            placeholder="Search (name, UHID, phone, ABHA no/address)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="btn-primary whitespace-nowrap"
            onClick={() =>
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              })
            }
          >
            Quick Booking
          </button>
        </div>

        {/* Doctor calendars */}
        {(selectedDoctor ? [selectedDoctor] : doctors)
          .filter((d) => (isDoctor ? d.id === session.id : true))
          .map((doc) => {
            const slots = buildSlots(doc, session);

            const noSlots = slots.length === 0;

            return (
              <div
                key={doc.id}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              >
                {/* ================= LEFT — CALENDAR ================= */}
                <div className="ui-card p-4 flex flex-col gap-4">
                  {/* Doctor header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-base">{doc.name}</div>
                      <div className="text-sm text-gray-600">
                        {doc.specialty}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-green-100 border border-green-500" />
                      Available
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-red-100 border border-red-500" />
                      Booked
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
                      Unavailable
                    </span>
                  </div>

                  {/* Slots */}
                  {noSlots ? (
                    <div className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-md p-4 text-center">
                      No slots configured for today for this branch.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                      {slots.map((s) => {
                        const base =
                          "text-xs px-2 py-1.5 rounded border text-center select-none";

                        if (!s.withinWorking) {
                          return (
                            <div
                              key={s.time}
                              className={`${base} bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed`}
                            >
                              {s.time}
                            </div>
                          );
                        }

                        const isBooked = !s.available;
                        const isSelected =
                          selectedSlot === s.time &&
                          selectedDoctor?.id === doc.id;

                        if (isBooked) {
                          return (
                            <div
                              key={s.time}
                              className={`${base} bg-red-50 text-red-900 border-red-500 cursor-not-allowed`}
                            >
                              {s.time}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={s.time}
                            onClick={() => pickSlot(s.time, doc)}
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
                  )}
                </div>

                {/* ================= RIGHT — BOOKING PANEL ================= */}
                {selectedDoctor && selectedDoctor.id === doc.id && (
                  <BookingPanel
                    doctor={doc}
                    selectedSlot={selectedSlot}
                    draft={draft}
                    patients={patients}
                    clearSlot={clearSlot}
                    setDraft={setDraft}
                    onConfirm={commitBooking}
                  />
                )}
              </div>
            );
          })}
      </div>
    </Paper>
  );
}

/* =============================================================================
   Booking Panel
============================================================================= */
function BookingPanel({
  doctor,
  selectedSlot,
  draft,
  patients,
  clearSlot,
  setDraft,
  onConfirm,
}: any) {
  if (!selectedSlot) {
    return (
      <div className="ui-card p-4 text-center text-sm text-gray-600">
        Select a slot to create booking.
      </div>
    );
  }

  const disabled =
    !draft ||
    !draft.patientName.trim() ||
    !draft.mobile.trim();

  return (
    
    <div className="ui-card p-4 sticky top-4">
      <div className="flex justify-between mb-3">
        <h2 className="font-semibold text-sm">New Appointment</h2>
        <button className="btn-accent" onClick={clearSlot}>
          Change Slot
        </button>
      </div>

      <div className="text-sm mb-3">
  <div>
    <strong>Doctor:</strong> {doctor.name}
  </div>
  <div>
    <strong>Slot:</strong> {selectedSlot}
  </div>
</div>


      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <tbody>
            <FormRow
              label="Patient Name"
              value={draft.patientName}
              onChange={(v: string) => setDraft({ ...draft, patientName: v })}
            />
            <FormRow
              label="Mobile"
              value={draft.mobile}
              onChange={(v: string) => setDraft({ ...draft, mobile: v })}
            />
            <FormRow
              label="ABHA Number"
              value={draft.abhaNumber}
              onChange={(v: string) => setDraft({ ...draft, abhaNumber: v })}
            />
            <FormRow
              label="ABHA Address"
              value={draft.abhaAddress}
              onChange={(v: string) =>
                setDraft({ ...draft, abhaAddress: v })
              }
            />
            <FormRow
              label="UHID"
              value={draft.uhid}
              onChange={(v: string) => setDraft({ ...draft, uhid: v })}
            />
            <FormRow
              label="Note"
              value={draft.note}
              textarea
              onChange={(v: string) => setDraft({ ...draft, note: v })}
            />
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onConfirm}
          disabled={disabled}
          className={[
            "btn-primary",
            disabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-amber-600 text-white",
          ].join(" ")}
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );
}

/* =============================================================================
   Form Row
============================================================================= */
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
      <td className="px-3 py-2 text-gray-700 w-40">{label}</td>
      <td className="px-3 py-2">
        {textarea ? (
          <textarea
            rows={2}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="ui-textarea w-full"
          />
        ) : (
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="ui-input w-full"
          />
        )}
      </td>
    </tr>
  );
}
