"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DoctorSidebar from "../../components/doctor/DoctorSidebar";
import AppearancePanel from "../../components/appearance-panel";

const ROLE_STORAGE_KEY = "aran.role";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = typeof window !== "undefined" ? localStorage.getItem(ROLE_STORAGE_KEY) : null;
    if (role !== "doctor") {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(120deg,#f0f2f5_0%,#ffffff_100%)]">
      {/* Top bar (same style language as clinic admin) */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl" style={{ background: "var(--secondary)" }} />
            <div>
              <div className="text-sm font-semibold leading-4">ARAN HMIS</div>
              <div className="text-[11px] text-gray-500 leading-4">Doctor Workspace</div>
            </div>
          </div>
          <AppearancePanel />
        </div>
      </header>

      {/* Shell */}
      <div className="mx-auto max-w-7xl px-4 py-4 flex gap-4">
        <aside className="hidden md:block w-64 shrink-0">
          {/* Sidebar lives in its own component, styled to match */}
          <DoctorSidebar />
        </aside>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
