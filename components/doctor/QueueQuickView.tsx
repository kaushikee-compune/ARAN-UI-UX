"use client";

import React from "react";

type QueueQuickViewProps = {
  onClose: () => void;
  onStart?: (token: string) => void; // optional callback when start is clicked
};

const mockData = [
  { token: "T001", name: "A. Sharma", slot: "10:00 AM", care: "Follow Up" },
  { token: "T002", name: "B. Verma", slot: "10:15 AM", care: "Consultation" },
  { token: "T003", name: "C. Patel", slot: "10:30 AM", care: "Investigation" },
];

export default function QueueQuickView({ onClose, onStart }: QueueQuickViewProps) {
  return (
    <div className="fixed top-20 right-6 z-50 w-[min(90vw,500px)] bg-white shadow-2xl rounded-2xl border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="text-sm font-semibold">OPD Queue</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg"
          aria-label="Close queue quick view"
        >
          ×
        </button>
      </div>

      {/* Table */}
      <div className="p-3 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2 px-2">Token</th>
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Slot Time</th>
              <th className="py-2 px-2">Care Type</th>
              <th className="py-2 px-2 text-center">Start</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row) => (
              <tr
                key={row.token}
                className="border-b last:border-0 hover:bg-gray-50"
              >
                <td className="py-2 px-2">{row.token}</td>
                <td className="py-2 px-2">{row.name}</td>
                <td className="py-2 px-2">{row.slot}</td>
                <td className="py-2 px-2">{row.care}</td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => onStart?.(row.token)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                    title="Start consultation"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
