"use client";
import React from "react";
import type { LabStatus } from "@/types/lab";

export default function LabStatusBadge({ status }: { status: LabStatus }) {
  const map = {
    Requested: { bg: "bg-amber-100", text: "text-amber-800", label: "Requested" },
    ReportUploaded: { bg: "bg-sky-100", text: "text-sky-800", label: "Report Uploaded" },
    Reviewed: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Reviewed" },
  }[status];

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map.bg} ${map.text}`}
    >
      {map.label}
    </span>
  );
}
