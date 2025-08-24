// app/doctor/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import DoctorSidebar from "@/components/doctor/DoctorSidebar";
import SidebarExpander from "@/components/doctor/SidebarExpander";
import Image from "next/image";

const SIDEBAR_PX = 56; // matches your thin sidebar

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
    <div className="min-h-screen flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md" aria-hidden>
              <Image src="/whitelogopng.svg" alt="ARAN Logo" width={25} height={25} />
            </span>
            <div className="font-semibold">ARAN Healthcare</div>
          </div>
          <div className="inline-flex items-center gap-2 text-md text-gray-800">
            Dr. Vikram Sarabhai
            <Image src="/icons/doctor.png" alt="Doctor Profile" width={25} height={25} />
          </div>
        </div>
      </header>

      {/* Content Grid: Sidebar + Main */}
      <div
        className="flex-1 grid"
        style={{ gridTemplateColumns: `${collapsed ? "0px" : `${SIDEBAR_PX}px`} minmax(0,1fr)` }}
      >
        <aside
          className={[
            "border-r bg-white overflow-hidden transition-all duration-200",
            collapsed ? "w-0 p-0 border-0 pointer-events-none" : "w-14 min-w-14",
          ].join(" ")}
          aria-hidden={collapsed}
        >
          <DoctorSidebar />
        </aside>

        <main
          className={[
            "min-w-0 transition-[padding] duration-200",
            collapsed ? "pl-0" : "pl-3 md:pl-5 lg:pl-6",
          ].join(" ")}
        >
          {children}
        </main>
      </div>

      {/* When collapsed, show a tiny edge-tab to reopen */}
      <SidebarExpander collapsed={collapsed} />
    </div>
  );
}
