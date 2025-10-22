"use client";

import React, { useState } from "react";
import type { LabRequest } from "@/types/lab";
import LabRequestList from "@/components/lab/LabRequestList";
import LabRequestForm from "@/components/lab/LabRequestForm";
import LabReportUploadModal from "@/components/lab/LabReportUploadModal";
import LabReportViewer from "@/components/lab/LabReportViewer";

/**
 * ARAN • Doctor → Lab Requests
 * - Lists all lab requests (Material React Table)
 * - Allows staff to create new requests, upload reports, and view/mark reviewed
 * - Works fully with mock data for now (API integration can replace later)
 */

export default function LabPage() {
  /* ---------------------- Mock State ---------------------- */
  const [requests, setRequests] = useState<LabRequest[]>([
    {
      id: "1",
      patientName: "Ms Shampa Goswami",
      doctorName: "Dr A. Banerjee",
      requestedDate: "2025-10-22",
      tests: [{ name: "CBC" }, { name: "LFT" }],
      status: "Requested",
    },
    {
      id: "2",
      patientName: "Mr Ankur Singh",
      doctorName: "Dr K. Rao",
      requestedDate: "2025-10-20",
      tests: [{ name: "Lipid Profile" }],
      status: "ReportUploaded",
      remarks: "Report received via email",
      reports: [
        {
          name: "LipidProfile_20Oct.pdf",
          url: "#",
          type: "pdf",
        },
      ],
    },
  ]);

  /* ---------------------- Modal States ---------------------- */
  const [formOpen, setFormOpen] = useState(false);
  const [uploadReq, setUploadReq] = useState<LabRequest | null>(null);
  const [viewReq, setViewReq] = useState<LabRequest | null>(null);

  /* ---------------------- Handlers ---------------------- */

  const handleCreate = (data: {
    patientName: string;
    tests: { name: string; remarks?: string }[];
    remarks?: string;
    urgency: string;
  }) => {
    const newRequest: LabRequest = {
      id: Date.now().toString(),
      patientName: data.patientName,
      doctorName: "Dr A. Banerjee",
      requestedDate: new Date().toISOString().slice(0, 10),
      tests: data.tests,
      status: "Requested",
      remarks: data.remarks,
    };
    setRequests((prev) => [...prev, newRequest]);
    setFormOpen(false);
  };

  const handleAttachReport = ({
    files,
    reportDate,
    remarks,
  }: {
    files: File[];
    reportDate: string;
    remarks: string;
  }) => {
    if (!uploadReq) return;
    const updated: LabRequest[] = requests.map((r) =>
      r.id === uploadReq.id
        ? {
            ...r,
            reports: files.map((f) => ({
              name: f.name,
              url: URL.createObjectURL(f),
              type: f.type.includes("pdf") ? "pdf" : "image",
            })),
            remarks,
            status: "ReportUploaded" as const,
          }
        : r
    );
    setRequests(updated);

    setUploadReq(null);
  };

  const handleMarkReviewed = (id: string) => {
    const updated: LabRequest[] = requests.map((r) =>
      r.id === id ? { ...r, status: "Reviewed" as const } : r
    );
    setRequests(updated);
    setViewReq(null);
  };

  /* ---------------------- Render ---------------------- */
  return (
    <div className="space-y-4">
      <div className="ui-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-semibold">Lab Requests</h1>
            <p className="text-xs text-gray-500">
              Create, upload, and review lab requests and reports.
            </p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-emerald-700"
          >
            + New Request
          </button>
        </div>

        <LabRequestList
          data={requests}
          onUpload={(r) => setUploadReq(r)}
          onView={(r) => setViewReq(r)}
          onCreate={() => setFormOpen(true)}
        />
      </div>

      {/* ---------- New Request Panel ---------- */}
      {formOpen && (
        <LabRequestForm
          onSubmit={(d) => {
            const newReq: LabRequest = {
              id: Date.now().toString(),
              patientName: d.patientName,
              doctorName: "Dr A. Banerjee",
              requestedDate: new Date().toISOString().slice(0, 10),
              tests: d.tests,
              status: "Requested",
              remarks: d.remarks,
            };
            setRequests((r) => [...r, newReq]);
            setFormOpen(false);
          }}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {/* ---------- Upload Report Modal ---------- */}
      {uploadReq && (
        <LabReportUploadModal
          request={uploadReq}
          onSubmit={handleAttachReport}
          onCancel={() => setUploadReq(null)}
        />
      )}

      {/* ---------- Report Viewer ---------- */}
      {viewReq && (
        <LabReportViewer
          request={viewReq}
          onMarkReviewed={() => handleMarkReviewed(viewReq.id)}
          onClose={() => setViewReq(null)}
        />
      )}
    </div>
  );
}
