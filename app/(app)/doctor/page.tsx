"use client";

import React, { useEffect, useState } from "react";
import SummaryCards, { SummaryData } from "@/components/dashboard/SummaryCards";
import QueueTable, { QueueEntry } from "@/components/dashboard/QueueTable";
import RecentConsultations, {
  ConsultationEntry,
} from "@/components/dashboard/RecentConsultations";
import NotificationsPanel, {
  Notification,
} from "@/components/dashboard/NotificationsPanel";
import QuickActions from "@/components/dashboard/QuickActions";
import WeeklyOverview, {
  WeeklyData,
} from "@/components/dashboard/WeeklyOverview";

/* -------------------------------------------------------------------------- */
/*                            Dashboard Data Types                            */
/* -------------------------------------------------------------------------- */
type DashboardData = {
  summary: SummaryData;
  queue: QueueEntry[];
  recent: ConsultationEntry[];
  notifications: Notification[];
  weekly: WeeklyData;
};

/* -------------------------------------------------------------------------- */
/*                            Main Doctor Dashboard                           */
/* -------------------------------------------------------------------------- */
export default function DoctorDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/doctor/dashboard");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="p-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
      {/* LEFT: Summary + Queue + Consultations */}
      <div className="space-y-6">
        <SummaryCards data={loading || error ? undefined : data?.summary} />
        <QueueTable queue={loading || error ? undefined : data?.queue} />
        <RecentConsultations recent={loading || error ? undefined : data?.recent} />
      </div>

      {/* RIGHT: Notifications + Quick Actions + Analytics */}
      <div className="space-y-6">
        <NotificationsPanel
          notifications={loading || error ? undefined : data?.notifications}
        />
        <QuickActions />
        <WeeklyOverview data={loading || error ? undefined : data?.weekly} />
      </div>

      {/* Error state (overlay message) */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
