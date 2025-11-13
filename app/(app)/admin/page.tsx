"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useBranch } from "@/context/BranchContext";

export default function AdminDashboardPage() {
  /* ---------------------------------------------------------------------- */
  /*                             BRANCH HANDLING                            */
  /* ---------------------------------------------------------------------- */

  const { selectedBranch, loading: branchLoading } = useBranch();

  // selectedBranch is ALWAYS a string now
  const branchId = useMemo(() => selectedBranch, [selectedBranch]);

  /* ---------------------------------------------------------------------- */
  /*                             LOCAL STATE                                */
  /* ---------------------------------------------------------------------- */

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------------------------------------- */
  /*                           FETCH DASHBOARD DATA                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    // WAIT until branch is fully loaded
    if (branchLoading) return;

    if (!branchId) {
      console.warn("[Dashboard] No branchId available.");
      return;
    }

    async function load() {
      try {
        setLoading(true);

        const res = await fetch("/data/dashboard-summary.json");
        if (!res.ok) throw new Error("Failed to load dashboard summary.");

        const data = await res.json();
        const branchData = data.branches[branchId];

        setSummary(branchData || null);
      } catch (err) {
        console.error("[Dashboard] Error:", err);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branchId, branchLoading]);

  /* ---------------------------------------------------------------------- */
  /*                         RENDER LOADING STATES                          */
  /* ---------------------------------------------------------------------- */

  if (branchLoading || loading) {
    return (
      <div className="p-6">
        <div className="ui-card p-6 text-center text-gray-600 text-sm">
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6">
        <div className="ui-card p-6 text-center text-red-600 text-sm">
          No summary data found for branch {branchId}.
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                              DASHBOARD UI                              */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Branch: <span className="font-medium">{branchId}</span>
        </p>
      </div>

      {/* Grid Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Clinic Stats */}
        <DashboardCard
          title="Clinic Overview"
          href="/admin/branch-edit"
          items={[
            { label: "Clinic Name", value: summary.clinicStats.clinicName },
            {
              label: "Total Branches",
              value: summary.clinicStats.totalBranches,
            },
            {
              label: "Active Branches",
              value: summary.clinicStats.activeBranches,
            },
            { label: "Status", value: summary.clinicStats.status },
          ]}
        />

        {/* Staff */}
        <DashboardCard
          title="People Management"
          href="/admin/people/staff"
          items={[
            { label: "Total Staff", value: summary.staff.total },
            { label: "Doctors", value: summary.staff.doctors },
            {
              label: "Pending Approvals",
              value: summary.staff.pendingApprovals,
            },
          ]}
        />

        {/* Inventory */}
        <DashboardCard
          title="Inventory"
          href="/admin/inventory"
          items={[
            { label: "Total Items", value: summary.inventory.totalItems },
            { label: "Low Stock", value: summary.inventory.lowStock },
          ]}
        />
    

        {/* Billing */}
        <DashboardCard
          title="Billing & Payments"
          href="/admin/billing"
          items={[
            { label: "Today's Revenue", value: `₹${summary.billing.today}` },
            { label: "This Month", value: `₹${summary.billing.month}` },
            {
              label: "Pending Invoices",
              value: summary.billing.pendingInvoices,
            },
          ]}
        />

        {/* Quick Links */}
        <QuickLinkCard />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Reusable Dashboard Card                           */
/* -------------------------------------------------------------------------- */

function DashboardCard({
  title,
  items,
  href,
}: {
  title: string;
  items: { label: string; value: any }[];
  href: string;
}) {
  return (
    <div className="ui-card p-4 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold mb-3">{title}</h3>
        <div className="space-y-1 text-sm">
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between text-gray-700">
              <span>{it.label}</span>
              <span className="font-medium">{it.value ?? "-"}</span>
            </div>
          ))}
        </div>
      </div>

      <Link
        href={href}
        className="btn-primary mt-4 text-xs inline-block px-3 py-1.5 border rounded-lg text-[--secondary] border-[--secondary] hover:bg-[--secondary] hover:text-[--on-secondary]"
      >
        Go to {title}
      </Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Quick Action Card                               */
/* -------------------------------------------------------------------------- */

function QuickLinkCard() {
  const links = [
    { label: "Branch Setup", href: "admin/branch-setup" },
    { label: "Caretypes", href: "/admin/caretype-setup" },
    { label: "Role & Access", href: "/admin/people/roles" },
  ];

  return (
    <div className="ui-card p-4">
      <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>

      <div className="space-y-2 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="btn-neutral block px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 border text-gray-700"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
