"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export type QueueEntry = {
  patientId: string;
  patientName: string;
  visitType: string;
  time: string;
  status: string;
};

export default function QueueTable({ queue }: { queue?: QueueEntry[] }) {
  const router = useRouter();
  const loading = !queue;

  return (
    <div className="ui-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {/* “Live OPD Queue” now acts as a styled button */}
        <button
          onClick={() => router.push("/queue")}
          className="btn-accent "
          title="Go to full OPD Queue panel"
        >
          Today's OPD Queue
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : queue && queue.length > 0 ? (
        <table className="w-full text-sm border-t">
          <thead className="text-gray-500">
            <tr>
              <th className="text-left py-2">Patient</th>
              <th className="text-left py-2">Visit Type</th>
              <th className="text-left py-2">Time</th>
              <th className="text-right py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((p) => (
              <tr key={p.patientId} className="border-t border-gray-300">
                <td className="py-2">{p.patientName}</td>
                <td>{p.visitType}</td>
                <td>{p.time}</td>
                <td className="text-right">
                  <button
                    className="inline-flex items-center gap-1 text-[var(--text-highlight)]  font-semibold px-2 py-1 rounded-md hover:opacity-90"
                    onClick={() => router.push(`/doctor/console/`)}
                  >
                    <span>Start</span>
                    <Image
                      src="/icons/Start.png"
                      alt="Start Icon"
                      width={16}
                      height={16}
                      className="inline-block"
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-sm text-gray-500">No patients in queue.</div>
      )}
    </div>
  );
}
