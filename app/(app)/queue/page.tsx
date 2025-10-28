"use client";

import React, { useEffect, useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  Play,
  Pause,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Upload,
  CreditCard,
  UserPlus,
} from "lucide-react";

type Patient = {
  name: string;
  phone: string;
  abha: string;
  gender: string;
};

type Slot = {
  slotStart: string;
  slotEnd: string;
  status: "empty" | "waiting" | "inconsult" | "completed" | "noshow";
  type: "appointment" | "walkin" | null;
  paymentStatus?: "paid" | "unpaid";
  patient: Patient | null;
  doctor: string;
};

type Session = {
  sessionName: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  doctor: string;
  slots: Slot[];
};

type QueueData = {
  date: string;
  sessions: Session[];
};

/* ---------- Utility to find first empty slot after now ---------- */
function findNextSlot(sessions: Session[], now: Date) {
  for (const session of sessions) {
    const sessionStart = new Date();
    const [sh, sm] = session.startTime.split(":").map(Number);
    sessionStart.setHours(sh, sm, 0, 0);
    const sessionEnd = new Date();
    const [eh, em] = session.endTime.split(":").map(Number);
    sessionEnd.setHours(eh, em, 0, 0);

    if (now >= sessionStart && now <= sessionEnd) {
      for (const s of session.slots) {
        const [h, m] = s.slotStart.split(":").map(Number);
        const slotTime = new Date();
        slotTime.setHours(h, m, 0, 0);
        if (s.status === "empty" && slotTime >= now)
          return { session, slot: s };
      }
    }
  }
  // if none in current session, pick first empty of next
  for (const session of sessions) {
    const next = session.slots.find((s) => s.status === "empty");
    if (next) return { session, slot: next };
  }
  return null;
}

