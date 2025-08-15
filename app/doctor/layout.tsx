// app/doctor/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import DoctorSidebar from "@/components/doctor/DoctorSidebar";

/**
 * Doctor layout with:
 * - Top app bar
 * - Left sidebar that can be collapsed via localStorage("aran:sidebarCollapsed")
 * - NO auto-collapse here; pages can toggle explicitly via a button.
 */
export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="min-h-screen flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-md"
              style={{
                background: "var(--secondary)",
                color: "var(--on-secondary)",
              }}
              aria-hidden
            >
              A
            </span>
            <div className="font-semibold">ARAN • Doctor</div>
          </div>
          <div className="text-xs text-gray-500">
            {/* space reserved for theme/appearance toggles if you wire them later */}
            v0.1
          </div>
        </div>
      </header>

      {/* Content Grid: Sidebar + Main */}
      <div
        className="flex-1 grid"
        style={{
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

        <main
          className={[
            "min-w-0 transition-[padding] duration-200",
            collapsed ? "pl-0" : "pl-4 md:pl-8 lg:pl-10",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
