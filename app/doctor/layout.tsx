// app/doctor/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import DoctorSidebar from "@/components/doctor/DoctorSidebar";

/**
 * Hydration-safe collapsible layout:
 * - Aside is always in the DOM (no conditional render) to avoid SSR/CSR structure drift.
 * - We collapse it with CSS width = 0, not by removing it.
 * - Floating "Show menu" button appears when collapsed.
 * - Listens to "aran:sidebar" + storage to sync with pages.
 */
export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const apply = () => {
      try {
        setCollapsed(localStorage.getItem("aran:sidebarCollapsed") === "1");
      } catch {
        setCollapsed(false);
      }
    };
    apply();
    const onStorage = () => apply();
    const onCustom = () => apply();
    window.addEventListener("storage", onStorage);
    window.addEventListener("aran:sidebar", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("aran:sidebar", onCustom as EventListener);
    };
  }, []);

  return (
    <div
      className="min-h-screen grid"
      style={{
        // Keep structure stable; just change column widths
        gridTemplateColumns: `${collapsed ? "0px" : "280px"} minmax(0,1fr)`,
      }}
    >
      <aside
        className={[
          "border-r bg-white overflow-hidden transition-all duration-200",
          collapsed ? "w-0 p-0 border-0 pointer-events-none" : "w-[280px]",
        ].join(" ")}
        aria-hidden={collapsed}
      >
        <DoctorSidebar />
      </aside>

      <main className="min-w-0">{children}</main>

      {/* Expand Sidebar button (visible only when collapsed) */}
      {/* {collapsed && (
        <button
          onClick={() => {
            localStorage.setItem("aran:sidebarCollapsed", "0");
            window.dispatchEvent(new Event("aran:sidebar"));
          }}
          className="fixed left-3 top-20 z-50 inline-flex items-center gap-2 rounded-full border bg-white/90 backdrop-blur px-3 py-1.5 text-sm shadow hover:bg-white"
          title="Show sidebar"
          aria-label="Show sidebar"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
            style={{ color: "var(--secondary)" }}
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          <span>Show menu</span>
        </button>
      )} */}
    </div>
  );
}
