"use client";
import React from "react";

export type OphInvestigationRow = {
  test: string;
  notes?: string;
  status?: string;
};

export type OphInvestigationsProps = {
  value: any;        // DigitalRxFormState
  onChange: (next: any) => void;
};

export default function OphInvestigations({
  value,
  onChange,
}: OphInvestigationsProps) {

  // Use the unified investigationRows field
  const rows: OphInvestigationRow[] = value.investigationRows ?? [];

  const add = () =>
    onChange({
      ...value,
      investigationRows: [
        ...rows,
        { test: "", notes: "", status: "" },
      ],
    });

  const remove = (i: number) =>
    onChange({
      ...value,
      investigationRows: rows.filter(
        (_row: OphInvestigationRow, idx: number) => idx !== i
      ),
    });

  const update = (i: number, patch: Partial<OphInvestigationRow>) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange({ ...value, investigationRows: next });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Ophthalmology Investigations</h3>

      {rows.map((r: OphInvestigationRow, i: number) => (
        <div key={i} className="grid grid-cols-12 gap-1">

          <input
            className="col-span-5 border px-2 py-1"
            placeholder="Investigation"
            value={r.test}
            onChange={(e) => update(i, { test: e.target.value })}
          />

          <input
            className="col-span-5 border px-2 py-1"
            placeholder="Notes"
            value={r.notes ?? ""}
            onChange={(e) => update(i, { notes: e.target.value })}
          />

          <select
            className="col-span-1 border px-2 py-1"
            value={r.status ?? ""}
            onChange={(e) => update(i, { status: e.target.value })}
          >
            <option value="">—</option>
            <option value="Ordered">Ordered</option>
            <option value="Done">Done</option>
          </select>

          <button
            className="col-span-1 text-red-500"
            onClick={() => remove(i)}
          >
            ✕
          </button>

        </div>
      ))}

      <button className="text-sm text-blue-600" onClick={add}>
        + Add Investigation
      </button>
    </div>
  );
}
