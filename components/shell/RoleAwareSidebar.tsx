"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

export type Role = "doctor" | "staff" | "admin";

/* -------------------------------------------------------
   1) Read role on the client from 'aran.session' cookie
   ------------------------------------------------------- */
function base64UrlDecode(str: string): string {
  try {
    const norm = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
    // atob is available in the browser
    const bin = atob(norm);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function readClientRoleFromCookie(): Role {
  // cookie format: aran.session=<base64url(JSON)>
  const cookie = typeof document !== "undefined" ? document.cookie : "";
  const part = cookie.split("; ").find((c) => c.startsWith("aran.session="));
  if (!part) return "doctor";
  const raw = part.split("=")[1];
  if (!raw) return "doctor";

  try {
    const json = base64UrlDecode(raw);
    const obj = JSON.parse(json);
    const role = obj?.role as Role | undefined;
    if (role === "doctor" || role === "staff" || role === "admin") return role;
    return "doctor";
  } catch {
    return "doctor";
  }
}

/* -------------------------------------------------------
   2) Role → Menu mapping (URLs do NOT include route group)
   ------------------------------------------------------- */
type Item = { href: string; label: string };

const MENU: Record<Role, Item[]> = {
  doctor: [
    { href: "/doctor", label: "Dashboard" },
    { href: "/doctor/console", label: "Console" },
    { href: "/doctor/appointments", label: "Appointments" },
    { href: "/patient/patientlist", label: "Patients" }, // shared module
    { href: "/doctor/profile", label: "Profile" },
  ],
  staff: [
    { href: "/doctor/appointments", label: "Appointments" },
    { href: "/patient/patientlist", label: "Patients" },
    { href: "/billing", label: "Billing" },
  ],
  admin: [
    { href: "/admin/overview", label: "Overview" },
    { href: "/patient/patientlist", label: "Patients" },
    { href: "/settings", label: "Settings" },
  ],
};

/* -------------------------------------------------------
   3) Component
   ------------------------------------------------------- */
export default function RoleAwareSidebar(props: { role?: Role }) {
  const pathname = usePathname();

  // Priority: explicit prop → cookie-derived role → fallback
  const derivedRole = React.useMemo<Role>(() => {
    if (props.role) return props.role;
    return readClientRoleFromCookie();
  }, [props.role]);

  const items = MENU[derivedRole] ?? MENU.doctor;

  return (
    <div className="h-full p-3">
      {/* Header (role badge) */}
      <div className="mb-3">
        <div className="text-sm font-semibold">ARAN • {derivedRole.toUpperCase()}</div>
        <div className="text-[11px] text-gray-500">Role-based access</div>
      </div>

      {/* Nav */}
      <nav className="space-y-1">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/" && pathname.startsWith(it.href + "/"));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "block px-3 py-2 rounded-lg text-sm transition",
                active ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-800",
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
