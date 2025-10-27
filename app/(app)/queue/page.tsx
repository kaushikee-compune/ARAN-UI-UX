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
 const noShowSlots = sessions
  .flatMap((s) =>
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* ---------- Header Stats ---------- */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f9fafb",
        }}
      >
        <Typography variant="subtitle2">
          <b>Current Token:</b> {currentToken}
        </Typography>
        <Typography variant="subtitle2">
          <b>Waiting:</b> {waitingCount}
        </Typography>
        <Typography variant="subtitle2">
          <b>Completed:</b> {completedCount}
        </Typography>
        <Typography variant="subtitle2">
          <b>Avg Time:</b> 12 min
        </Typography>
        <Typography variant="subtitle2">
          <b>Doctor:</b> 🟢 In
        </Typography>
      </Paper>

      {/* ---------- Filter Bar ---------- */}
      <Paper
        sx={{
          p: 1.5,
          borderRadius: 2,
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 2,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {userRole === "staff" && (
            <Select
              size="small"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              sx={{ minWidth: 180, background: "white", borderRadius: 1 }}
            >
              <MenuItem value="All">All Doctors</MenuItem>
              {[...new Set(data.sessions.map((s) => s.doctor))].map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          )}

          {/* Search field for staff */}
          {userRole === "staff" && (
            <TextField
              size="small"
              placeholder="Search patient (name / phone / ABHA)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 260, background: "white", borderRadius: 1 }}
            />
          )}
        </Box>

        <Button
          variant="contained"
          startIcon={<UserPlus size={16} />}
          sx={{
            background: "var(--secondary,#64ac44)",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            px: 2.5,
          }}
          onClick={() => setShowModal(true)}
        >
          Add Walk-in
        </Button>
      </Paper>

      {/* ---------- OPD + Completed Panels ---------- */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {/* LEFT: OPD Queues */}
        <Box>
          {sessions.map((session, sIdx) => (
            <Paper
              key={sIdx}
              sx={{
                mb: 2,
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: "#f3f4f6",
                }}
              >
                <Typography fontWeight={600}>
                  {session.doctor} — {session.sessionName} Session
                </Typography>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Slot</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {session.slots
                    .filter((sl) => sl.status !== "completed")
                    .map((slot, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          backgroundColor:
                            slot.status === "inconsult"
                              ? "#e0f2fe"
                              : slot.status === "waiting"
                              ? "#fff"
                              : "#f9fafb",
                        }}
                      >
                        <TableCell sx={{ width: 90 }}>
                          {slot.slotStart} – {slot.slotEnd}
                        </TableCell>
                        <TableCell>
                          {slot.patient ? (
                            <>
                              <Typography fontWeight={600} fontSize="0.9rem">
                                {slot.patient.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                fontSize="0.75rem"
                              >
                                {slot.patient.phone} | {slot.patient.abha} |
                                {slot.patient.gender}
                              </Typography>
                            </>
                          ) : (
                            <Typography color="text.disabled" fontSize="0.8rem">
                              (empty slot)
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{slot.doctor}</TableCell>
                        <TableCell>
                          {slot.type === "walkin"
                            ? "Walk-in"
                            : slot.type === "appointment"
                            ? "Appt."
                            : ""}
                        </TableCell>
                        <TableCell>
                          {slot.status === "waiting" && (
                            <>
                              <Button
                                size="small"
                                onClick={() =>
                                  updateSlotStatus(sIdx, idx, "inconsult")
                                }
                              >
                                <Play size={14} />
                              </Button>
                              <Button
                                size="small"
                                onClick={() =>
                                  updateSlotStatus(sIdx, idx, "noshow")
                                }
                              >
                                <X size={14} />
                              </Button>
                            </>
                          )}
                          {slot.status === "inconsult" && (
                            <>
                              <Button
                                size="small"
                                onClick={() =>
                                  updateSlotStatus(sIdx, idx, "completed")
                                }
                              >
                                <Check size={14} />
                              </Button>
                              <Button
                                size="small"
                                onClick={() =>
                                  updateSlotStatus(sIdx, idx, "waiting")
                                }
                              >
                                <Pause size={14} />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Paper>
          ))}
        </Box>

        {/* RIGHT: Completed */}
        <Box>
          <Paper
            sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            <Box
              sx={{
                px: 2,
                py: 1,
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#f3f4f6",
              }}
            >
              <Typography fontWeight={600}>Completed Consultations</Typography>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Slot</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions
                  .flatMap((s) =>
                    s.slots
                      .filter((sl) => sl.status === "completed")
                      .map((sl) => ({ ...sl, session: s.sessionName }))
                  )
                  .map((slot, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ width: 90 }}>
                        {slot.slotStart} – {slot.slotEnd}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600} fontSize="0.9rem">
                          {slot.patient?.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontSize="0.75rem"
                        >
                          {slot.patient?.phone} | {slot.patient?.abha}
                        </Typography>
                      </TableCell>
                      <TableCell>{slot.doctor}</TableCell>
                      <TableCell>
                        <Button size="small">
                          <CreditCard size={14} />
                        </Button>
                        <Button size="small">
                          <Upload size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Paper>

          {/* ---------- No-Show Queue ---------- */}
        <Paper
          sx={{
            mt: 2,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#f3f4f6",
            }}
          >
            <Typography fontWeight={600}>No-Show Queue</Typography>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Slot</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Doctor</TableCell>
                <TableCell>Session</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {noShowSlots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ py: 1 }}
                    >
                      No patients marked as no-show
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {noShowSlots.map((slot, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ width: 90 }}>
                    {slot.slotStart} – {slot.slotEnd}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600} fontSize="0.9rem">
                      {slot.patient?.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontSize="0.75rem"
                    >
                      {slot.patient?.phone} | {slot.patient?.abha}
                    </Typography>
                  </TableCell>
                  <TableCell>{slot.doctor}</TableCell>
                  <TableCell>{slot.session}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
        </Box>
        
      </Box>

      {/* ---------- Walk-in Modal ---------- */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>Add Walk-in Patient</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {/* Doctor selector only for staff */}
            {userRole === "staff" && (
              <Select
                label="Doctor"
                size="small"
                value={(walkin as any).doctor || ""}
                onChange={(e) =>
                  setWalkin({ ...walkin, doctor: e.target.value as string })
                }
                displayEmpty
              >
                <MenuItem value="">Select Doctor</MenuItem>
                {[...new Set(data.sessions.map((s) => s.doctor))].map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </Select>
            )}

            <TextField
              label="Name"
              size="small"
              value={walkin.name}
              onChange={(e) => setWalkin({ ...walkin, name: e.target.value })}
            />
            <TextField
              label="Phone"
              size="small"
              value={walkin.phone}
              onChange={(e) => setWalkin({ ...walkin, phone: e.target.value })}
            />
            <Select
              size="small"
              value={walkin.gender}
              onChange={(e) =>
                setWalkin({ ...walkin, gender: e.target.value as string })
              }
            >
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleAddWalkin} variant="contained">
            Add to Queue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
