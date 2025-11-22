"use client";

import { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";

export default function TodayAppointments() {
  const { selectedBranch } = useBranch();
  const [queueData, setQueueData] = useState<any>(null);

  useEffect(() => {
    fetch("/data/queue.json")
      .then((r) => r.json())
      .then(setQueueData);
  }, []);

  if (!queueData) return null;

  const sessions = queueData.sessions.filter(
    (s: any) => s.branchId === selectedBranch
  );

  const appointments = sessions
    .flatMap((s: any) => s.slots)
    .filter((sl: any) => sl.type === "appointment")
    .slice(0, 6);

  return (
    <div className="ui-card p-4 border rounded-xl shadow-sm bg-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Today's Appointments</h2>
        <a
          href="/appointments"
          className="text-sm text-[--secondary] hover:underline"
        >
          View All →
        </a>
      </div>

      {appointments.length === 0 && (
        <div className="text-sm text-gray-500">
          No appointments for today.
        </div>
      )}

      <div className="space-y-3">
        {appointments.map((slot: any, i: number) => (
          <div
            key={i}
            className="p-3 bg-gray-50 rounded-lg border border-gray-300 flex justify-between"
          >
            <div>
              <div className="font-medium">
                {slot.patient?.name || "Unknown"}
              </div>
              <div className="text-xs text-gray-600">
                {slot.slotStart} – {slot.slotEnd}
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-1">
              {slot.patient?.gender}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
