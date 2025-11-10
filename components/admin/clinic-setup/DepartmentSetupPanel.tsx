"use client";
import React from "react";

export default function DepartmentSetupPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">
        Department / Specialty Setup
      </h2>
      <p className="text-sm text-gray-600">
        Add or manage medical departments and specialties for each branch.
        You can assign department heads and link them to care types.
      </p>
      <div className="border rounded-md p-4 text-sm text-gray-500 bg-gray-50">
        (This is a placeholder. Future: department list, add/edit modal, etc.)
      </div>
    </div>
  );
}
