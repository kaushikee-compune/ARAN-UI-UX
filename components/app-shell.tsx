// components/app-shell.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { SVGProps, ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppearancePanel from "./appearance-panel";
import type { PropsWithChildren } from "react";
import { logout } from "@/lib/auth/logout";

/** Icon type */
type IconType = (props: SVGProps<SVGSVGElement>) => ReactElement;

type SubLink = { label: string; href: string };
type NavSection = {
  label: string;
  href?: string; // optional landing route
  Icon: IconType;
  children?: SubLink[];
};

/** -------- NAV DATA: sections + submenu (from your sheet) -------- */
const NAV_SECTIONS: NavSection[] = [
  // {
  //   label: "Appointment & Queue",
  //   href: "/appointments-queue",
  //   Icon: CalendarQueueIcon,
  //   children: [
  //     { label: "Appointment List & Quick Appointment", href: "/appointments-queue/list" },
  //     { label: "OPD Queue Management", href: "/appointments-queue/opd-queue" },
  //   ],
  // },
  {
    label: "Clinic Setup",
    href: "/clinic-setup",
    Icon: ClinicSetupIcon,
    children: [
      { label: "Branch Management", href: "/clinic-setup/branches" },
      { label: "Department Management", href: "/clinic-setup/departments" },
      { label: "Caretype Management", href: "/clinic-setup/caretypes" },
      { label: "Documents & Forms", href: "/clinic-setup/documents" },
    ],
  },

  {
    label: "People Management",
    href: "/people",
    Icon: UsersCogIcon,
    children: [
      { label: "Doctors & Staff", href: "/people/staff" },
      { label: "Schedule Management", href: "/people/schedule" },
      { label: "Role & Access", href: "/people/roles" },
    ],
  },

  // {
  //   label: "Patient Management",
  //   href: "/patients",
  //   Icon: HandsHeartPlusIcon, // updated per your request
  //   children: [
  //     { label: "Patient List / Search & Register", href: "/patients" },
  //     { label: "Patient Health Records", href: "/patients/records" },
  //   ],
  // },

  // {
  //   label: "Consultations",
  //   href: "/consultations",
  //   Icon: StethoscopeIcon,
  //   children: [
  //     { label: "Today’s Completed — View", href: "/consultations/today" },
  //     {
  //       label: "Upload Reports (Completed)",
  //       href: "/consultations/upload-reports",
  //     },
  //     {
  //       label: "Payment Against Consultation",
  //       href: "/consultations/payments",
  //     },
  //   ],
  // },

  // {
  //   label: "ABHA Center",
  //   href: "/abha-center",
  //   Icon: AbhaCenterIcon, // updated per your request
  //   children: [
  //     { label: "ABHA Creation", href: "/abha/create" },
  //     { label: "ABHA Verification", href: "/abha/verify" },
  //     { label: "ABHA SCAN", href: "/abha/scan" },
  //     { label: "Consent Management", href: "/abha/consent" },
  //   ],
  // },

  {
    label: "Payments & Billing",
    href: "/billing",
    Icon: BillingIcon,
    children: [
      { label: "Invoice Generation", href: "/billing/invoices" },
      { label: "Payment History", href: "/billing/history" },
    ],
  },

  {
    label: "Reports & Analytics",
    href: "/reports-analytics",
    Icon: AnalyticsIcon,
    children: [{ label: "TBD", href: "/reports-analytics" }],
  },
];

