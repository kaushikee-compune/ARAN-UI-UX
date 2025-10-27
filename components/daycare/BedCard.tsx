"use client";

import React from "react";
import type { Bed } from "./types";

interface BedCardProps {
  bed: Bed;
  onClick: () => void;
}

export default function BedCard({ bed, onClick }: BedCardProps) {
  const color =
    bed.status === "vacant"
      ? "bg-gray-50 border-dashed text-gray-500"
      : bed.status === "occupied"
      ? "bg-emerald-50 border-emerald-400"
      : "bg-yellow-50 border-yellow-400";

  return (
    <div
      className={`border rounded-xl p-4 cursor-pointer transition hover:shadow-sm ${color}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{bed.label}</h3>
        <span
          className={`text-[11px] font-medium ${
            bed.status === "vacant"
              ? "text-gray-400"
              : bed.status === "occupied"
              ? "text-emerald-700"
              : "text-amber-700"
          }`}
        >
          {bed.status.toUpperCase()}
        </span>
      </div>

      {bed.patient ? (
        <div className="text-sm text-gray-700">
          <div className="font-medium">{bed.patient.name}</div>
          <div className="text-xs text-gray-500">
            {bed.patient.age} • {bed.patient.gender}
          </div>
          <div className="text-xs mt-1">
            Doctor: {bed.patient.doctor || "—"}
          </div>
        </div>
      ) : (
        <div className="text-xs italic text-gray-400 mt-3">
          No patient assigned
        </div>
      )}
    </div>
  );
}
