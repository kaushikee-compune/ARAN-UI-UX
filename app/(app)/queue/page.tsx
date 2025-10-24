"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, Search, Plus, X } from "lucide-react";
import QueueCard, { QueueEntry, QueueStatus } from "@/components/queue/QueueCard";

type QueueData = {
  queue: QueueEntry[];
  completed: QueueEntry[];
};

export default function QueuePage() {
  // In real app, fetch doctor info from context
  const [doctorName] = useState("Dr. Hira Mardi");

  const [data, setData] = useState<QueueData | null>(null);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Modal state
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

  /* ------------------------- Filters ------------------------- */
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
    <div className="space-y-2">
      {/* ---------- Unified Top Bar ---------- */}
      <div className="flex items-center justify-between bg-white-  rounded-xl px-4 py-3 shadow">
        {/* Date Picker */}
        <div className="relative">
          <CalendarDays className="absolute right-2.5 top-2.5 h-4 w-4 text-pink-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-9 ui-input w-[160px]"
          />
        </div>

        {/* Search */}
        <div className="relative w-[440px]">
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search Name / UHID / ABHA / Phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 ui-input w-full"
          />
        </div>

        {/* Doctor Name */}
        <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {doctorName}
        </div>

        {/* Add Walk-in */}
        <button
          onClick={handleAddToQueue}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm hover:opacity-90 transition"
          style={{ background: "var(--secondary)" }}
        >
          <Plus className="w-4 h-4" />
          Add Walk-in
        </button>
      </div>

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
    </div>
  );
}
