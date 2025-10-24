"use client";
import React from "react";

export type ConsultationEntry = {
  id: string;
  patientName: string;
  date: string;
  summary: string;
};

export default function RecentConsultations({
  recent,
}: {
  recent?: ConsultationEntry[];
}) {
  const loading = !recent;

  return (
    <div className="ui-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Recent Consultations</h3>
        <button className="text-xs text-[--secondary]">See All</button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : recent && recent.length > 0 ? (
        <ul className="divide-y">
          {recent.map((r) => (
            <li key={r.id} className="py-2 text-sm">
              <div className="font-medium text-gray-800">{r.patientName}</div>
              <div className="text-gray-500 text-xs">{r.date}</div>
              <div className="text-gray-600 text-xs mt-1">{r.summary}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No recent consultations.</div>
      )}
    </div>
  );
}
