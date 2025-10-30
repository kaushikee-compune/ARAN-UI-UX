"use client";

import React, { useEffect, useState } from "react";

export type CanonicalRecord = {
  id: string;
  dateISO: string;
  type: string;
  details?: string;
};

async function loadMockRecords(patientId: string): Promise<CanonicalRecord[]> {
  // Replace this with real API later
  return [
    { id: "1", dateISO: "2025-02-02", type: "Prescription", details: "Paracetamol 500mg" },
    { id: "2", dateISO: "2025-01-19", type: "Lab", details: "CBC normal" },
  ];
}

export default function PastRecordsPanel({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState<CanonicalRecord[]>([]);
  useEffect(() => {
    loadMockRecords(patientId)
      .then(setRecords)
      .catch((err) => console.error(err));
  }, [patientId]);

  if (!records.length)
    return (
      <div className="text-center text-sm text-gray-500 py-10">
        No past records found
      </div>
    );

  const grouped: Record<string, CanonicalRecord[]> = {};
  for (const r of records) {
    if (!grouped[r.dateISO]) grouped[r.dateISO] = [];
    grouped[r.dateISO].push(r);
  }
  const dates = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div className="space-y-8">
      {dates.map((date) => (
        <div key={date} className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 border-b pb-1">
            Records • {date}
          </h2>
          <ul className="space-y-2">
            {grouped[date].map((r) => (
              <li
                key={r.id}
                className="ui-card p-3 text-sm text-gray-700 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{r.type}</div>
                  {r.details && (
                    <div className="text-xs text-gray-500">{r.details}</div>
                  )}
                </div>
                <button className="text-xs text-[--secondary] hover:underline">
                  View
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
