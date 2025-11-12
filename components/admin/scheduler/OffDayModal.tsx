"use client";

import React, { useState } from "react";
import type { OffDay } from "./types";

/**
 * OffDayModal
 * ----------------------------------------------------------------------
 * Lets admin mark off-days for a doctor:
 * - Single date or date range
 * - Optional reason
 * - Lists existing off-days
 */
export default function OffDayModal({
  doctorId,
  branchId,
  existing,
  onClose,
  onSave,
}: {
  doctorId: string;
  branchId: string;
  existing: OffDay[];
  onClose: () => void;
  onSave: (next: OffDay[]) => void;
}) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const addOffDay = () => {
    if (!fromDate) return alert("Please select at least a start date");
    const entry: OffDay = {
      doctorId,
      branchId,
      fromDate,
      toDate: toDate || fromDate,
      reason,
    };
    onSave([...existing, entry]);
    setFromDate("");
    setToDate("");
    setReason("");
  };

  const removeOffDay = (idx: number) => {
    const next = existing.filter((_, i) => i !== idx);
    onSave(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="ui-card w-[min(92vw,480px)] max-h-[90vh] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Block Off-Days</h2>
            <p className="text-xs text-gray-500">
              Select one or more days to mark doctor unavailable.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-outline text-xs px-2 py-1"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Add form */}
        <div className="grid gap-2 text-sm">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="grid gap-1">
              <label className="text-[11px] text-gray-600">From Date</label>
              <input
                type="date"
                className="ui-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-[11px] text-gray-600">To Date</label>
              <input
                type="date"
                className="ui-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-[11px] text-gray-600">Reason (optional)</label>
            <input
              type="text"
              className="ui-input"
              placeholder="Conference, Leave, Workshop…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              className="btn-primary text-sm"
              onClick={addOffDay}
              disabled={!fromDate}
            >
              Add Off-Day
            </button>
          </div>
        </div>

        {/* Existing Off-days list */}
        <div className="border-t pt-2">
          <h3 className="text-sm font-medium mb-2">Existing Off-Days</h3>
          {existing.length === 0 ? (
            <div className="text-xs text-gray-500">No off-days yet.</div>
          ) : (
            <ul className="divide-y text-sm">
              {existing.map((o, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between py-1.5"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {o.fromDate === o.toDate
                        ? o.fromDate
                        : `${o.fromDate} → ${o.toDate}`}
                    </div>
                    {o.reason && (
                      <div className="text-xs text-gray-600">{o.reason}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeOffDay(idx)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t">
          <button onClick={onClose} className="btn-outline text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
