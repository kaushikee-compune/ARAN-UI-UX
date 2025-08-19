"use client";

import React from "react";

/** Row in the table */
export type ImmunizationRow = {
  vaccineName: string;
  dose: string;
  date: string;        // yyyy-mm-dd
  route: string;
  next_dose: string;
  volume: string;
};

/** Form value held in page.tsx state */
export type ImmunizationFormValue = {
  records: ImmunizationRow[];
  vaccinatorName: string;
  vaccinatorRegNo: string;
};

/** Create a fresh empty form */
export function makeEmptyImmunization(): ImmunizationFormValue {
  return {
    records: [
      { vaccineName: "", dose: "", date: "", route: "", next_dose: "", volume: "" },
    ],
    vaccinatorName: "",
    vaccinatorRegNo: "",
  };
}

/** Optional: small preview you can use on the paper when tabIndex === 0 */
export function ImmunizationPreview({ value }: { value: ImmunizationFormValue }) {
  const hasAny =
    value.records.some(
      (r) =>
        r.vaccineName ||
        r.dose ||
        r.date ||
        r.route ||
        r.next_dose ||
        r.volume
    ) || value.vaccinatorName || value.vaccinatorRegNo;

  if (!hasAny) {
    return (
      <div className="text-gray-400">
        (Start filling the Immunization form to see a live preview…)
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full border text-sm table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <Th>Vaccine Name</Th>
              <Th>Dose</Th>
              <Th>Date</Th>
              <Th>Route</Th>
              <Th>next_dose</Th>
              <Th>Volume</Th>
            </tr>
          </thead>
          <tbody>
            {value.records
              .filter(
                (r) =>
                  r.vaccineName ||
                  r.dose ||
                  r.date ||
                  r.route ||
                  r.next_dose ||
                  r.volume
              )
              .map((r, i) => (
                <tr key={i} className="border-t">
                  <Td>{r.vaccineName || "-"}</Td>
                  <Td>{r.dose || "-"}</Td>
                  <Td>{r.date || "-"}</Td>
                  <Td>{r.route || "-"}</Td>
                  <Td>{r.next_dose || "-"}</Td>
                  <Td>{r.volume || "-"}</Td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {(value.vaccinatorName || value.vaccinatorRegNo) && (
        <div className="text-sm text-gray-800 grid gap-1 sm:grid-cols-2">
          <KV label="Vaccinator Name" value={value.vaccinatorName} />
          <KV label="Vaccinator Reg No." value={value.vaccinatorRegNo} />
        </div>
      )}
    </div>
  );
}

/** The actual editor used in the middle panel */
export default function ImmunizationRecord({
  value,
  onChange,
  onSave,
}: {
  value: ImmunizationFormValue;
  onChange: (next: ImmunizationFormValue) => void;
  onSave: () => void; // page.tsx already reads state & saves
}) {
  const rows = value.records;

  const addRow = () =>
    onChange({
      ...value,
      records: [
        ...rows,
        { vaccineName: "", dose: "", date: "", route: "", next_dose: "", volume: "" },
      ],
    });

  const removeRow = (idx: number) =>
    onChange({
      ...value,
      records: rows.filter((_, i) => i !== idx),
    });

  const updateRow = (
    idx: number,
    field: keyof ImmunizationRow,
    v: string
  ) => {
    const next = rows.slice();
    next[idx] = { ...next[idx], [field]: v };
    onChange({ ...value, records: next });
  };

  return (
    <div className="grid gap-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <Th>Vaccine Name</Th>
              <Th>Dose</Th>
              <Th>Date</Th>
              <Th>Route</Th>
              <Th>Volume</Th>
              <Th>Next Due On</Th>             
              <Th className="w-14">Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t align-top">
                <Td>
                  <input
                    className="ui-input w-full"
                    value={row.vaccineName}
                    onChange={(e) => updateRow(idx, "vaccineName", e.target.value)}
                    placeholder="e.g., Tdap"
                  />
                </Td>
                <Td>
                  <input
                    className="ui-input w-full"
                    value={row.dose}
                    onChange={(e) => updateRow(idx, "dose", e.target.value)}
                    placeholder="e.g., 1st / Booster"
                  />
                </Td>
                <Td>
                  <input
                    type="date"
                    className="ui-input w-full"
                    value={row.date}
                    onChange={(e) => updateRow(idx, "date", e.target.value)}
                  />
                </Td>
                <Td>
                  <input
                    className="ui-input w-full"
                    value={row.route}
                    onChange={(e) => updateRow(idx, "route", e.target.value)}
                    placeholder="e.g., IM / SC"
                  />
                </Td>
               
                <Td>
                  <input
                    className="ui-input w-full"
                    value={row.volume}
                    onChange={(e) => updateRow(idx, "volume", e.target.value)}
                    placeholder="e.g., 0.5 mL"
                  />next
                </Td>
                 <Td>
                  <input
                    type="date"
                    className="ui-input w-full"
                    value={row.next_dose}
                    onChange={(e) => updateRow(idx, "next_dose", e.target.value)}                   
                  />
                </Td>
                <Td>
                  <button
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full border hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                    aria-label="Delete row"
                    title="Delete row"
                    onClick={() => removeRow(idx)}
                  >
                    ×
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <div>
        <button
          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          onClick={addRow}
        >
          + Add Row
        </button>
      </div>

      {/* Vaccinator footer */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-[11px] text-gray-600">Vaccinator Name</label>
          <input
            className="ui-input w-full"
            value={value.vaccinatorName}
            onChange={(e) => onChange({ ...value, vaccinatorName: e.target.value })}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-[11px] text-gray-600">Vaccinator Reg No.</label>
          <input
            className="ui-input w-full"
            value={value.vaccinatorRegNo}
            onChange={(e) => onChange({ ...value, vaccinatorRegNo: e.target.value })}
          />
        </div>
      </div>

      {/* Save */}
      <div className="pt-2">
        <button
          className="px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
          onClick={onSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}

/* ------- tiny local table helpers ------- */
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-2 py-1.5 text-left text-gray-700 border text-xs sm:text-sm ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-2 py-1.5 text-gray-900 break-words whitespace-normal align-top border">
      {children}
    </td>
  );
}
function KV({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-500 w-40">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}
