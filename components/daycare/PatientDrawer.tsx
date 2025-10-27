"use client";

import React, { useState } from "react";
import type { Bed } from "./types";

interface PatientDrawerProps {
  bed: Bed;
  onClose: () => void;
  onDischarge: (bedId: string) => void;
}

export default function PatientDrawer({
  bed,
  onClose,
  onDischarge,
}: PatientDrawerProps) {
  const [tab, setTab] = useState<"vitals" | "notes" | "billing" | "reports">(
    "vitals"
  );

  const discharge = () => {
    if (confirm("Mark this patient as discharged?")) {
      onDischarge(bed.bedId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-end z-50">
      <div className="w-[min(90vw,420px)] bg-white h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">{bed.patient?.name}</div>
            <div className="text-xs text-gray-500">
              {bed.label} • {bed.patient?.age} • {bed.patient?.gender}
            </div>
          </div>
          <button className="text-sm text-gray-500" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b text-sm">
          {["vitals", "notes", "billing", "reports"].map((t) => (
            <button
              key={t}
              className={`flex-1 py-2 ${
                tab === t ? "font-medium border-b-2 border-[--secondary]" : ""
              }`}
              onClick={() =>
                setTab(t as "vitals" | "notes" | "billing" | "reports")
              }
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="flex-1 overflow-y-auto p-4 text-sm">
          {tab === "vitals" && (
            <div>
              <div className="font-semibold mb-2">Hourly Vitals</div>
              <div className="text-xs text-gray-500">
                (Vitals chart placeholder)
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div>
              <div className="font-semibold mb-2">Doctor/Nursing Notes</div>
              <textarea
                className="ui-textarea w-full min-h-[100px]"
                placeholder="Add new note..."
              />
            </div>
          )}

          {tab === "billing" && (
            <div>
              <div className="font-semibold mb-2">Billing Summary</div>
              <div className="text-xs text-gray-500">
                (Billing items placeholder)
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div>
              <div className="font-semibold mb-2">Reports</div>
              <div className="text-xs text-gray-500">
                (Upload / preview reports here)
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex justify-between items-center">
          <button
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={discharge}
          >
            Discharge
          </button>
          <button className="text-sm bg-[--secondary] text-white px-4 py-1.5 rounded hover:opacity-90">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
