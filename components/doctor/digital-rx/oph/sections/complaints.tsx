"use client";
import React from "react";

export type EyeComplaintRow = {
  symptom: string;
  duration?: string;
  severity?: string;
};

export type OphComplaintsProps = {
  value: any; // DigitalRxFormState
  onChange: (next: any) => void;
};

export default function OphComplaints({ value, onChange }: OphComplaintsProps) {
  // We map OPH complaints INTO the universal field
  const rows: EyeComplaintRow[] = value.chiefComplaintRows ?? [];

  const add = () =>
    onChange({
      ...value,
      chiefComplaintRows: [
        ...rows,
        { symptom: "", duration: "", severity: "" },
      ],
    });

  const remove = (i: number) =>
    onChange({
      ...value,
      chiefComplaintRows: rows.filter((_row, idx) => idx !== i),
    });

  const update = (i: number, patch: Partial<EyeComplaintRow>) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange({ ...value, chiefComplaintRows: next });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Eye Complaints</h3>

      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-1">
          <input
            className="col-span-5 border px-2 py-1"
            placeholder="Symptom"
            value={r.symptom}
            onChange={(e) => update(i, { symptom: e.target.value })}
          />
          <input
            className="col-span-3 border px-2 py-1"
            placeholder="Duration"
            value={r.duration ?? ""}
            onChange={(e) => update(i, { duration: e.target.value })}
          />
          <input
            className="col-span-3 border px-2 py-1"
            placeholder="Severity"
            value={r.severity ?? ""}
            onChange={(e) => update(i, { severity: e.target.value })}
          />

          <button
            className="col-span-1 text-red-500"
            onClick={() => remove(i)}
          >
            ✕
          </button>
        </div>
      ))}

      <button className="text-sm text-blue-600" onClick={add}>
        + Add Eye Complaint
      </button>
    </div>
  );
}
