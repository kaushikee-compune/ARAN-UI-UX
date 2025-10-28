"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const router = useRouter();
  const actions = [
    { label: "New Appointment", path: "/appointments" },
    { label: "Register Patient", path: "/patient/registration" },
    { label: "Start Consultation", path: "/doctor/console" },
    { label: "Billing", path: "/billing" },
    { label: "Reports", path: "/doctor/reports" },
    { label: "Settings", path: "/doctor/profile" },
  ];

  return (
    <div className="ui-card p-4">
      <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {actions.map((a) => (
          <button
            key={a.label}
            className="btn-neutral"
            onClick={() => router.push(a.path)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