export default function QueuePage() {
  const [data, setData] = useState<QueueData | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [walkin, setWalkin] = useState({
    name: "",
    phone: "",
    gender: "Female",
    doctor: "",
  });
  const [userRole] = useState<"staff" | "doctor">("staff");
  const [doctorName] = useState("Dr. Hira Mardi");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/queue.json")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => console.error("Failed to load OPD data", e));
  }, []);

  if (!data) return <Typography>Loading OPD queue…</Typography>;

  const sessions =
    userRole === "doctor"
      ? data.sessions.filter((s) => s.doctor === doctorName)
      : selectedDoctor === "All"
      ? data.sessions
      : data.sessions.filter((s) => s.doctor === selectedDoctor);

  /* ---------- Statistics ---------- */
  const waitingCount = sessions.reduce(
    (acc, s) => acc + s.slots.filter((x) => x.status === "waiting").length,
    0
  );
  const completedCount = sessions.reduce(
    (acc, s) => acc + s.slots.filter((x) => x.status === "completed").length,
    0
  );
  const noShowSlots = sessions.flatMap((s) =>
    s.slots
      .filter((sl) => sl.status === "noshow")
      .map((sl) => ({ ...sl, session: s.sessionName }))
  );
  const currentToken =
    sessions.flatMap((s) => s.slots).find((x) => x.status === "inconsult")
      ?.slotStart || "--";

  /* ---------- Walk-in insertion ---------- */
  const handleAddWalkin = () => {
    const now = new Date();
    const doc = userRole === "doctor" ? doctorName : (walkin as any).doctor;
    if (!doc) {
      alert("Please select a doctor");
      return;
    }

    const next = findNextSlot(
      data.sessions.filter((s) => s.doctor === doc),
      now
    );
    if (!next) {
      alert("No slots available for this doctor.");
      return;
    }

    const { session, slot } = next;
    slot.status = "waiting";
    slot.type = "walkin";
    slot.patient = {
      name: walkin.name,
      phone: walkin.phone,
      abha: "-",
      gender: walkin.gender,
    };
    setData({ ...data });
    setShowModal(false);
    setWalkin({ name: "", phone: "", gender: "Female", doctor: "" });
  };

  /* ---------- Actions ---------- */
  const updateSlotStatus = (
    sessionIdx: number,
    slotIdx: number,
    status: Slot["status"]
  ) => {
    const updated = { ...data };
    updated.sessions[sessionIdx].slots[slotIdx].status = status;
    setData(updated);
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* ---------- Header Stats ---------- */}
      <div className="flex justify-between items-center rounded-xl bg-[#f9fafb] shadow-sm px-4 py-2">
        <span className="text-sm font-semibold">
          Current Token: {currentToken}
        </span>
        <span className="text-sm font-semibold">Waiting: {waitingCount}</span>
        <span className="text-sm font-semibold">
          Completed: {completedCount}
        </span>
        <span className="text-sm font-semibold">Avg Time: 12 min</span>
        <span className="text-sm font-semibold">Doctor: 🟢 In</span>
      </div>

      {/* ---------- Filter Bar ---------- */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 shadow-sm px-2 py-2 bg-white">
        <div className="flex items-center gap-3 p-3">
          {userRole === "staff" && (
            <>
              <select
                className="ui-input w-full"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="All">All Doctors</option>
                {[...new Set(data.sessions.map((s) => s.doctor))].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <input
                type="text"
                className="ui-input flex-auto"
                placeholder="Search patient (name / phone / ABHA)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </>
          )}
        </div>

        <button
          className="btn-primary flex items-center gap-2 text-sm font-semibold"
          onClick={() => setShowModal(true)}
        >
          <img src="/icons/UserPlus.png" alt="" className="w-4 h-4" />
          Add Walk-in
        </button>
      </div>

      {/* ---------- OPD + Completed Panels ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* LEFT: OPD Queue */}
        <div>
          {sessions.map((session, sIdx) => (
            <div
              key={sIdx}
              className="rounded-lg shadow-sm border border-gray-200 mb-3 overflow-hidden"
            >
              <div className="px-3 py-2 border-b bg-gray-50 font-semibold text-sm">
                {session.doctor} — {session.sessionName} Session
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-2 text-left w-[110px]">Slot</th>
                    <th className="p-2 text-left">Patient</th>
                    <th className="p-2 text-left w-[140px]">Start / Pause</th>
                    <th className="p-2 text-left w-[110px]">Type</th>
                    <th className="p-2 text-left w-[150px]">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {session.slots
                    .filter((sl) => sl.status !== "completed")
                    .map((slot, idx) => (
                      <tr
                        key={idx}
                        className={[
                          "border-t border-gray-300",
                          slot.status === "inconsult"
                            ? "bg-white"
                            : slot.status === "waiting"
                            ? "bg-white"
                            : "bg-green-100",
                        ].join(" ")}
                      >
                        {/* Slot */}
                        <td className="p-2">
                          {slot.slotStart} – {slot.slotEnd}
                        </td>

                        {/* Patient Details */}
                        <td className="p-2">
                          {slot.patient ? (
                            <>
                              <div className="font-semibold text-sm">
                                {slot.patient.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {slot.patient.phone} | {slot.patient.abha} |{" "}
                                {slot.patient.gender}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-gray-500 italic">
                              (empty slot)
                            </div>
                          )}
                        </td>

                        {/* Start / Pause */}
                        <td className="p-2 text-left">
                          {slot.patient && (
                            <>
                              {slot.status === "waiting" && (
                                <div
                                  className="inline-flex items-left gap-2 cursor-pointer text-[var(--text-highlight)] font-semibold hover:opacity-90"
                                  onClick={() =>
                                    updateSlotStatus(sIdx, idx, "inconsult")
                                  }
                                  title="Start Consultation"
                                >
                                  <span>Start</span>
                                  <img
                                    src="/icons/Start.png"
                                    alt="Start"
                                    className="w-4 h-4"
                                  />
                                </div>
                              )}

                              {slot.status === "inconsult" && (
                                <div
                                  className="inline-flex items-left gap-2 cursor-pointer text-[var(--text-highlight)] font-semibold hover:opacity-90"
                                  onClick={() =>
                                    updateSlotStatus(sIdx, idx, "waiting")
                                  }
                                  title="Pause Consultation"
                                >
                                  <span>Pause</span>
                                  <img
                                    src="/icons/pause.png"
                                    alt="Pause"
                                    className="w-4 h-4"
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </td>

                        {/* Appointment Type */}
                        <td className="p-2 text-left">
                          {slot.type === "walkin"
                            ? "Walk-in"
                            : slot.type === "appointment"
                            ? "Appt."
                            : ""}
                        </td>

                        {/* Actions */}
                        <td className="p-2 text-left justify-left">
                          {slot.patient && (
                            <div className="relative inline-block text-left">
                              {/* 3-dot trigger — vertical */}
                              <button
                                onClick={() =>
                                  setOpenMenu(
                                    openMenu === `${sIdx}-${idx}`
                                      ? null
                                      : `${sIdx}-${idx}`
                                  )
                                }
                                className="p-1 rounded hover:bg-gray-100 transition"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.8}
                                  stroke="currentColor"
                                  className="w-5 h-5 text-gray-600"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                                  />
                                </svg>
                              </button>

                              {/* Dropdown menu */}
                              {openMenu === `${sIdx}-${idx}` && (
                                <div
                                  className="absolute right-0 mt-1 w-36 origin-top-right rounded-md bg-white border border-gray-200 shadow-lg z-10"
                                  onMouseLeave={() => setOpenMenu(null)}
                                >
                                  <button
                                    className="menu-item"
                                    onClick={() => {
                                      updateSlotStatus(sIdx, idx, "noshow");
                                      setOpenMenu(null);
                                    }}
                                  >
                                    🟥 No-Show
                                  </button>
                                  <button
                                    className="menu-item"
                                    onClick={() => {
                                      alert(
                                        `Collect payment for ${slot.patient?.name}`
                                      );
                                      setOpenMenu(null);
                                    }}
                                  >
                                    💰 Payment
                                  </button>
                                  <button
                                    className="menu-item"
                                    onClick={() => {
                                      alert(
                                        `Open vitals for ${slot.patient?.name}`
                                      );
                                      setOpenMenu(null);
                                    }}
                                  >
                                    ❤️ Vitals
                                  </button>
                                  <button
                                    className="menu-item"
                                    onClick={() => {
                                      alert(
                                        `Upload report for ${slot.patient?.name}`
                                      );
                                      setOpenMenu(null);
                                    }}
                                  >
                                    📤 Upload
                                  </button>
                                  <button
                                    className="menu-item"
                                    onClick={() => {
                                      alert(`Move up ${slot.patient?.name}`);
                                      setOpenMenu(null);
                                    }}
                                  >
                                    ⬆️ Move Up
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* RIGHT: Completed & No-Show */}
        <div>
          {/* Completed Consultations */}
          <div className="rounded-lg shadow-sm border border-gray-200 mb-3 overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 font-semibold text-sm">
              Completed Consultations
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 text-left w-[100px]">Slot</th>
                  <th className="p-2 text-left">Patient</th>
                  <th className="p-2 text-Left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .flatMap((s) =>
                    s.slots
                      .filter((sl) => sl.status === "completed")
                      .map((sl) => ({ ...sl, session: s.sessionName }))
                  )
                  .map((slot, idx) => (
                    <tr className="border-t border-gray-300" key={idx}>
                      <td className="p-2 w-[90px]">
                        {slot.slotStart} – {slot.slotEnd}
                      </td>
                      <td className="p-2">
                        <div className="font-semibold text-sm">
                          {slot.patient?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {slot.patient?.phone} | {slot.patient?.abha}
                        </div>
                      </td>
                      <td className="p-2 flex gap-3 justify-left items-center">
                        {slot.paymentStatus === "paid" ? (
                          <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                            PAID
                          </span>
                        ) : (
                          <button
                            className="hover:opacity-90"
                            title="Collect Payment"
                            onClick={() =>
                              alert(`Collect payment for ${slot.patient?.name}`)
                            }
                          >
                            <img
                              src="/icons/rupee.png"
                              alt="Payment"
                              className="w-5 h-5"
                            />
                          </button>
                        )}

                        <button
                          className="hover:opacity-90"
                          title="Upload Documents"
                        >
                          <img
                            src="/icons/upload.png"
                            alt="Upload"
                            className="w-5 h-5"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* No-Show Queue */}
          <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 font-semibold text-sm">
              No-Show Queue
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-2 text-left w-[100px]">Slot</th>
                  <th className="p-2 text-left">Patient</th>
                  <th className="p-2 text-left">Session</th>
                </tr>
              </thead>
              <tbody>
                {noShowSlots.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500 py-2">
                      No patients marked as no-show
                    </td>
                  </tr>
                )}
                {noShowSlots.map((slot, idx) => (
                  <tr className="border-t border-gray-300" key={idx}>
                    <td className="p-2 w-[90px]">
                      {slot.slotStart} – {slot.slotEnd}
                    </td>
                    <td className="p-2">
                      <div className="font-semibold text-sm">
                        {slot.patient?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {slot.patient?.phone} | {slot.patient?.abha}
                      </div>
                    </td>
                    <td className="p-2">{slot.session}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
