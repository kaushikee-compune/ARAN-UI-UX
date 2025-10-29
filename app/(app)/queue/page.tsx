"use client";

import React, { useEffect, useState } from "react";
import FilterBar, { FilterOption } from "@/components/common/FilterBar";
import { Typography } from "@mui/material";
import ActionMenu from "@/components/common/ActionMenu";

type Patient = {
  name: string;
  phone: string;
  abha: string;
  gender: string;
};

type Slot = {
  slotStart: string;
  slotEnd: string;
  tokenNum?: string;
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
  const [selectedDept, setSelectedDept] = useState("All");
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

  const sessions = data.sessions.filter((s) => {
    const matchDoctor = selectedDoctor === "All" || s.doctor === selectedDoctor;
    const matchDept =
      selectedDept === "All" ||
      s.doctor.toLowerCase().includes(selectedDept.toLowerCase());
    const matchSearch =
      search.trim() === "" ||
      s.slots.some(
        (slot) =>
          slot.patient &&
          (slot.patient.name.toLowerCase().includes(search.toLowerCase()) ||
            slot.patient.phone.includes(search) ||
            slot.patient.abha.toLowerCase().includes(search.toLowerCase()))
      );
    return matchDoctor && matchDept && matchSearch;
  });

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
      ?.tokenNum || "--";

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
    slot.tokenNum = String(Math.floor(Math.random() * 20 + 1)).padStart(3, "0");
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
    <div className="ui-card p-4 flex flex-col gap-4">
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

      {/* ---------- Header Row ---------- */}
      <div className="flex items-center justify-between">
        <button
          className="btn-primary flex items-center gap-2 text-sm font-semibold whitespace-nowrap"
          onClick={() => setShowModal(true)}
        >
          <img src="/icons/UserPlus.png" alt="" className="w-4 h-4" />
          Add Walk-in
        </button>

        {/* Filter Bar */}
        <div className="flex-1 ml-4">
          <FilterBar
            fields={[
              {
                type: "select",
                key: "doctor",
                label: "Doctor",
                options: [
                  { label: "All Doctors", value: "All" },
                  ...Array.from(
                    new Set(data.sessions.map((s) => s.doctor))
                  ).map((d) => ({ label: d, value: d })),
                ],
                value: selectedDoctor,
                onChange: setSelectedDoctor,
              },
              {
                type: "select",
                key: "department",
                label: "Department",
                options: [
                  { label: "All Departments", value: "All" },
                  { label: "Gynecology", value: "Gynecology" },
                  { label: "General Medicine", value: "General" },
                  { label: "Orthopedics", value: "Orthopedics" },
                ],
                value: selectedDept,
                onChange: setSelectedDept,
              },
              {
                type: "search",
                key: "search",
                placeholder: "Search patient (name / phone / ABHA)…",
                value: search,
                onChange: setSearch,
              },
            ]}
          />
        </div>
      </div>

      {/* ---------- OPD + Completed Panels ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* LEFT — OPD Queue */}
        <div>
          {sessions.map((session, sIdx) => (
            <div
              key={sIdx}
              className="rounded-lg border border-gray-200 shadow-sm bg-white mb-3 overflow-hidden"
            >
              <div className="px-3 py-2 border-b bg-gray-50 font-semibold text-sm">
                {session.doctor} — {session.sessionName} Session
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
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
                        className={`border-t border-gray-200 hover:bg-gray-50 ${
                          slot.status === "inconsult"
                            ? "bg-white"
                            : slot.status === "waiting"
                            ? "bg-white"
                            : "bg-green-50"
                        }`}
                      >
                        <td className="p-2 text-gray-700">
                          <div>
                            {slot.slotStart} – {slot.slotEnd}
                          </div>
                          {slot.tokenNum && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Token #{slot.tokenNum}
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          {slot.patient ? (
                            <>
                              <div className="font-semibold text-sm text-[--text-highlight]">
                                {slot.patient.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {slot.patient.phone} | {slot.patient.abha} |{" "}
                                {slot.patient.gender}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-gray-400 italic">
                              (empty slot)
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          {slot.patient && (
                            <>
                              {slot.status === "waiting" && (
                                <div
                                  className="inline-flex items-center gap-2 cursor-pointer text-[var(--text-highlight)] font-semibold hover:opacity-90"
                                  onClick={() =>
                                    updateSlotStatus(sIdx, idx, "inconsult")
                                  }
                                >
                                  <span>Start</span>
                                  <img
                                    src="/icons/Start.png"
                                    alt=""
                                    className="w-4 h-4"
                                  />
                                </div>
                              )}
                              {slot.status === "inconsult" && (
                                <div
                                  className="inline-flex items-center gap-2 cursor-pointer text-amber-600 font-semibold hover:opacity-90"
                                  onClick={() =>
                                    updateSlotStatus(sIdx, idx, "waiting")
                                  }
                                >
                                  <span>Pause</span>
                                  <img
                                    src="/icons/pause.png"
                                    alt=""
                                    className="w-4 h-4"
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="p-2 text-gray-700">
                          {slot.type === "walkin"
                            ? "Walk-in"
                            : slot.type === "appointment"
                            ? "Appt."
                            : ""}
                        </td>
                        <td className="p-2">
                          {slot.patient && (
                            <div className="absolute inline-block text-left">
                              <ActionMenu
                                items={[
                                  {
                                    label: "No-Show",
                                    onClick: () =>
                                      updateSlotStatus(sIdx, idx, "noshow"),
                                  },
                                  {
                                    label: "Payment",
                                    onClick: () =>
                                      alert(
                                        `Collect payment for ${slot.patient?.name}`
                                      ),
                                  },
                                  {
                                    label: "Vitals",
                                    onClick: () =>
                                      alert(
                                        `Open vitals for ${slot.patient?.name}`
                                      ),
                                  },
                                  {
                                    label: "Upload",
                                    onClick: () =>
                                      alert(
                                        `Upload report for ${slot.patient?.name}`
                                      ),
                                  },
                                  {
                                    label: "Move Up",
                                    onClick: () =>
                                      alert(`Move up ${slot.patient?.name}`),
                                  },
                                ]}
                              />
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

        {/* RIGHT — Completed & No-Show */}
        <div>
          {/* Completed Consultations */}
          <div className="rounded-lg border border-gray-200 shadow-sm bg-white mb-3 overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 font-semibold text-sm">
              Completed Consultations
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 text-left w-[100px]">Slot</th>
                  <th className="p-2 text-left">Patient</th>
                  <th className="p-2 text-left">Actions</th>
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
                    <tr
                      key={idx}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-2 text-gray-700">
                        {slot.slotStart} – {slot.slotEnd}
                      </td>
                      <td className="p-2">
                        <div className="font-semibold text-sm text-[--text-highlight]">
                          {slot.patient?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {slot.patient?.phone} | {slot.patient?.abha}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="absolute inline-block text-left">
                          <ActionMenu
                            items={[
                              {
                                label: "Payment",
                                onClick: () =>
                                  alert(
                                    `Collect payment for ${slot.patient?.name}`
                                  ),
                              },
                              {
                                label: "Details",
                                onClick: () =>
                                  alert(
                                    `Show consultation details ${slot.patient?.name}`
                                  ),
                              },

                              {
                                label: "Upload",
                                onClick: () =>
                                  alert(
                                    `Upload report for ${slot.patient?.name}`
                                  ),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* No-Show Queue */}
          <div className="rounded-lg border border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 font-semibold text-sm">
              No-Show Queue
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 text-left w-[100px]">Slot</th>
                  <th className="p-2 text-left">Patient</th>
                  <th className="p-2 text-left">Session</th>
                </tr>
              </thead>
              <tbody>
                {noShowSlots.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-500 py-2">
                      No patients marked as no-show
                    </td>
                  </tr>
                ) : (
                  noShowSlots.map((slot, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-2 text-gray-700">
                        {slot.slotStart} – {slot.slotEnd}
                      </td>
                      <td className="p-2">
                        <div className="font-semibold text-sm text-[--text-highlight]">
                          {slot.patient?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {slot.patient?.phone} | {slot.patient?.abha}
                        </div>
                      </td>
                      <td className="p-2 text-gray-700">{slot.session}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------- Walk-in Modal ---------- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-[min(95vw,400px)] p-6 relative">
            <h3 className="text-lg font-semibold mb-4">Add Walk-in Patient</h3>

            <div className="grid gap-3">
              {userRole === "staff" && (
                <div className="grid gap-1">
                  <label className="text-xs text-gray-600">Doctor</label>
                  <select
                    className="ui-input"
                    value={walkin.doctor}
                    onChange={(e) =>
                      setWalkin({ ...walkin, doctor: e.target.value })
                    }
                  >
                    <option value="">Select Doctor</option>
                    {Array.from(
                      new Set(data.sessions.map((s) => s.doctor))
                    ).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-1">
                <label className="text-xs text-gray-600">Name</label>
                <input
                  className="ui-input"
                  value={walkin.name}
                  onChange={(e) =>
                    setWalkin({ ...walkin, name: e.target.value })
                  }
                  placeholder="Enter patient name"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs text-gray-600">Phone</label>
                <input
                  className="ui-input"
                  value={walkin.phone}
                  onChange={(e) =>
                    setWalkin({ ...walkin, phone: e.target.value })
                  }
                  placeholder="10-digit phone"
                  maxLength={10}
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs text-gray-600">Gender</label>
                <select
                  className="ui-input"
                  value={walkin.gender}
                  onChange={(e) =>
                    setWalkin({ ...walkin, gender: e.target.value })
                  }
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 border rounded hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button onClick={handleAddWalkin} className="btn-accent">
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
