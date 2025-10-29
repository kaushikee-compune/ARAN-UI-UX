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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="ui-card w-[min(92vw,600px)] max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <div className="font-semibold text-sm text-gray-900">
              {bed.patient?.name || "Unnamed Patient"}
            </div>
            <div className="text-xs text-gray-500">
              {bed.label} • {bed.patient?.age} • {bed.patient?.gender}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b text-sm">
          {["vitals", "notes", "billing", "reports"].map((t) => (
            <button
              key={t}
              onClick={() =>
                setTab(t as "vitals" | "notes" | "billing" | "reports")
              }
              className={[
                "flex-1 py-2 capitalize transition-colors",
                tab === t
                  ? "font-medium text-[--secondary] border-b-2 border-[--secondary]"
                  : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-800">
          {tab === "vitals" && (
            <section>
              <h3 className="font-semibold mb-2 text-gray-800">
                Hourly Vitals
              </h3>
              <div className="text-xs text-gray-500">
                (Vitals chart placeholder)
              </div>
            </section>
          )}

          {tab === "notes" && (
            <section>
              <h3 className="font-semibold mb-2 text-gray-800">
                Doctor / Nursing Notes
              </h3>
              <textarea
                className="ui-textarea w-full min-h-[100px]"
                placeholder="Add new note..."
              />
            </section>
          )}

          {tab === "billing" && (
            <section>
              <h3 className="font-semibold mb-2 text-gray-800">
                Billing Summary
              </h3>
              <div className="text-xs text-gray-500">
                (Billing items placeholder)
              </div>
            </section>
          )}

          {tab === "reports" && (
            <section>
              <h3 className="font-semibold mb-2 text-gray-800">Reports</h3>
              <div className="text-xs text-gray-500">
                (Upload / preview reports here)
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex justify-between items-center">
          <button className="btn-primary" onClick={discharge}>
            Discharge
          </button>
          <button className="btn-accent text-sm px-4">Save</button>
        </div>
      </div>
    </div>
  );
}
