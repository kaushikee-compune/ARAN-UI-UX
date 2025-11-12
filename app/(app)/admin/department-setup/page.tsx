"use client";

import React, { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext"; // ✅ Global branch selector
import usersData from "@/public/data/users.json";

type Doctor = { id: string; name: string };
type DepartmentRow = { department: string; doctor?: string };

export default function DepartmentSetupPage() {
  const { selectedBranch } = useBranch();
  const [departments, setDepartments] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rows, setRows] = useState<DepartmentRow[]>([]);
  const [newDept, setNewDept] = useState("");
  const [newDoctor, setNewDoctor] = useState("");
  const [branchStatus, setBranchStatus] = useState<"active" | "pending" | null>(
    null
  );

  /* -------------------------------------------------------------------------- */
  /*                     Detect branch status from users.json                   */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!selectedBranch) return;

    const clinic = usersData.clinics?.[0];
    const foundBranch = clinic?.branches?.find(
      (b: any) => b.id === selectedBranch
    );

    const status =
      foundBranch?.status === "active"
        ? "active"
        : foundBranch?.status === "pending"
        ? "pending"
        : null;

    setBranchStatus(status);
  }, [selectedBranch]);

  /* -------------------------------------------------------------------------- */
  /*                         Load predefined lists (once)                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const loadLists = async () => {
      try {
        const base = window.location.origin;
        const deptRes = await fetch(`${base}/data/departments-eye.json`);
        const docRes = await fetch(`${base}/data/doctors.json`);

        if (!deptRes.ok || !docRes.ok)
          throw new Error("Failed to fetch JSON data");

        const deptData = await deptRes.json();
        const docData = await docRes.json();

        setDepartments(
          Array.isArray(deptData) ? deptData : deptData.departments || []
        );
        setDoctors(Array.isArray(docData) ? docData : docData.doctors || []);
      } catch (err) {
        console.error("❌ Error loading predefined lists:", err);
      }
    };
    loadLists();
  }, []);
  /* -------------------------------------------------------------------------- */
  /*                 Clear data when branch changes (fresh state)               */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    // Whenever branch switches, clear existing rows and inputs
    setRows([]);
    setNewDept("");
    setNewDoctor("");
  }, [selectedBranch]);

  /* -------------------------------------------------------------------------- */
  /*                           Add / Remove / Save                              */
  /* -------------------------------------------------------------------------- */
  const addRow = () => {
    if (!newDept.trim()) return;
    const entry: DepartmentRow = {
      department: newDept.trim(),
      doctor: newDoctor || undefined,
    };
    setRows((prev) => [...prev, entry]);
    setNewDept("");
    setNewDoctor("");
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const saveChanges = () => {
    const payload = {
      branchId: selectedBranch,
      departments: rows,
    };
    console.log("✅ Department configuration saved:", payload);
  };

  /* -------------------------------------------------------------------------- */
  /*                              Conditional Views                             */
  /* -------------------------------------------------------------------------- */
  if (!selectedBranch) {
    return (
      <div className="ui-card p-6 text-center text-gray-600">
        Please select a branch to configure departments.
      </div>
    );
  }

  if (branchStatus === "pending") {
    return (
      <div className="ui-card p-8 text-center text-amber-700 bg-amber-50 border border-amber-200">
        <h2 className="text-base font-semibold mb-2">
          This branch is not yet activated.
        </h2>
        <p className="text-sm italic">Awaiting approval from ARAN Admin.</p>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                              Render UI                                     */
  /* -------------------------------------------------------------------------- */
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
            Current Branch:{" "}
            <span className="font-medium">
              {typeof selectedBranch === "object" && selectedBranch
                ? selectedBranch.name
                : selectedBranch}
            </span>
          </p>
        </div>
        {rows.length > 0 && (
          <button
            onClick={saveChanges}
            className="btn-accent px-4 py-2 text-sm"
          >
            Save Changes
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
            <tr className="border-b border-gray-300 bg-gray-100 text-gray-700">
              <th className="text-left px-3 py-2">Department</th>
              <th className="text-left px-3 py-2">Assigned Doctor</th>
              <th className="text-center px-3 py-2 w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="px-3 py-2 text-gray-800">{row.department}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {row.doctor || (
                      <span className="italic text-gray-400">—</span>
                    )}
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
