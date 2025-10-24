"use client";

import React from "react";

export default function Page() {
  return (
    <div className="ui-card p-6">
      <h2 className="text-lg font-semibold mb-2">Welcome to ARAN Staff Dashboard</h2>
      <p className="text-sm text-gray-600">
        This is your staff dashboard. Use the sidebar to manage appointments,
        queue, patient registration, billing, and reports.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Today’s Appointments</div>
          <div className="text-2xl font-semibold text-[--secondary]">0</div>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Patients in Queue</div>
          <div className="text-2xl font-semibold text-[--secondary]">0</div>
        </div>
        <div className="p-4 rounded-xl border bg-white shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Payments Collected</div>
          <div className="text-2xl font-semibold text-[--secondary]">₹0</div>
        </div>
      </div>
    </div>
  );
}
