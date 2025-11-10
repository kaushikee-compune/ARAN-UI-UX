"use client";

import React from "react";
import BranchSetupPanel from "@/components/admin/clinic-setup/BranchSetupPanel";
import { useBranch } from "@/context/BranchContext";
import { useRouter } from "next/navigation";

export default function BranchEditPage() {
  const { selectedBranch } = useBranch();
  const router = useRouter();

  if (!selectedBranch) {
    return (
      <div className="ui-card p-6 text-gray-500 text-center">
        No branch selected. Please go back to the Branch Setup page and select one.
        <div className="mt-3">
          <button
            className="btn-outline text-sm"
            onClick={() => router.push("/admin/branch-setup")}
          >
            ← Back to Branch Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Optional back button at top */}
      <div className="absolute top-4 left-4">
        <button
          className="btn-outline text-xs"
          onClick={() => router.push("/admin/branch-setup")}
        >
          ← Back
        </button>
      </div>

      <BranchSetupPanel branchId={selectedBranch} />
    </div>
  );
}
