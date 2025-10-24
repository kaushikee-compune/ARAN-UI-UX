"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const router = useRouter();
  const actions = [
    { label: "New Appointment", path: "/doctor/appointments" },
    { label: "Register Patient", path: "/patient/register" },
    { label: "Start Consultation", path: "/doctor/console/page" },
    { label: "Billing", path: "/doctor/payments" },
    { label: "Reports", path: "/doctor/reports" },
    { label: "Settings", path: "/doctor/settings" },
  ];

  return (
    <div className="ui-card p-4">
      <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {actions.map((a) => (
          <button
            key={a.label}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-gray-700"
            onClick={() => router.push(a.path)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
