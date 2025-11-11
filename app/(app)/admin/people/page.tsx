"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ShieldCheck, Calendar } from "lucide-react";
import { useBranch } from "@/context/BranchContext";

type Branch = { id: string; name: string; status: "active" | "pending" | "inactive" };
type Clinic = { id: string; name: string; branches: Branch[] };
type UserData = { clinics: Clinic[] };

export default function PeopleManagementPage() {
  const { selectedBranch } = useBranch();
  const [branchInfo, setBranchInfo] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  // Load branch info from users.json
  useEffect(() => {
    async function loadBranch() {
      try {
        const res = await fetch("/data/users.json");
        if (!res.ok) throw new Error("users.json not found");
        const data: UserData = await res.json();

        // flatten all branches across clinics
        const allBranches: Branch[] = data.clinics.flatMap((c) => c.branches || []);

        // match either by name or ID
        const found =
          allBranches.find(
            (b) =>
              b.name.toLowerCase() ===
                selectedBranch?.toString().toLowerCase() ||
              b.id.toLowerCase() === selectedBranch?.toString().toLowerCase()
          ) || null;

        setBranchInfo(found);
      } catch (err) {
        console.error("Error loading branch info:", err);
        setBranchInfo(null);
      } finally {
        setLoading(false);
      }
    }
    loadBranch();
  }, [selectedBranch]);

  // --------------------------------------------
  // UI states
  // --------------------------------------------
  if (!selectedBranch)
    return (
      <div className="ui-card p-6 text-center text-gray-600">
        No branch selected. Please choose a branch to view People Management.
      </div>
    );

  if (loading)
    return (
      <div className="ui-card p-6 text-center text-gray-500">
        Loading branch details…
      </div>
    );

  if (!branchInfo)
    return (
      <div className="ui-card p-6 text-center text-gray-500">
        Branch not found in users.json
      </div>
    );

  // --------------------------------------------
  // Pending Branch
  // --------------------------------------------
  if (branchInfo.status === "pending") {
    return (
      <div className="space-y-6">
        {/* Branch Card */}
        <div className="ui-card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Current Branch</div>
            <div className="text-lg font-semibold text-gray-900">
              {branchInfo.name}
            </div>
            <div className="mt-1 text-xs font-medium text-amber-600">
              Approval pending for this branch
            </div>
          </div>
          <div className="text-xs text-gray-500">People Management</div>
        </div>

        {/* Pending Message */}
        <div className="ui-card p-6 text-center bg-amber-50 border border-amber-200 text-amber-800">
          ⚠ This branch is awaiting admin approval.  
          Staff, roles, and scheduling will be enabled once approved.
        </div>
      </div>
    );
  }

  // --------------------------------------------
  // Active Branch
  // --------------------------------------------
  return (
    <div className="space-y-6">
      {/* Branch Card */}
      <div className="ui-card p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Current Branch</div>
          <div className="text-lg font-semibold text-gray-900">
            {branchInfo.name}
          </div>
          <div className="mt-1 text-xs text-green-600 font-medium">
            Status: {branchInfo.status}
          </div>
        </div>
        <div className="text-xs text-gray-500">People Management</div>
      </div>

      {/* Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/people/staff"
          className="ui-card group p-5 hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[--secondary]/10 text-[--secondary]">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Staff Management</h3>
              <p className="text-sm text-gray-500">
                Add, view, and manage clinic staff and doctors.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/people/roles"
          className="ui-card group p-5 hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[--secondary]/10 text-[--secondary]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Role & Access</h3>
              <p className="text-sm text-gray-500">
                Define permissions and assign access to roles.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/people/schedule"
          className="ui-card group p-5 hover:shadow-md transition flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[--secondary]/10 text-[--secondary]">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Schedule & Calendar</h3>
              <p className="text-sm text-gray-500">
                Manage doctor duty rosters and clinic timings.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
