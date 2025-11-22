"use client";

import { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";

export default function QueueSnapshot() {
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

  const waitingSlots = sessions
    .flatMap((s: any) => s.slots)
    .filter((sl: any) => sl.status === "waiting")
    .slice(0, 5);

  return (
    <div className="ui-card p-4 border  rounded-xl shadow-sm bg-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">OPD Queue</h2>
        <a
          href="/queue"
          className="text-sm text-[--secondary] hover:underline"
        >
          Open Queue →
        </a>
      </div>

      {waitingSlots.length === 0 && (
        <div className="text-sm text-gray-500">No patients waiting.</div>
      )}

      <div className="space-y-3">
        {waitingSlots.map((slot: any, i: number) => (
          <div
            key={i}
            className="p-3 bg-gray-50 rounded-lg border border-gray-300 flex justify-between"
          >
            <div>
              <div className="font-medium">
                {slot.patient?.name || "Unknown"}
              </div>
              <div className="text-xs text-gray-600">
                {slot.patient?.gender} • {slot.patient?.phone}
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700">
              {slot.tokenNum || "--"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
