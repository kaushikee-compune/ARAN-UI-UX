"use client";
import React from "react";

export default function CaretypeSetupPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Care Type Setup</h2>
      <p className="text-sm text-gray-600">
        Define and manage care types such as OPD, IPD, Daycare, Teleconsultation,
        and Home Visit.
      </p>
      <div className="border rounded-md p-4 text-sm text-gray-500 bg-gray-50">
        (This is a placeholder. Future: care type list, add/edit modal, etc.)
      </div>
    </div>
  );
}
