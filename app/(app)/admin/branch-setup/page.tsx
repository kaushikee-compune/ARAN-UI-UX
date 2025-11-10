"use client";

import React, { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  isActive: boolean;
};

export default function BranchSetupPage() {
  const { selectedBranch } = useBranch();
  const [branches, setBranches] = useState<Branch[]>([]);

  // ✅ Load JSON via fetch (served from /public/data/)
  useEffect(() => {
    fetch("/data/mock-branches.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load branch list");
        return res.json();
      })
      .then((data) => setBranches(data))
      .catch((err) => console.error("Branch list load error:", err));
  }, []);

  const branch = branches.find((b) => b.id === selectedBranch);

  if (!branch)
    return (
      <div className="ui-card p-4 text-sm text-gray-600">
        Selected branch not found.
      </div>
    );

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

        <span
          className={`px-3 py-1 text-xs rounded-full font-medium ${
            branch.isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {branch.isActive ? "Active" : "Awaiting Activation"}
        </span>
      </div>

      {/* ---------------- Conditional Render ---------------- */}
      {branch.isActive ? (
        <div className="grid gap-4 md:grid-cols-3">
          <ConfigCard
            title="Branch General Info"
            desc="Edit or update address, contact, and admin details for this branch."
            onClick={() => alert("Open General Info Manager")}
          />
          <ConfigCard
            title="Department Configuration"
            desc="Add, remove, or rename departments for this branch."
            onClick={() => alert("Open Department Configuration")}
          />
          <ConfigCard
            title="Caretype Configuration"
            desc="Manage care types (OPD, Daycare, Inpatient) available in this branch."
            onClick={() => alert("Open Caretype Configuration")}
          />
        </div>
      ) : (
        <div className="text-sm text-gray-600 italic">
          This branch is not yet activated. Please wait for ARAN Admin approval.
        </div>
      )}
    </div>
  );
}

/* ---------- Small UI card component ---------- */
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
    <div className="ui-card p-4 flex flex-col justify-between transition hover:shadow-md">
      <div>
        <h2 className="text-sm font-semibold mb-1 text-gray-900">{title}</h2>
        <p className="text-xs text-gray-600">{desc}</p>
      </div>
      <div className="mt-4">
        <button className="btn-outline text-sm w-full" onClick={onClick}>
          Manage →
        </button>
      </div>
    </div>
  );
}
