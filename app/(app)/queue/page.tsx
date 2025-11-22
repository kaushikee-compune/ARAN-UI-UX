"use client";

import React, { useEffect, useState } from "react";
import FilterBar, { FilterOption } from "@/components/common/FilterBar";
import { Typography } from "@mui/material";
import ActionMenu from "@/components/common/ActionMenu";
import InvoiceModal from "@/components/common/InvoiceModal";
import { useBranch } from "@/context/BranchContext";

type Patient = {
  name: string;
  phone: string;
  abha: string;
  gender: string;
};

type PatientLookup = {
  id: string;
  name: string;
  phone: string;
  abha: string | null;
  branchIds: string[];
  doctorIds: string[];
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
  vitalsDone?: boolean;
};

type Session = {
  branchId: string;
  doctorId: string;
  doctor: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  activeQ: boolean;

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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{
    name: string;
  } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [walkin, setWalkin] = useState({
    name: "",
    phone: "",
    gender: "Female",
    doctor: "",
  });
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [patients, setPatients] = useState<PatientLookup[]>([]);
  const [patientMatches, setPatientMatches] = useState<PatientLookup[]>([]);
  const [activeTab, setActiveTab] = useState<"opd" | "completed" | "noshow">(
    "opd"
  );
  const [staffDoctors, setStaffDoctors] = useState<any[]>([]);
  const [deptMap, setDeptMap] = useState<Record<string, string>>({});

  // ------------------------------------------------------------------------------------------//
  // This piece of code extracts - Role, UserId, Name, Branch from cookie and session id
  // ------------------------------------------------------------------------------------------//

  function getCookieValue(name: string): string | null {
    if (typeof document === "undefined") return null;
    const found = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    if (!found) return null;
    return decodeURIComponent(found.split("=")[1]);
  }

  // Base64 decode helper (handles missing padding)
  function decodeBase64(data: string) {
    try {
      const pad = data.length % 4;
      if (pad) data = data + "=".repeat(4 - pad);
      return JSON.parse(atob(data));
    } catch (e) {
      console.error("Session decode error", e);
      return null;
    }
  }

  // ----------------------
  // Role from cookie
  // ----------------------
  const userRole =
    (getCookieValue("aran.activeRole") as "doctor" | "staff") || "staff";

  // ----------------------
  // Branch from BranchContext
  // ----------------------
  const { selectedBranch } = useBranch();

  // ----------------------
  // Doctor details from session cookie
  // ----------------------
  const sessionRaw = getCookieValue("aran.session");
  const sessionData = sessionRaw ? decodeBase64(sessionRaw) : null;

  const doctorId = sessionData?.id || null;
  const doctorName = sessionData?.name || null;

  console.log("Doctor Role", userRole);
  console.log("User id ", doctorId);
  console.log("doctor name", doctorName);
  console.log("Branch", selectedBranch);

  // ------------------------------------------------------------------------------------------//

  useEffect(() => {
    fetch("/data/queue.json")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => console.error("Failed to load OPD data", e));
    fetch("/data/patlookup/patients-search-list.json")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPatients(data);
        } else {
          console.error("patients-search-list.json is not an array", data);
          setPatients([]);
        }
      })
      .catch((e) => {
        console.error("Failed to load patients", e);
        setPatients([]);
      });
  }, []);

  // Load staff.json & department mapper
  useEffect(() => {
    async function load() {
      try {
        const staffRes = await fetch("/data/staff.json");
        const staff = await staffRes.json();

        const doctors = staff.filter(
          (s: any) =>
            s.roles.includes("doctor") && s.branches.includes(selectedBranch)
        );

        setStaffDoctors(doctors);

        const deptRes = await fetch("/data/department-mapper.json");
        const deptJson = await deptRes.json();
        setDeptMap(deptJson);
      } catch (e) {
        console.error("Failed loading staff/departments", e);
      }
    }

    load();
  }, [selectedBranch]);

  useEffect(() => {
    if (!patients || patients.length === 0) {
      setPatientMatches([]);
      return;
    }

    const nameQ = (walkin.name || "").toLowerCase().trim();
    const phoneQ = (walkin.phone || "").trim();

    if (!nameQ && !phoneQ) {
      setPatientMatches([]);
      return;
    }

    const matches = patients.filter((p) => {
      const n = p.name?.toLowerCase() || "";
      const ph = p.phone || "";

      return (nameQ && n.includes(nameQ)) || (phoneQ && ph.includes(phoneQ));
    });

    setPatientMatches(matches.slice(0, 10));
  }, [walkin.name, walkin.phone, patients]);

  if (!data) return <Typography>Loading OPD queue…</Typography>;

  let sessions: Session[] = data.sessions;

  // DOCTOR ROLE
  if (userRole === "doctor") {
    sessions = sessions.filter(
      (s) => s.doctorId === doctorId && s.branchId === selectedBranch
    );
  }

  // STAFF ROLE
  if (userRole === "staff") {
    sessions = sessions.filter((s) => {
      const matchDoctor =
        selectedDoctor === "All" || s.doctor === selectedDoctor;

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
  }
  sessions = sessions.filter((s) => s.activeQ === true);

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

  /*------------------------------------------*/
  /* ---------- Walk-in insertion ---------- */
  /*------------------------------------------*/
  const handleAddWalkin = () => {
    const now = new Date();

    // Determine doctor
    const doctorForSlot = userRole === "doctor" ? doctorName : walkin.doctor;

    if (!doctorForSlot) {
      alert("Please select a doctor");
      return;
    }

    // Filter sessions based on role
    let doctorSessions = data.sessions.filter(
      (s) => s.doctor === doctorForSlot
    );

    if (userRole === "doctor") {
      doctorSessions = doctorSessions.filter(
        (s) => s.branchId === selectedBranch
      );
    }

    // Find next slot
    const next = findNextSlot(doctorSessions, now);

    if (!next) {
      alert("No slots available for this doctor.");
      return;
    }

    const updated = { ...data };
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

    setData(updated);
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
    <>
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
          <div className="flex items-center gap-3">
            {/* Add Walk-in */}
            <button
              className="btn-primary flex items-center text-sm font-semibold "
              onClick={() => setShowModal(true)}
            >
              <img src="/icons/UserPlus.png" alt="" className="w-4 h-4" />
              Add Walk-in
            </button>

            {/* Book Appointment */}
            <button
              className="btn-accent flex items-center text-sm font-semibold whitespace-nowrap"
              onClick={() => (window.location.href = "/appointments")}
            >
              <img src="/icons/CalendarAdd.png" alt="" className="w-4 h-4" />
              Book Appointment
            </button>
          </div>

          {/* Filter Bar */}
          {userRole === "staff" && (
            <div className="ml-auto flex items-center">
              <FilterBar
                fields={[
                  /* ---------------------- Doctor Filter ---------------------- */
                  {
                    type: "select",
                    key: "doctor",
                    label: "Doctor",
                    options: [
                      { label: "All Doctors", value: "All" },
                      ...staffDoctors.map((doc) => ({
                        label: doc.name,
                        value: doc.name,
                      })),
                    ],
                    value: selectedDoctor,
                    onChange: setSelectedDoctor,
                  },

                  /* ---------------------- Department Filter ---------------------- */
                  {
                    type: "select",
                    key: "department",
                    label: "Department",
                    options: [
                      { label: "All Departments", value: "All" },
                      ...Object.entries(deptMap).map(([key, label]) => ({
                        label,
                        value: key,
                      })),
                    ],
                    value: selectedDept,
                    onChange: setSelectedDept,
                  },
                ]}
              />
            </div>
          )}
        </div>

        {/* ---------- OPD + Completed Panels ---------- */}
        <div className="grid grid-cols-1 gap-4">
          {/* LEFT — OPD Queue */}
          {/* LEFT — Tabs + Content */}
          <div className="flex flex-col gap-3">
            {/* Tabs */}
            <div className="flex gap-3 border-b pb-2">
              <button
                onClick={() => setActiveTab("opd")}
                className={`text-sm font-semibold ${
                  activeTab === "opd"
                    ? "text-[#F87B1B] border-b-2 border-[#F87B1B]"
                    : "text-gray-600"
                }`}
              >
                OPD Queue
              </button>

              <button
                onClick={() => setActiveTab("completed")}
                className={`text-sm font-semibold ${
                  activeTab === "completed"
                    ? "text-[#F87B1B] border-b-2 border-[#F87B1B]"
                    : "text-gray-600"
                }`}
              >
                Completed
              </button>

              <button
                onClick={() => setActiveTab("noshow")}
                className={`text-sm font-semibold ${
                  activeTab === "noshow"
                    ? "text-[#F87B1B] border-b-2 border-[#F87B1B]"
                    : "text-gray-600"
                }`}
              >
                No-Show
              </button>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === "opd" && (
              <div>
                {/* ----------  OPD LEFT PANEL CODE (UNCHANGED) ---------- */}
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
                            <th className="p-2 text-center w-[130px]">
                              No-Show
                            </th>
                            <th className="p-2 text-center w-[160px]">Vitals</th>
                            <th className="p-2 text-left w-[150px]">
                              Start / Pause
                            </th>
                            <th className="p-2 text-left w-[90px]">Type</th>
                            <th className="p-2 text-left w-[140px]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {session.slots
                            .filter(
                              (sl) =>
                                sl.status !== "completed" &&
                                sl.status !== "noshow"
                            )
                            .map((slot, idx) => {
                              const originalIdx = session.slots.indexOf(slot);

                              return (
                                <tr
                                  key={originalIdx}
                                  className={`border-t border-gray-200 hover:bg-gray-50 ${
                                    slot.status === "inconsult"
                                      ? "bg-white"
                                      : slot.status === "waiting"
                                      ? "bg-white"
                                      : "bg-green-50"
                                  }`}
                                >
                                  {/* SLOT */}
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

                                  {/* PATIENT */}
                                  <td className="p-2">
                                    {slot.patient ? (
                                      <>
                                        <div className="font-semibold text-sm text-[--text-highlight]">
                                          {slot.patient?.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {slot.patient?.phone} |{" "}
                                          {slot.patient?.abha} |{" "}
                                          {slot.patient?.gender}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-xs text-gray-400 italic">
                                        (empty slot)
                                      </div>
                                    )}
                                  </td>

                                  {/* NO SHOW COLUMN */}
                                  <td className="p-2 text-center">
                                    {slot.patient && (
                                      <button
                                        className="inline-flex items-center justify-center w-4 h-4 rounded-md bg-red-300 hover:bg-red-400"
                                        title="Mark No-Show"
                                        onClick={() =>
                                          updateSlotStatus(
                                            sIdx,
                                            originalIdx,
                                            "noshow"
                                          )
                                        }
                                      >
                                        <img
                                          src="/icons/noshow.png"
                                          className="w-4 h-4"
                                        />
                                      </button>
                                    )}
                                  </td>

                                  {/* VITALS COLUMN */}
                                  <td className="p-2 text-center">
                                    {slot.patient && (
                                      <>
                                        {userRole === "staff" ? (
                                          <div className="flex items-center gap-2 justify-center">
                                            {/* ✔ Status Chip */}
                                            <span
                                              className={[
                                                "px-2 py-1 text-xs font-medium rounded-md",
                                                slot.vitalsDone
                                                  ? "bg-emerald-200 text-emerald-800"
                                                  : "bg-gray-200 text-gray-600",
                                              ].join(" ")}
                                            >
                                              {slot.vitalsDone
                                                ? "Done"
                                                : "Pending"}
                                            </span>

                                            {/* ✔ Staff still can open Vitals */}
                                            <button
                                              className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 hover:bg-emerald-200"
                                              title="Enter Vitals"
                                              onClick={() => {
                                                const selectedDoc =
                                                  staffDoctors.find(
                                                    (d) =>
                                                      d.name === session.doctor
                                                  );
                                                const deptKey =
                                                  selectedDoc
                                                    ?.departments?.[0] || "";

                                                const params =
                                                  new URLSearchParams({
                                                    branch:
                                                      selectedBranch ?? "",
                                                    doctor:
                                                      session.doctor ?? "",
                                                    dept: deptKey ?? "",
                                                    patientName:
                                                      slot.patient?.name ?? "",
                                                    phone:
                                                      slot.patient?.phone ?? "",
                                                    token: slot.tokenNum ?? "",
                                                    sessionIndex: String(sIdx),
                                                    slotIndex:
                                                      String(originalIdx),
                                                  });

                                                window.location.href = `/staff/console?${params.toString()}`;
                                              }}
                                            >
                                              <img
                                                src="/icons/vitals.png"
                                                className="w-4 h-4"
                                              />
                                            </button>
                                          </div>
                                        ) : (
                                          /* ✔ Doctor sees only the chip */
                                          <span
                                            className={[
                                              "px-2 py-1 text-xs font-medium rounded-md",
                                              slot.vitalsDone
                                                ? "bg-emerald-200 text-emerald-800"
                                                : "bg-gray-200 text-gray-600",
                                            ].join(" ")}
                                          >
                                            {slot.vitalsDone
                                              ? "Done"
                                              : "Pending"}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </td>

                                  {/* START / PAUSE */}
                                  <td className="p-2">
                                    {slot.patient && (
                                      <>
                                        {slot.status === "waiting" && (
                                          <div
                                            className="inline-flex items-center gap-2 cursor-pointer text-[var(--text-highlight)] font-semibold hover:opacity-90"
                                            onClick={() =>
                                              updateSlotStatus(
                                                sIdx,
                                                originalIdx,
                                                "inconsult"
                                              )
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
                                              updateSlotStatus(
                                                sIdx,
                                                originalIdx,
                                                "waiting"
                                              )
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

                                  {/* TYPE */}
                                  <td className="p-2 text-gray-700">
                                    {slot.type === "walkin"
                                      ? "Walk-in"
                                      : slot.type === "appointment"
                                      ? "Appt."
                                      : ""}
                                  </td>

                                  {/* ACTION MENU */}
                                  <td className="p-2">
                                    {slot.patient && (
                                      <div className="absolute inline-block text-left">
                                        <ActionMenu
                                          items={[
                                            {
                                              label: "Payment",
                                              onClick: () => {
                                                setSelectedPatient(
                                                  slot.patient
                                                );
                                                setShowInvoiceModal(true);
                                              },
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
                                                alert(
                                                  `Move up ${slot.patient?.name}`
                                                ),
                                            },
                                          ]}
                                        />
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
                {/* ---------- END OF YOUR EXISTING OPD LEFT PANEL CODE ---------- */}
              </div>
            )}

            {activeTab === "completed" && (
              <div className="ui-card p-3">
                <h3 className="font-semibold text-sm mb-2">
                  Completed Consultations
                </h3>

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
                                    onClick: () => {
                                      setSelectedPatient(slot.patient);
                                      setShowInvoiceModal(true);
                                    },
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
            )}

            {activeTab === "noshow" && (
              <div className="ui-card p-3">
                <h3 className="font-semibold text-sm mb-2">No-Show Queue</h3>

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
                        <td
                          colSpan={3}
                          className="text-center text-gray-500 py-2"
                        >
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
            )}
          </div>

          <div></div>
        </div>
      </div>

      {/* ---------- Walk-in Modal ---------- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="ui-card w-[360px] p-4">
            <h3 className="text-lg font-semibold mb-3">Add Walk-in</h3>

            {/* Form */}
            <div className="grid gap-3">
              {/* Doctor selector (staff only) */}
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

              {/* Patient Name with search */}
              <div className="grid gap-1 relative">
                <label className="text-xs text-gray-600">Patient Name</label>
                <input
                  className="ui-input"
                  value={walkin.name}
                  onChange={(e) =>
                    setWalkin({ ...walkin, name: e.target.value })
                  }
                  placeholder="Search or type name"
                />

                {/* Lookup Results */}
                {patientMatches.length > 0 && (
                  <div className="absolute mt-1 bg-white border rounded shadow-md max-h-40 overflow-y-auto w-full z-50">
                    {patientMatches.map((p) => (
                      <div
                        key={p.phone}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setWalkin({
                            ...walkin,
                            name: p.name,
                            phone: p.phone,
                            gender: "Female", // from your walkin form
                          });
                          setPatientMatches([]);
                        }}
                      >
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone */}
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

              {/* Gender */}
              <div className="grid gap-1">
                <label className="text-xs text-gray-600">Gender</label>
                <select
                  className="ui-input"
                  value={walkin.gender}
                  onChange={(e) =>
                    setWalkin({ ...walkin, gender: e.target.value })
                  }
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                className="px-3 py-1.5 border rounded hover:bg-gray-50 text-sm"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button onClick={handleAddWalkin} className="btn-primary">
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}

      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setSelectedPatient(null);
        }}
        onSave={(amount, patientName) => {
          console.log("Invoice saved:", { amount, patientName });
          setShowInvoiceModal(false);
          setSelectedPatient(null);
          // optional: add to patient billing records or show toast
        }}
      />
    </>
  );
}
