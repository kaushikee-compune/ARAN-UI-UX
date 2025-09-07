// components/doctor/DoctorSidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  NotebookPen,
  FlaskConical,
  ListChecks,
  Users,
  ChartLine,
  CreditCard,
  Settings,
  UserCog,
} from "lucide-react";

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string; // tailwind text-* color for the icon
};

const NAV: Item[] = [
  { label: "Dashboard",           href: "/doctor",               icon: LayoutDashboard, color: "text-indigo-600" },
  { label: "Consultation",        href: "/doctor/console",       icon: NotebookPen,     color: "text-green-600" },
  { label: "Appointments",        href: "/doctor/appointments",  icon: CalendarDays,    color: "text-emerald-600" },
  { label: "Lab Reports",         href: "/doctor/labs",          icon: FlaskConical,    color: "text-violet-600" },
  { label: "Queues",              href: "/doctor/queues",        icon: ListChecks,      color: "text-amber-600" },
  { label: "Patients",            href: "/patient/patientlist",      icon: Users,           color: "text-sky-600" },
  { label: "Analytics",           href: "/doctor/analytics",     icon: ChartLine,       color: "text-rose-600" },
  { label: "Payments",            href: "/doctor/payments",      icon: CreditCard,      color: "text-teal-600" },
  { label: "Settings",            href: "/doctor/settings",      icon: Settings,        color: "text-gray-700" },
  { label: "Profile Management",  href: "/doctor/profile",       icon: UserCog,         color: "text-fuchsia-600" },
];

export default function DoctorSidebar() {
  const pathname = usePathname() ?? "";
  const [hidden, setHidden] = React.useState(false);

  // Honor your existing collapse flag
  React.useEffect(() => {
    const apply = () => setHidden(localStorage.getItem("aran:sidebarCollapsed") === "1");
    apply();
    const on = () => apply();
    window.addEventListener("aran:sidebar", on);
    return () => window.removeEventListener("aran:sidebar", on);
  }, []);

  if (hidden) return null;

  return (
    <aside className="sticky top-16 z-30 w-14 min-w-14 select-none">
      <nav className="flex flex-col items-center py-3 gap-3 bg-white border-r rounded-r-xl shadow-sm h-[calc(100vh-4rem)]">
        {NAV.map((item) => (
          <NavIcon
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>
    </aside>
  );
}

function NavIcon({
  label,
  href,
  icon: Icon,
  color,
  active,
}: Item & { active: boolean }) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={[
        "group relative grid place-items-center",
        "w-10 h-10 rounded-xl border-1 bg-white transition",
        active ? "border-gray-300" : "border-gray-200 hover:border-gray-300",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-gray-900",
      ].join(" ")}
    >
      <Icon
        className={["w-5 h-5", color, active ? "scale-110" : "opacity-90 group-hover:opacity-100"].join(" ")}
        strokeWidth={2}
      />
      {/* slim active indicator */}
      <span
        className={[
          "pointer-events-none absolute -left-[6px] w-1 rounded-full",
          active ? "h-6 bg-gray-900" : "h-0",
          "transition-all",
        ].join(" ")}
      />
    </Link>
  );
}
