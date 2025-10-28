"use client";
import React, { useState } from "react";
import type { LabTest } from "@/types/lab";
import { MaterialReactTable } from "material-react-table";
import toast from "react-hot-toast";

type Props = {
  patientName?: string;
  isDoctorContext?: boolean;
  onSubmit: (data: {
    patientName: string;
    category: string;
    tests: LabTest[];
    remarks?: string;
  }) => void;
  onCancel: () => void;
};

// Common test library per category
const TEST_LIBRARY: Record<string, string[]> = {
  Blood: [
    "Complete Blood Count (CBC)",
    "Lipid Profile",
    "Liver Function Test (LFT)",
    "Thyroid Profile",
    "Blood Sugar (Fasting)",
    "Kidney Function Test (KFT)",
    "HbA1c",
    "Vitamin D",
  ],
  Urine: [
    "Routine Urine Examination",
    "Urine Culture",
    "Pregnancy Test (hCG)",
    "24hr Protein",
    "Urine Microalbumin",
  ],
  Imaging: [
    "Ultrasound Abdomen",
    "X-Ray Chest",
    "CT Scan Brain",
    "MRI Spine",
    "Mammography",
    "Echocardiography",
  ],
  Other: ["ECG", "Stool Routine", "COVID RT-PCR", "Pap Smear", "Sputum AFB"],
};

export default function LabRequestForm({
  patientName = "",
  isDoctorContext,
  onSubmit,
  onCancel,
}: Props) {
  const [category, setCategory] = useState<string>("Blood");
  const [showMore, setShowMore] = useState(false);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [remarks, setRemarks] = useState("");
  const [localPatientName, setLocalPatientName] = useState(patientName);

  const visibleTests = showMore
    ? TEST_LIBRARY[category]
    : TEST_LIBRARY[category].slice(0, 4);

  const toggleTest = (testName: string) => {
    setSelectedTests((prev) => {
      const exists = prev.find((t) => t.name === testName);
      if (exists) return prev.filter((t) => t.name !== testName);
      return [...prev, { name: testName, remarks: "" }];
    });
  };

  const updateComment = (i: number, text: string) => {
    setSelectedTests((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], remarks: text };
      return next;
    });
  };

  const handleSubmit = () => {
    if (!isDoctorContext && !localPatientName.trim())
      return alert("Select patient");
    if (selectedTests.length === 0) return alert("Select at least one test");

    // 🔔 Toast feedback
    toast.success("Lab request has been submitted!");

    // Future: replace with real API call
    // await fetch("/api/lab/requests", { method: "POST", body: JSON.stringify({ patientName: localPatientName, category, tests: selectedTests, remarks }) });

    onSubmit({
      patientName: localPatientName,
      category,
      tests: selectedTests,
      remarks,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">New Lab Request</h3>
          <button className="text-sm text-gray-600" onClick={onCancel}>
            ✕
          </button>
        </div>

        {/* Patient (if not doctor context) */}
        {!isDoctorContext && (
          <div className="mb-3">
            <label className="text-xs text-gray-600">Patient</label>
            <input
              className="ui-input w-full"
              value={localPatientName}
              onChange={(e) => setLocalPatientName(e.target.value)}
              placeholder="Search or enter patient name"
            />
          </div>
        )}

        {/* Category Selector */}
        <div className="mb-3">
          <label className="text-xs text-gray-600">Category</label>
          <select
            className="ui-input w-full"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setShowMore(false);
              setSelectedTests([]);
            }}
          >
            {Object.keys(TEST_LIBRARY).map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Test Checklist */}
        <div className="mb-3">
          <label className="text-xs text-gray-600">Select Tests</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {visibleTests.map((test) => {
              const checked = selectedTests.some((t) => t.name === test);
              return (
                <label
                  key={test}
                  className={`rounded-md px-2 py-1 text-sm cursor-pointer flex items-center gap-2 ${
                    checked
                      ? "bg-emerald-50 border-emerald-400"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTest(test)}
                    className="accent-emerald-600"
                  />
                  <span className="truncate">{test}</span>
                </label>
              );
            })}
          </div>
          {TEST_LIBRARY[category].length > 4 && (
            <button
              className="mt-2 text-xs text-sky-700 hover:underline"
              onClick={() => setShowMore((v) => !v)}
            >
              {showMore ? "Show Less" : "More..."}
            </button>
          )}
        </div>

        {/* Selected Test List */}
        {selectedTests.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-600 mb-2">
              Selected Tests
            </h4>
            <MaterialReactTable
              columns={[
                {
                  accessorKey: "name",
                  header: "Test Name",
                  enableSorting: false,
                  Cell: ({ cell }) => (
                    <span className="text-sm text-gray-800">
                      {cell.getValue<string>()}
                    </span>
                  ),
                },
                {
                  accessorKey: "remarks",
                  header: "Comments",
                  enableSorting: false,
                  Cell: ({ row }) => (
                    <input
                      className="ui-input text-sm w-full"
                      placeholder="Optional comments"
                      value={row.original.remarks || ""}
                      onChange={(e) => updateComment(row.index, e.target.value)}
                    />
                  ),
                },
              ]}
              data={selectedTests}
              enableColumnActions={false}
              enableColumnFilters={false}
              enableSorting={false}
              enablePagination={false}
              enableTopToolbar={false}
              muiTableBodyRowProps={{
                sx: { "& td": { borderBottom: "1px solid #f2f2f2" } },
              }}
              muiTableHeadCellProps={{
                sx: {
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #f2f2f2",
                  fontSize: "0.75rem",
                  color: "#4b5563",
                  fontWeight: 500,
                },
              }}
              muiTableBodyCellProps={{
                sx: { fontSize: "0.8rem", color: "#374151", paddingY: "4px" },
              }}
              muiTablePaperProps={{
                elevation: 0,
                sx: { border: "1px solid #f3f4f6", borderRadius: "8px" },
              }}
            />
          </div>
        )}

        {/* Overall Remarks */}
        <div className="mb-3">
          <label className="text-xs text-gray-600">Additional Remarks</label>
          <textarea
            className="ui-textarea w-full min-h-[60px]"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional overall notes"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button className="btn-neutral px-3 py-1 rounded-md text-sm">Cancel</button>
          <button className="btn-primary px-3 py-1 rounded-md text-sm" onClick={handleSubmit}>Submit Request</button>
          <button className="btn-accent px-3 py-1 rounded-md text-sm" onClick={() => alert("Lab request sent uccessfully!")}>Send</button>
        </div>
      </div>
    </div>
  );
}