/** -------- Sidebar link & collapsible section -------- */
function SectionHeader({
  section,
  active,
  expanded,
  toggle,
}: {
  section: NavSection;
  active: boolean;
  expanded: boolean;
  toggle: () => void;
}) {
  const { Icon } = section;
  const hasChildren = (section.children?.length || 0) > 0;

  // If there are submenu items, make the whole row a button (toggle only)
  if (hasChildren) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={[
          "w-full group flex items-center justify-between rounded-xl px-3 py-2 text-left",
          active ? "bg-gray-50" : "hover:bg-gray-50",
        ].join(" ")}
        aria-expanded={expanded}
        aria-controls={`sec-${section.label
          .replace(/\s+/g, "-")
          .toLowerCase()}`}
      >
        <span className="flex items-center gap-3 min-w-0 font-medium text-sm text-gray-800">
          <Icon
            className="w-5 h-5 shrink-0 text-[--secondary]"
            aria-hidden="true"
          />
          <span className="truncate">{section.label}</span>
        </span>
        {/* Plain chevron — no border/box */}
        <ChevronDownIcon
          className={[
            "w-3 h-3 text-gray-600 transition-transform",
            expanded ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
    );
  }

  // Fallback: no children -> behave like a normal link (rare in your current data)
  return (
    <Link
      href={section.href || "/"}
      className={[
        "flex items-center justify-between rounded-xl px-3 py-2",
        active ? "bg-gray-50" : "hover:bg-gray-50",
      ].join(" ")}
    >
      <span className="flex items-center gap-3 min-w-0 font-medium text-sm text-gray-800">
        <Icon
          className="w-5 h-5 shrink-0 text-[--secondary]"
          aria-hidden="true"
        />
        <span className="truncate">{section.label}</span>
      </span>
    </Link>
  );
}

