"use client";

import React, { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";
import usersData from "@/public/data/users.json";

type CareTypeRow = { careType: string };

export default function CaretypeSetupPage() {
  const { selectedBranch } = useBranch();
  const [careTypes, setCareTypes] = useState<string[]>([]);
  const [rows, setRows] = useState<CareTypeRow[]>([]);
  const [newCareType, setNewCareType] = useState("");
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
  /*                       Load predefined care types JSON                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const loadCareTypes = async () => {
      try {
        const base = window.location.origin;
        const res = await fetch(`${base}/data/caretypes.json`);
        if (!res.ok) throw new Error("Failed to fetch care types");
        const data = await res.json();
        setCareTypes(Array.isArray(data) ? data : data.careTypes || []);
      } catch (err) {
        console.error("❌ Error loading caretypes:", err);
      }
    };
    loadCareTypes();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                       Reset table when branch changes                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    setRows([]);
    setNewCareType("");
  }, [selectedBranch]);

  /* -------------------------------------------------------------------------- */
  /*                           Add / Remove / Save                              */
  /* -------------------------------------------------------------------------- */
  const addRow = () => {
    if (!newCareType.trim()) return;
    const entry: CareTypeRow = { careType: newCareType.trim() };
    setRows((prev) => [...prev, entry]);
    setNewCareType("");
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const saveChanges = () => {
    const payload = {
      branchId: selectedBranch,
      careTypes: rows,
    };
    console.log("✅ Caretype configuration saved:", payload);
  };

  /* -------------------------------------------------------------------------- */
  /*                           Conditional Rendering                            */
  /* -------------------------------------------------------------------------- */
  if (!selectedBranch) {
    return (
      <div className="ui-card p-6 text-center text-gray-600">
        Please select a branch to configure care types.
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
  return (
    <div className="min-h-screen bg-white p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Caretype Configuration
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Current Branch:{" "}
            <span className="font-medium text-gray-700">
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
          Add or Select Caretype
        </h2>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Caretype input with datalist */}
          <div className="flex-1 min-w-[240px]">
            <input
              list="caretype-options"
              className="ui-input w-full text-sm"
              placeholder="Select or type caretype"
              value={newCareType}
              onChange={(e) => setNewCareType(e.target.value)}
            />
            <datalist id="caretype-options">
              {careTypes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
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
              <th className="text-left px-3 py-2">Caretype</th>
              <th className="text-center px-3 py-2 w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="px-3 py-2 text-gray-800">{row.careType}</td>
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
                  colSpan={2}
                  className="px-3 py-6 text-center text-gray-400 italic"
                >
                  No caretypes added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
