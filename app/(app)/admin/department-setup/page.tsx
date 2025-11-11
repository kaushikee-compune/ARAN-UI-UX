"use client";

import React, { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";   // ✅ Global branch selector

type Doctor = { id: string; name: string };
type DepartmentRow = { department: string; doctor?: string };

export default function DepartmentSetupPage() {
  const { selectedBranch } = useBranch();               // ✅ get current branch ID
  const [departments, setDepartments] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rows, setRows] = useState<DepartmentRow[]>([]);
  const [newDept, setNewDept] = useState("");
  const [newDoctor, setNewDoctor] = useState("");

  /* ---------- Load predefined data ---------- */
  useEffect(() => {
    Promise.all([
      fetch("/data/departments-eye.json").then((r) => r.json()),
      fetch("/data/doctors.json").then((r) => r.json()),
    ])
      .then(([deptData, docData]) => {
        setDepartments(Array.isArray(deptData) ? deptData : []);
        setDoctors(Array.isArray(docData) ? docData : []);
      })
      .catch((err) => console.error("Error loading predefined lists:", err));
  }, []);

  /* ---------- Add / Remove Rows ---------- */
  const addRow = () => {
    if (!newDept.trim()) return;
    const newEntry: DepartmentRow = {
      department: newDept.trim(),
      doctor: newDoctor || undefined,
    };
    setRows((prev) => [...prev, newEntry]);
    setNewDept("");
    setNewDoctor("");
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------- Save Handler ---------- */
  const saveChanges = () => {
    const payload = {
      branchId: selectedBranch,
      departments: rows,
    };
    console.log("✅ Department configuration saved:", payload);
  };

  /* ---------- No branch selected ---------- */
  if (!selectedBranch) {
    return (
      <div className="ui-card p-6 text-center text-gray-600">
        Please select a branch to configure departments.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Department Configuration
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Current Branch: <span className="font-medium">{selectedBranch}</span>
          </p>
        </div>
        {rows.length > 0 && (
          <button
            onClick={saveChanges}
            className="btn-primary px-4 py-2 text-sm"
          >
            💾 Save Changes
          </button>
        )}
      </header>

      {/* Input Row */}
      <div className="ui-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Add Department & Assign Doctor (optional)
        </h2>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Department input with datalist */}
          <div className="flex-1 min-w-[240px]">
            <input
              list="dept-options"
              className="ui-input w-full text-sm"
              placeholder="Select or type department"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
            <datalist id="dept-options">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          {/* Doctor dropdown (no free text) */}
          <div className="flex-1 min-w-[240px]">
            <select
              className="ui-input w-full text-sm"
              value={newDoctor}
              onChange={(e) => setNewDoctor(e.target.value)}
            >
              <option value="">Assign Doctor (optional)</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.name}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={addRow}
            className="btn-outline text-sm px-4 py-2 shrink-0"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="ui-card p-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="text-left px-3 py-2">Department</th>
              <th className="text-left px-3 py-2">Assigned Doctor</th>
              <th className="text-center px-3 py-2 w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 text-gray-800">{row.department}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {row.doctor || <span className="italic text-gray-400">—</span>}
                  </td>
                  <td className="text-center px-3 py-2">
                    <button
                      className="text-red-500 text-xs hover:text-red-700"
                      onClick={() => removeRow(i)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-gray-400 italic"
                >
                  No departments added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