function SubLinkItem({ link, active }: { link: SubLink; active: boolean }) {
  return (
    <Link
      href={link.href}
      className={[
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
        active
          ? "bg-[--tertiary] text-[--on-tertiary]"
          : "hover:bg-gray-100 text-gray-700",
      ].join(" ")}
    >
      <DotIcon className="w-2.5 h-2.5" />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}
type AppShellProps = PropsWithChildren<{}>;
export default function AppShell({ children }: AppShellProps): ReactElement {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Expanded state per section label
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Auto-expand the section that contains the active path
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const s of NAV_SECTIONS) {
      const matchParent = s.href && pathname.startsWith(s.href);
      const matchChild = (s.children || []).some((c) =>
        pathname.startsWith(c.href)
      );
      if (matchParent || matchChild) next[s.label] = true;
    }
    setOpen((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar overlay (mobile) */}
      <div
        className={[
          "fixed inset-0 z-40 lg:hidden",
          sidebarOpen ? "block" : "hidden",
        ].join(" ")}
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Sidebar */}
      <aside
        className={[
          "fixed z-50 inset-y-0 left-0 w-80 bg-white border-r border-gray-200 px-4 py-6 overflow-y-auto transition-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0",
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Brand */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl"
              style={{ background: "var(--secondary)" }}
            />
            <span className="font-semibold text-lg tracking-tight">
              ARAN HMIS
            </span>
          </Link>
          <button
            className="lg:hidden inline-flex items-center justify-center rounded-lg border px-2 py-1 text-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 sidebar-nav">
          {NAV_SECTIONS.map((section) => {
            const expanded = !!open[section.label];
            const anyChildActive = (section.children || []).some((c) =>
              pathname.startsWith(c.href)
            );
            const parentActive = section.href
              ? pathname.startsWith(section.href)
              : anyChildActive;

            return (
              <div key={section.label} className="rounded-xl">
                <SectionHeader
                  section={section}
                  active={parentActive}
                  expanded={expanded}
                  toggle={() =>
                    setOpen((o) => ({
                      ...o,
                      [section.label]: !o[section.label],
                    }))
                  }
                />
                {expanded && section.children && (
                  <div className="pl-8 pr-2 pt-1 pb-2 space-y-1">
                    {section.children.map((link) => (
                      <SubLinkItem
                        key={link.href}
                        link={link}
                        active={pathname.startsWith(link.href)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="mt-8 border-t pt-4 text-xs text-gray-500">
          <div>
            Environment: <span className="font-medium text-gray-700">Dev</span>
          </div>
          <div>
            Version: <span className="font-medium text-gray-700">v0.1</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="h-16 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="lg:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm"
                onClick={() => setSidebarOpen((s) => !s)}
                aria-label="Open sidebar"
              >
                ☰
              </button>
              <h1 className="hidden sm:block text-lg font-semibold tracking-tight">
                Clinic Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3 min-w-0">
              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search patients, visits, documents…"
                    className="ui-input w-96"
                    aria-label="Search"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-gray-500">
                    /
                  </span>
                </div>
              </div>

              {/* Appearance panel (Style + Color) */}
              <AppearancePanel />

              {/* User menu (placeholder) */}
              <div className="relative">
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 btn-outline"
                >
                  <span
                    className="inline-block w-6 h-6 rounded-full"
                    style={{ background: "var(--tertiary)" }}
                  />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}

/* ================= Icons ================= */
// replace the existing ChevronDownIcon at the bottom with this
function ChevronDownIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function DotIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg viewBox="0 0 8 8" fill="currentColor" {...props}>
      <circle cx="4" cy="4" r="3" />
    </svg>
  );
}
function CalendarQueueIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 2v4M16 2v4M3 9h18" />
      <circle cx="8" cy="13" r="1.2" />
      <circle cx="12" cy="13" r="1.2" />
      <circle cx="16" cy="13" r="1.2" />
    </svg>
  );
}
function HandsHeartPlusIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <path d="M12 9.2c-1.1-2.1-4.2-2.2-5.4-.3-1 1.6-.6 3.7 1 4.9l4.4 3.2 4.4-3.2c1.6-1.2 2-3.3 1-4.9-1.2-1.9-4.3-1.8-5.4.3Z" />
      <path d="M12 7.1v2.2M10.9 8.2h2.2" strokeLinecap="round" />
      <path
        d="M2.8 14.8c1.8-.3 3.2.1 4.6 1.5 .8.8 2.1 1.5 3.7 1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.3 13.5c-.8.2-1.6.7-2.2 1.4-.5.6-.9 1.2-1.1 1.8"
        strokeLinecap="round"
      />
      <path
        d="M21.2 14.8c-1.8-.3-3.2.1-4.6 1.5-.8.8-2.1 1.5-3.7 1.8"
        strokeLinecap="round"
      />
      <path
        d="M16.7 13.5c.8.2 1.6.7 2.2 1.4.5.6.9 1.2 1.1 1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function StethoscopeIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <path d="M6 3v4a4 4 0 1 0 8 0V3" />
      <path d="M6 7a4 4 0 0 0 8 0" />
      <path d="M14 14a4 4 0 1 1-8 0V8" />
      <circle cx="18" cy="12" r="2" />
      <path d="M18 14v2a4 4 0 0 1-4 4h-1" />
    </svg>
  );
}
function UsersCogIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 18.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="7" r="2.2" />
      <path d="M16 14.5h2l.5 1.5 1.5.5-.5 1.5.5 1.5-1.5.5-.5 1.5h-2l-.5-1.5-1.5-.5.5-1.5-.5-1.5 1.5-.5z" />
    </svg>
  );
}
function ClinicSetupIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <path d="M4 10l8-6 8 6v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z" />
      <path d="M9 21v-6h6v6" />
      <path d="M14.5 7.5l2 2M7.5 9.5l2-2" />
    </svg>
  );
}
function AbhaCenterIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="8.2" cy="11" r="2.4" />
      <path d="M5.8 15.6a4.4 4.4 0 0 1 4.8 0" />
      <rect x="13.2" y="9" width="2.4" height="2.4" rx=".3" />
      <rect x="16.8" y="9" width="2.4" height="2.4" rx=".3" />
      <rect x="13.2" y="12.6" width="2.4" height="2.4" rx=".3" />
      <rect x="16.8" y="12.6" width="2.4" height="2.4" rx=".3" />
      <path d="M14.2 7.2h3.6" strokeLinecap="round" />
    </svg>
  );
}
function BillingIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18" />
      <circle cx="8" cy="13.5" r="1.2" />
      <path d="M12.5 13.5h5" />
    </svg>
  );
}
function AnalyticsIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      {...props}
    >
      <path d="M4 20V6M10 20V10M16 20V4M20 20H3" />
      <path d="M4 12l6-2 6-4 4-2" />
    </svg>
  );
}
