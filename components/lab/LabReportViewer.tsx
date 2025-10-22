"use client";
import React from "react";
import type { LabRequest } from "@/types/lab";
import LabStatusBadge from "./LabStatusBadge";

type Props = {
  request: LabRequest;
  onMarkReviewed: () => void;
  onClose: () => void;
};

export default function LabReportViewer({ request, onMarkReviewed, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-lg p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Lab Report Details</h3>
          <button className="text-sm text-gray-600" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="text-xs text-gray-700 mb-3 space-y-1">
          <div>Patient: <strong>{request.patientName}</strong></div>
          <div>Doctor: {request.doctorName}</div>
          <div>Date: {request.requestedDate}</div>
          <div>
            Tests: {request.tests.map((t) => t.name).join(", ")}
          </div>
          <LabStatusBadge status={request.status} />
        </div>

        {request.reports?.length ? (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-600 mt-2">Attached Reports</h4>
            {request.reports.map((f) => (
              <div key={f.url} className="flex items-center justify-between text-sm border p-2 rounded-md">
                <span>{f.name}</span>
                <a href={f.url} target="_blank" className="text-sky-700 text-xs underline">
                  Open
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No files attached.</div>
        )}

        {request.remarks && (
          <div className="mt-3 text-sm">
            <strong>Remarks: </strong>{request.remarks}
          </div>
        )}

        {request.status === "ReportUploaded" && (
          <div className="mt-4">
            <button
              className="bg-emerald-600 text-white px-3 py-1 rounded-md text-sm hover:bg-emerald-700"
              onClick={onMarkReviewed}
            >
              Mark as Reviewed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
