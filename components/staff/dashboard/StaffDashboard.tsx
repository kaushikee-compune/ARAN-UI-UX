"use client";

import { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";
import TodayMetricsRow from "./TodayMetricsRow";
import QueueSnapshot from "./QueueSnapshot";
import TodayAppointments from "./TodayAppointments";
import QuickActions from "./QuickActions";

type Staff = {
  id: string;
  name: string;
  roles: string[];
  branches: string[];
  email: string;
  phone: string;
  status: string;
};

export default function StaffDashboard() {
  const { selectedBranch } = useBranch();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  // Read session cookie
  function loadSession(): any | null {
    if (typeof document === "undefined") return null;
    const raw = document.cookie
      .split("; ")
      .find((r) => r.startsWith("aran.session="));
    if (!raw) return null;

    try {
      const encoded = raw.split("=")[1];
      const decoded = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    async function init() {
      const session = loadSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch("/data/staff.json");
      const allStaff: Staff[] = await res.json();

      const me = allStaff.find((s) => s.id === session.userId);
      setStaff(me || null);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-500">Loading staff dashboard…</div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Greeting Section */}
      <div>
        <h1 className="text-xl font-semibold">
          Good Morning{staff ? `, ${staff.name.split(" ")[0]}` : ""} 👋
        </h1>
        <div className="text-sm text-gray-500 mt-1">
          Branch: {selectedBranch} • Role: Staff
        </div>
      </div>

      <TodayMetricsRow />

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QueueSnapshot />
        <TodayAppointments />
      </div>

      <QuickActions />
    </div>
  );
}
