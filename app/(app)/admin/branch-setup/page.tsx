"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBranch } from "@/context/BranchContext";

/* -------------------------------------------------------------------------- */
/*                             Type Declarations                              */
/* -------------------------------------------------------------------------- */
type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  isActive: boolean;
};

/* -------------------------------------------------------------------------- */
/*                              Main Component                                */
/* -------------------------------------------------------------------------- */
export default function BranchSetupPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- Load branch list from mock JSON ---------- */
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch("/data/mock-branches.json");
        if (!res.ok) throw new Error("Failed to load mock branch list");
        const data = await res.json();
        setBranches(data);
      } catch (err) {
        console.error("Error loading branches:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBranches();
  }, []);

  /* ---------- Select current branch ---------- */
  const branch = branches.find((b) => b.id === selectedBranch);

  if (loading)
    return (
      <div className="ui-card p-4 text-sm text-gray-500 text-center">
        Loading branch setup…
      </div>
    );

  if (!branch)
    return (
      <div className="ui-card p-4 text-sm text-gray-600 text-center">
        Selected branch not found.
      </div>
    );

  /* ---------- Branch Active: Show Configuration Cards ---------- */
  if (branch.isActive) {
    return (
      <div className="space-y-6">
        {/* ---------------- Header Card ---------------- */}
        <div className="ui-card p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{branch.name}</div>
            <div className="text-xs text-gray-600">
              {branch.address}, {branch.city}, {branch.state}
            </div>
          </div>

          <span className="px-3 py-1 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700">
            Active
          </span>
        </div>

        {/* ---------------- Config Cards ---------------- */}
        <div className="grid gap-4 md:grid-cols-3">
          <ConfigCard
            title="Edit Branch Details"
            desc="Edit address, contact, and other general info for this branch."
            onClick={() => router.push("/admin/branch-edit")}
          />
          <ConfigCard
            title="Department Configuration"
            desc="Add, remove, or rename departments in this branch."
            onClick={() => router.push("/admin/department-setup")}
          />
          <ConfigCard
            title="Care Type Configuration"
            desc="Manage care types (OPD, Daycare, Inpatient) for this branch."
            onClick={() => router.push("/admin/caretype-setup")}
          />
        </div>
      </div>
    );
  }

  /* ---------- Branch Not Active: Awaiting Approval ---------- */
  return (
    <div className="ui-card p-6 text-center">
      <div className="text-base font-semibold text-gray-800">
        {branch.name}
      </div>
      <p className="text-sm text-gray-500 mt-2">
        This branch is not yet activated.
      </p>
      <p className="text-sm text-amber-600 mt-1 font-medium">
        Awaiting approval from ARAN Admin.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Reusable Config Card                             */
/* -------------------------------------------------------------------------- */
function ConfigCard({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <div className="ui-card p-4 flex flex-col justify-between transition hover:shadow-md hover:-translate-y-0.5">
      <div>
        <h2 className="text-sm font-semibold mb-1 text-gray-900">{title}</h2>
        <p className="text-xs text-gray-600 leading-snug">{desc}</p>
      </div>
      <div className="mt-4">
        <button
          className="btn-outline text-sm w-full"
          onClick={onClick}
        >
          Manage →
        </button>
      </div>
    </div>
  );
}
