"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/doctor", label: "Dashboard" },
  { href: "/doctor/consultations", label: "Consultations" }, // Wellness, OPConsult, Prescription, Immunization, Lab
  { href: "/doctor/appointments", label: "Appointments" },   // give appointment
  { href: "/doctor/queue", label: "OPD Queue" },             // see OPD queue
  { href: "/doctor/payments", label: "Payments" },           // take payment
  { href: "/doctor/patients", label: "Patients" },
  { href: "/doctor/settings", label: "Settings" },
];

export default function DoctorSidebar() {
  const pathname = usePathname();

  return (
    <div className="ui-card p-3">
      <div className="mb-3">
        <div className="text-sm font-semibold">ARAN • Doctor</div>
        <div className="text-[11px] text-gray-500">Role-based access</div>
      </div>

      <nav className="space-y-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "block px-3 py-2 rounded-lg text-sm transition",
                active
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-100 text-gray-800",
              ].join(" ")}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 text-xs text-gray-400">© {new Date().getFullYear()} ARAN</div>
    </div>
  );
}
