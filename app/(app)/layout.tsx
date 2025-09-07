// app/(app)/layout.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import RoleAwareSidebar from "@/components/shell/RoleAwareSidebar";
import { logout } from "@/lib/auth/logout"; // ✅ add this

const SIDEBAR_KEY = "aran:sidebarCollapsed";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {}
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-900 text-white">
              A
            </span>
            <div className="font-semibold">ARAN</div>
          </div>

          {/* ✅ Logout button (top-right) */}
          <button
            onClick={logout}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Shell: Sidebar + Main */}
      <div
        className="flex-1 grid"
        style={{ gridTemplateColumns: `${collapsed ? "0px" : "280px"} minmax(0,1fr)` }}
      >
        <aside
          className={[
            "border-r bg-white overflow-hidden transition-all duration-200",
            collapsed ? "w-0 p-0 border-0 pointer-events-none" : "w-[280px]",
          ].join(" ")}
        >
          <RoleAwareSidebar />
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
