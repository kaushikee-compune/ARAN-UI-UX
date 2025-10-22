"use client";
import React, { useState } from "react";
import type { LabRequest } from "@/types/lab";

type Props = {
  request: LabRequest;
  onSubmit: (data: { files: File[]; reportDate: string; remarks: string }) => void;
  onCancel: () => void;
};

export default function LabReportUploadModal({ request, onSubmit, onCancel }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [reportDate, setReportDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selected);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Upload Lab Report</h3>
          <button className="text-sm text-gray-600" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="text-xs text-gray-700 mb-3">
          <div>Patient: <strong>{request.patientName}</strong></div>
          <div>Tests: {request.tests.map((t) => t.name).join(", ")}</div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-gray-600">Choose Files</label>
          <input type="file" multiple onChange={handleFileChange} />
          {files.length > 0 && (
            <ul className="text-xs text-gray-700 mt-1">
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}

          <label className="text-xs text-gray-600 mt-2">Report Date</label>
          <input
            type="date"
            className="ui-input"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />

          <label className="text-xs text-gray-600 mt-2">Remarks</label>
          <textarea
            className="ui-textarea min-h-[60px]"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button className="btn-outline px-3 py-1 text-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="bg-sky-600 text-white px-3 py-1 rounded-md text-sm hover:bg-sky-700"
            onClick={() => onSubmit({ files, reportDate, remarks })}
          >
            Attach Report
          </button>
        </div>
      </div>
    </div>
  );
}
