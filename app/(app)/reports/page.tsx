"use client";

import React, { useState, useMemo } from "react";

/**
 * ARAN — Universal Report Upload Panel
 * Roles: Doctor, Staff, Admin
 *
 * Features:
 *  • Search Patient (by name/UHID/phone/ABHA)
 *  • Upload report (PDF/JPG/PNG)
 *  • Inline auto-preview at the bottom (last uploaded or selected)
 *  • Download/Delete
 */

type Report = {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  fileUrl: string;
  type: "pdf" | "image" | "other";
};

export default function ReportsPage() {
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedId) || reports[0] || null,
    [reports, selectedId]
  );

  const handleSearch = () => {
    // mock search result
    setSelectedPatient({
      name: "Ananya Sharma",
      gender: "Female",
      age: 34,
      uhid: "UHID1001",
      abhaAddress: "ananya@sbx",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const type =
      ext === "pdf"
        ? "pdf"
        : ["jpg", "jpeg", "png"].includes(ext || "")
        ? "image"
        : "other";

    const newReport: Report = {
      id: Math.random().toString(36).substring(2, 9),
      fileName: file.name,
      uploadedBy: "Current User",
      uploadedAt: new Date().toISOString().split("T")[0],
      fileUrl: URL.createObjectURL(file),
      type,
    };
    setReports((r) => [newReport, ...r]);
    setSelectedId(newReport.id);
  };

  const handleDelete = (id: string) => {
    setReports((r) => r.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Report Upload</h1>
        <div className="text-xs text-gray-500">Accessible by all roles</div>
      </div>

      {/* Search Box */}
      <div className="ui-card p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search patient (Name / UHID / Phone / ABHA Address)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ui-input flex-1"
          />
          <button onClick={handleSearch} className="btn-outline px-4">
            Search
          </button>
        </div>

        {selectedPatient && (
          <div className="p-3 bg-gray-50 rounded-md text-sm flex items-center justify-between">
            <div>
              <div className="font-medium">{selectedPatient.name}</div>
              <div className="text-xs text-gray-600">
                {selectedPatient.gender} • {selectedPatient.age} yrs • UHID:{" "}
                {selectedPatient.uhid}
              </div>
              <div className="text-xs text-gray-600">
                ABHA: {selectedPatient.abhaAddress}
              </div>
            </div>
            <button
              onClick={() => setSelectedPatient(null)}
              className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Upload */}
      {selectedPatient && (
        <div className="ui-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Upload New Report</h2>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="text-xs"
            />
          </div>
          <div className="text-xs text-gray-500">
            Allowed formats: PDF, JPG, PNG
          </div>
        </div>
      )}

      {/* Table of Uploaded Reports */}
      {reports.length > 0 && (
        <div className="ui-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Uploaded Reports</h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left border">File Name</th>
                <th className="px-2 py-1 text-left border">Uploaded By</th>
                <th className="px-2 py-1 text-left border">Date</th>
                <th className="px-2 py-1 text-center border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t cursor-pointer ${
                    selectedId === r.id ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <td className="px-2 py-1 truncate">{r.fileName}</td>
                  <td className="px-2 py-1">{r.uploadedBy}</td>
                  <td className="px-2 py-1">{r.uploadedAt}</td>
                  <td className="px-2 py-1 text-center space-x-3">
                    <a
                      href={r.fileUrl}
                      download={r.fileName}
                      className="text-[--secondary] hover:underline"
                    >
                      Download
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(r.id);
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline Preview Section */}
      {selectedReport && (
        <div className="ui-card p-4 space-y-2">
          <h2 className="text-sm font-semibold">Preview</h2>
          <div className="border rounded-md overflow-hidden bg-gray-50 h-[600px] flex items-center justify-center">
            {selectedReport.type === "pdf" ? (
              <iframe
                src={selectedReport.fileUrl}
                title="PDF Preview"
                className="w-full h-full"
              />
            ) : selectedReport.type === "image" ? (
              <img
                src={selectedReport.fileUrl}
                alt={selectedReport.fileName}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-500 text-sm">
                No inline preview available for this file type.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
