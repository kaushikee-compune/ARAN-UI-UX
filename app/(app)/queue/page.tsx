"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, Search, Plus, X } from "lucide-react";
import {
  Paper,
  Box,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import QueueCard, { QueueEntry, QueueStatus } from "@/components/queue/QueueCard";

type QueueData = {
  queue: QueueEntry[];
  completed: QueueEntry[];
};

export default function QueuePage() {
  const [doctorName] = useState("Dr. Hira Mardi");
  const [data, setData] = useState<QueueData | null>(null);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [showModal, setShowModal] = useState(false);
  const [walkin, setWalkin] = useState({ name: "", gender: "Female", age: "" });

  /* ------------------------- Load mock data ------------------------- */
  useEffect(() => {
    fetch("/data/queue.json")
      .then((r) => r.json())
      .then((raw) => {
        const waiting = (raw.waiting || []).map((p: any) => ({
          ...p,
          status: "waiting" as QueueStatus,
        }));
        const current = (raw.current || []).map((p: any) => ({
          ...p,
          status: "inconsult" as QueueStatus,
        }));
        const completed = (raw.completed || []).map((p: any) => ({
          ...p,
          status: "completed" as QueueStatus,
        }));
        setData({ queue: [...waiting, ...current], completed });
      })
      .catch((e) => console.error("Failed to load queue data", e));
  }, []);

  /* ------------------------- Add Walk-in ------------------------- */
  const handleAddToQueue = () => setShowModal(true);

  const handleSaveWalkin = () => {
    if (!data) return;
    if (!walkin.name.trim()) return alert("Please enter patient name");

    const nextToken = `T${(data.queue.length + data.completed.length + 1)
      .toString()
      .padStart(2, "0")}`;

    const newEntry: QueueEntry = {
      uhid: `UHID${Math.floor(Math.random() * 900 + 100)}`,
      token: nextToken,
      name: walkin.name,
      gender: walkin.gender,
      abhaAddress: "—",
      status: "waiting" as QueueStatus,
      isNew: true,
    };

    setData((d) => d && { ...d, queue: [...d.queue, newEntry] });
    setShowModal(false);
    setWalkin({ name: "", gender: "Female", age: "" });
  };

  /* ------------------------- Move Up / Down ------------------------- */
  const moveEntry = (index: number, direction: "up" | "down") => {
    if (!data) return;
    const newList = [...data.queue];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [
      newList[targetIndex],
      newList[index],
    ];
    setData({ ...data, queue: newList });
  };

  /* ------------------------- Status Change ------------------------- */
  const updateStatus = (uhid: string, status: QueueEntry["status"]) => {
    if (!data) return;
    const patient = data.queue.find((p) => p.uhid === uhid);
    if (!patient) return;

    if (status === "completed") {
      const updatedPatient = { ...patient, status: "completed" as QueueStatus };
      const remainingQueue = data.queue.filter((p) => p.uhid !== uhid);
      setData({
        queue: remainingQueue,
        completed: [updatedPatient, ...data.completed],
      });
      return;
    }

    const newList = data.queue.map((p) =>
      p.uhid === uhid ? { ...p, status } : p
    );
    setData({ ...data, queue: newList });
  };

  /* ------------------------- Sort Queue (InConsult on top) ------------------------- */
  const sortedQueue = [...(data?.queue || [])].sort((a, b) => {
    if (a.status === "inconsult" && b.status !== "inconsult") return -1;
    if (a.status !== "inconsult" && b.status === "inconsult") return 1;
    return 0;
  });

  const filteredQueue = sortedQueue.filter((p) =>
    [p.name, p.uhid, p.abhaAddress]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const filteredCompleted = data?.completed.filter((p) =>
    [p.name, p.uhid, p.abhaAddress]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (!data) return <p className="text-sm text-gray-600">Loading queue…</p>;

  /* ------------------------- JSX ------------------------- */
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 3,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      {/* ---------- Top Bar (Patient List Style) ---------- */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          backgroundColor: "#f9fafb",
          borderRadius: 2,
          px: 1.5,
          py: 1.2,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        {/* Date Picker */}
        <TextField
          type="date"
          size="small"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          sx={{ width: 160, background: "white", borderRadius: 1 }}
          InputProps={{
            startAdornment: (
              <CalendarDays
                size={16}
                style={{ marginRight: 6, color: "#6b7280" }}
              />
            ),
          }}
        />

        {/* Search */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
          <Search
            size={16}
            style={{ marginRight: 8, color: "#6b7280", flexShrink: 0 }}
          />
          <TextField
            size="small"
            placeholder="Search (name, UHID, ABHA, phone)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, background: "white", borderRadius: 1 }}
          />
        </Box>

        {/* Doctor Name */}
        <Typography
          sx={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#374151",
            minWidth: 160,
            textAlign: "center",
          }}
        >
          {doctorName}
        </Typography>

        {/* Add Walk-in Button */}
        <button
          style={{
            background: "var(--secondary, #64ac44)",
            color: "#fff",
            padding: "7px 16px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
          onClick={handleAddToQueue}
        >
          
          Add Walk-in
        </button>
      </Box>

      {/* ---------- Columns ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: OPD Queue */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            OPD Queue
          </h2>
          <div className="space-y-2">
            {filteredQueue.map((entry, idx) => (
              <QueueCard
                key={entry.uhid}
                entry={entry}
                onMoveUp={() => moveEntry(idx, "up")}
                onMoveDown={() => moveEntry(idx, "down")}
                onStatusChange={updateStatus}
              />
            ))}
            {filteredQueue.length === 0 && (
              <p className="text-xs text-gray-500">No patients in queue.</p>
            )}
          </div>
        </div>

        {/* RIGHT: Completed */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Completed Consultations
          </h2>
          <div className="space-y-2">
            {filteredCompleted?.map((entry) => (
              <QueueCard key={entry.uhid} entry={entry} />
            ))}
            {filteredCompleted?.length === 0 && (
              <p className="text-xs text-gray-500">No completed visits.</p>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Walk-in Modal ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[380px] relative">
            <button
              className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-semibold mb-3">
              Add Walk-in Patient
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={walkin.name}
                  onChange={(e) =>
                    setWalkin({ ...walkin, name: e.target.value })
                  }
                  className="ui-input w-full mt-1"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Gender</label>
                <select
                  value={walkin.gender}
                  onChange={(e) =>
                    setWalkin({ ...walkin, gender: e.target.value })
                  }
                  className="ui-input w-full mt-1"
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Age</label>
                <input
                  type="number"
                  value={walkin.age}
                  onChange={(e) =>
                    setWalkin({ ...walkin, age: e.target.value })
                  }
                  className="ui-input w-full mt-1"
                  placeholder="Enter age"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWalkin}
                className="px-4 py-2 text-sm rounded-md text-white"
                style={{ background: "var(--secondary)" }}
              >
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </Paper>
  );
}
