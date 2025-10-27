"use client";

import React, { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onUpload?: (data: FormData) => void;
  patient?: { name: string; uhid: string }; // ✅ new optional prop
};

const CATEGORIES = [
  "Prescription",
  "OpConsult",
  "DischargeSummary",
  "HealthRecord",
  "WellnessRecord",
  "Immunization",
  "Invoice",
  "Other",
];

export default function UploadModal({ open, onClose, onUpload, patient }: Props) {
  const [doctor, setDoctor] = useState("");
  const [consultationNum, setConsultationNum] = useState("");
  const [consultationDate, setConsultationDate] = useState("");
  const [category, setCategory] = useState("");
  const [docName, setDocName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a file to upload.");
    const data = new FormData();
    data.append("doctor", doctor);
    data.append("consultationNum", consultationNum);
    data.append("consultationDate", consultationDate);
    data.append("category", category);
    data.append("docName", docName);
    data.append("file", file);
    if (patient) {
      data.append("patientName", patient.name);
      data.append("patientUHID", patient.uhid);
    }
    onUpload?.(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="ui-card w-[min(92vw,480px)] p-0 relative overflow-hidden">
        {/* ✅ Header with patient info */}
        <div className="bg-gray-50 px-5 py-3 border-b flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-800">
              {patient?.name || "Patient Name"}
            </div>
            <div className="text-xs text-gray-500">
              UHID: {patient?.uhid || "—"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 grid gap-3 text-sm">
          <div className="grid gap-1">
            <label className="text-xs text-gray-600">Doctor</label>
            <input
              className="ui-input"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              placeholder="Select or type doctor name"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-gray-600">Consultation No.</label>
              <input
                className="ui-input"
                value={consultationNum}
                onChange={(e) => setConsultationNum(e.target.value)}
                placeholder="e.g., CN-1023"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-gray-600">Consultation Date</label>
              <input
                type="date"
                className="ui-input"
                value={consultationDate}
                onChange={(e) => setConsultationDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-gray-600">Document Category</label>
              <select
                className="ui-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-gray-600">Document Name</label>
              <input
                className="ui-input"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="X-Ray, MRI, Blood Report..."
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-xs text-gray-600">Select File</label>
            <input
              type="file"
              className="ui-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm rounded-md border bg-[--secondary] text-[--on-secondary] hover:opacity-90"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
