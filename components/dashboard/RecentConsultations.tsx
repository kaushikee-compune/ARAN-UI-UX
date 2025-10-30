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
    <div className="ui-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          Recent Consultations
        </h3>
        <button className="text-xs font-medium text-[--secondary] hover:underline">
          See All
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : recent && recent.length > 0 ? (
        <ul className="ui-list">
          {recent.map((r) => (
            <li key={r.id} className="py-2.5 border-t border-gray-300">
              <div className="font-medium text-gray-900 truncate">
                {r.patientName}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{r.date}</div>
              {r.summary && (
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {r.summary}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="ui-empty text-sm text-gray-500">
          No recent consultations.
        </div>
      )}
    </div>
  );
}
