"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import RoleAwareSidebar from "@/components/shell/RoleAwareSidebar";
import { logout } from "@/lib/auth/logout";

const SIDEBAR_KEY = "aran:sidebarCollapsed";
const HEADER_HEIGHT = 56; // h-14

function readCollapsedFromStorage(): boolean {
  if (typeof window === "undefined") return false;           // SSR safety
  try {
    const raw = window.localStorage.getItem(SIDEBAR_KEY);
    return raw === "1";                                      // only "1" means collapsed
  } catch {
    return false;
  }
}

export default function AppShellLayout({ children }: { children: ReactNode }) {
  // ✅ initialize from storage synchronously to avoid “random collapse” on refresh
  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsedFromStorage());

  // (Optional) allow ?sidebar=open|closed to force a state (useful while testing)
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("sidebar");
      if (p === "open") setCollapsed(false);
      if (p === "closed") setCollapsed(true);
    } catch {}
  }, []);

  // keep other tabs/windows in sync (optional but nice)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === SIDEBAR_KEY) setCollapsed(e.newValue === "1");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // helper to toggle & persist
  const toggleSidebar = useMemo(
    () => () => {
      setCollapsed(prev => {
        const next = !prev;
        try { window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0"); } catch {}
        return next;
      });
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 bg-white shadow-md h-14">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle (optional small chevron) */}
          <button
            onClick={toggleSidebar}
            className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
            title={collapsed ? "Open sidebar" : "Close sidebar"}
            aria-label="Toggle sidebar"
          >
            {collapsed ? "›" : "‹"}
          </button>

          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-900 text-white">A</span>
          <div className="font-semibold">ARAN</div>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          title="Logout"
        >
          Logout
        </button>
      </header>

      {/* Grid: sidebar + main */}
      <div
        className="flex-1 grid"
        style={{ gridTemplateColumns: `${collapsed ? "0px" : "150px"} minmax(0,1fr)` }}
      >
        <aside
          className={[
            "relative bg-white transition-all duration-200 overflow-hidden",
            `sticky top-[${HEADER_HEIGHT}px]`,
            "rounded-tr-xl",
            collapsed ? "w-0 p-0 pointer-events-none" : "w-[150px]",
          ].join(" ")}
        >
          <RoleAwareSidebar />
          {!collapsed && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 h-full w-2 bg-gradient-to-r from-black/5 to-transparent"
            />
          )}
        </aside>

        <main
          className={[
            "min-w-0 transition-[padding] duration-200",
            collapsed ? "pl-0" : "pl-2", // keep this tiny so there’s no large gutter
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
