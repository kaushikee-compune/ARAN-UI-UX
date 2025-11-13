"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBranch } from "@/context/BranchContext";
import BranchSetupPanel from "@/components/admin/clinic-setup/BranchSetupPanel";

/* -------------------------------------------------------------------------- */
/*                              Type Declarations                              */
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
/*                               Main Component                                */
/* -------------------------------------------------------------------------- */
export default function BranchEditPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch("/data/mock-branches.json");
        if (!res.ok) throw new Error("Failed to load branch list");
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

  if (loading)
    return (
      <div className="ui-card p-4 text-sm text-gray-500 text-center">
        Loading branch data…
      </div>
    );

  if (!selectedBranch)
    return (
      <div className="ui-card p-6 text-center text-gray-500">
        No branch selected.
        <div className="mt-3">
          <button
            className="btn-outline text-xs"
            onClick={() => router.push("/admin/branch-setup")}
          >
            ← Back
          </button>
        </div>
      </div>
    );

  const branch = branches.find((b) => b.id === selectedBranch);

  if (!branch)
    return (
      <div className="ui-card p-4 text-sm text-gray-600 text-center">
        Branch not found.
      </div>
    );

  // 🔸 If branch is NOT active → show approval message
  if (!branch.isActive) {
    return (
      <div className="ui-card p-6  text-center space-y-2">
        <div className="text-base font-semibold text-gray-800">
          {branch.name}
        </div>
        <p className="text-sm text-gray-500">
          This branch is not yet activated.
        </p>
        <p className="text-sm text-amber-600 font-medium">
          Awaiting approval from ARAN Admin.
        </p>
        <div className="mt-4">
          <button
            className="btn-outline text-xs"
            onClick={() => router.push("/admin/branch-setup")}
          >
            ← Back to Branch Setup
          </button>
        </div>
      </div>
    );
  }

  // 🔹 Otherwise render the BranchSetupPanel
  return (
    <div className="relative">
      <div className="absolute top-4 left-4">
        <button
          className="btn-outline text-xs"
          onClick={() => router.push("/admin/branch-setup")}
        >
          ← Back to Branch Setup
        </button>
      </div>

      <BranchSetupPanel branchId={selectedBranch} />
      
    </div>
  );
}
