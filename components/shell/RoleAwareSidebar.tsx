"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  LayoutDashboard,
  MonitorCog,
  CalendarDays,
  Users,
  UserCircle,
  CreditCard,
  Settings,
} from "lucide-react";

export type Role = "doctor" | "staff" | "admin";

/* ---------- role from cookie (unchanged) ---------- */
function base64UrlDecode(str: string): string {
  try {
    const norm =
      str.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((str.length + 3) % 4);
    const bin = atob(norm);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}
function readClientRoleFromCookie(): Role {
  const cookie = typeof document !== "undefined" ? document.cookie : "";
  const part = cookie.split("; ").find((c) => c.startsWith("aran.session="));
  if (!part) return "doctor";
  const raw = part.split("=")[1];
  if (!raw) return "doctor";
  try {
    const obj = JSON.parse(base64UrlDecode(raw));
    const role = obj?.role as Role | undefined;
    return role === "doctor" || role === "staff" || role === "admin"
      ? role
      : "doctor";
  } catch {
    return "doctor";
  }
}

/* ---------- Menu config with icons + colors ---------- */
type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const MENU: Record<Role, Item[]> = {
  doctor: [
    {
      href: "/doctor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "text-sky-600",
    },
    {
      href: "/doctor/console",
      label: "Console",
      icon: MonitorCog,
      color: "text-emerald-600",
    },
    {
      href: "/appointments",
      label: "Appointments",
      icon: CalendarDays,
      color: "text-purple-600",
    },
    {
      href: "/patient/patientlist",
      label: "Patients",
      icon: Users,
      color: "text-pink-600",
    },
    {
      href: "/doctor/profile",
      label: "Profile",
      icon: UserCircle,
      color: "text-gray-600",
    },
  ],
  staff: [
    {
      href: "/doctor/appointments",
      label: "Appointments",
      icon: CalendarDays,
      color: "text-purple-600",
    },
    {
      href: "/patient/patientlist",
      label: "Patients",
      icon: Users,
      color: "text-pink-600",
    },
    {
      href: "/billing",
      label: "Billing",
      icon: CreditCard,
      color: "text-amber-600",
    },
  ],
  admin: [
    {
      href: "/admin/overview",
      label: "Overview",
      icon: LayoutDashboard,
      color: "text-sky-600",
    },
    {
      href: "/patient/patientlist",
      label: "Patients",
      icon: Users,
      color: "text-pink-600",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      color: "text-gray-600",
    },
  ],
};

/* ---------- Component ---------- */
export default function RoleAwareSidebar(props: { role?: Role }) {
  const pathname = usePathname();
  const derivedRole = React.useMemo<Role>(
    () => props.role ?? readClientRoleFromCookie(),
    [props.role]
  );
  const items = MENU[derivedRole] ?? MENU.doctor;

  return (
    <div className="h-full p-3 flex flex-col items-center">
      {/* Header */}
      <div className="mb-4 text-center">
        <div className="text-[12px] font-semibold leading-tight">
          ARAN • {derivedRole.toUpperCase()}
        </div>
        <div className="text-[11px] text-gray-500">Role-based access</div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-6">
        {" "}
        {/* gap = distance between menu items */}
        {items.map(({ href, label, icon: Icon, color }) => {
          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-col items-center gap-1 rounded-md px-2 py-3 text-[13px] leading-tight transition",
                active
                  ? "text-white" // keep text white
                  : "hover:bg-gray-100 text-gray-800",
              ].join(" ")}
              style={active ? { backgroundColor: "#02066b" } : {}}
            >
              {/* Bigger icon */}
              <Icon className={`h-6 w-6 ${active ? "text-white" : color}`} />
              <span className="truncate text-xs">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto text-[11px] text-gray-400">
        © {new Date().getFullYear()} ARAN
      </div>
    </div>
  );
}
