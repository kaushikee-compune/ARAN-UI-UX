"use client";

import { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";

export default function TodayMetricsRow() {
  const { selectedBranch } = useBranch();

  const [queueData, setQueueData] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const q = await fetch("/data/queue.json").then((r) => r.json());
      const p = await fetch("/data/patients.json").then((r) => r.json());
      setQueueData(q);
      setPatients(p);
    }
    load();
  }, []);

  if (!queueData) return null;

  // Today
  const today = new Date().toISOString().split("T")[0];

  // ---- Count Appointments (only appointment slots) ----
  const todaysSessions = queueData.sessions.filter(
    (s: any) => s.branchId === selectedBranch
  );

  const appointmentCount = todaysSessions.reduce((acc: number, s: any) => {
    return (
      acc +
      s.slots.filter((slot: any) => slot.type === "appointment").length
    );
  }, 0);

  // ---- Queue Summary ----
  const waiting = todaysSessions.reduce(
    (acc: number, s: any) =>
      acc + s.slots.filter((sl: any) => sl.status === "waiting").length,
    0
  );

  const completed = todaysSessions.reduce(
    (acc: number, s: any) =>
      acc + s.slots.filter((sl: any) => sl.status === "completed").length,
    0
  );

  // ---- Today's Registrations ----
  const todaysRegistrations = patients.filter((p: any) =>
    p.registrations.some(
      (r: any) =>
        r.branchId === selectedBranch && r.registrationDate === today
    )
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1 */}
      <div className="ui-card p-4 border rounded-xl shadow-sm bg-white">
        <div className="text-sm text-gray-500">Appointments Today</div>
        <div className="text-2xl font-semibold mt-1">{appointmentCount}</div>
      </div>

      {/* Card 2 */}
      <div className="ui-card p-4 border rounded-xl shadow-sm bg-white">
        <div className="text-sm text-gray-500">Waiting in Queue</div>
        <div className="text-2xl font-semibold mt-1">{waiting}</div>

        <div className="text-sm text-gray-500 mt-3">Completed</div>
        <div className="text-xl font-semibold">{completed}</div>
      </div>

      {/* Card 3 */}
      <div className="ui-card p-4 border rounded-xl shadow-sm bg-white">
        <div className="text-sm text-gray-500">New Registrations Today</div>
        <div className="text-2xl font-semibold mt-1">
          {todaysRegistrations}
        </div>
      </div>
    </div>
  );
}
