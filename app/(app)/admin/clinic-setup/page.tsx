"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getBranches, type Branch } from "@/lib/services/branchService";
import BranchSetupPanel from "@/components/admin/clinic-setup/BranchSetupPanel";
import AddBranchPanel from "@/components/admin/clinic-setup/AddBranchPanel";
import StickyToolBar, {
  type ToolButton,
} from "@/components/common/StickyToolBar";

export default function ClinicSetupPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [addingBranch, setAddingBranch] = useState(false);

  const topTools: ToolButton[] = [
    {
      img: "/icons/branch.png",
      label: "Branch",
      onClick: () => setSelectedBranch(null),
      variant: "green",
    },
    {
      img: "/icons/department.png",
      label: "Department",
      onClick: () => alert("Department Setup coming soon"),
      variant: "blue",
    },
    {
      img: "/icons/caretype.png",
      label: "Caretype",
      onClick: () => alert("Caretype Setup coming soon"),
      variant: "gray",
    },
  ];

  const bottomTools: ToolButton[] = [
    {
      img: "/icons/save.png",
      label: "Save",
      onClick: () => alert("Save configuration"),
      type: "tiny",
    },
    {
      img: "/icons/print.png",
      label: "Print",
      onClick: () => alert("Print setup"),
      type: "tiny",
    },
  ];

  // ───── Load branches (mock or API) ─────
  useEffect(() => {
    getBranches()
      .then(setBranches)
      .catch((err) => console.error("Branch load error:", err));
  }, []);

  // ───── Filter list by search ─────
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(s) ||
        b.id.toLowerCase().includes(s) ||
        b.location.toLowerCase().includes(s)
    );
  }, [search, branches]);

  // ───── Handle save from AddBranchPanel ─────
  const handleBranchSave = (data: any) => {
    const newBranch: Branch = {
      id: data.id || `BR${branches.length + 1}`,
      name: data.branchName,
      location: data.address.split(",")[1]?.trim() || "Unknown Location",
    };
    setBranches((prev) => [...prev, newBranch]);
    setAddingBranch(false);
  };

  return (
  <div className="flex bg-gray-50 min-h-screen">
    {/* ---------- LEFT MAIN COLUMN ---------- */}
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* ---------- Header Panel ---------- */}
      {!selectedBranch && !addingBranch && (
        <div className="ui-card flex flex-wrap items-center justify-between gap-3 p-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search branch by name, ID, or location..."
            className="ui-input flex-1 min-w-[260px]"
          />
          <button
            className="btn-primary px-4 py-2 text-sm shrink-0"
            onClick={() => setAddingBranch(true)}
          >
            + Add Branch
          </button>
        </div>
      )}

      {/* ---------- Main Content ---------- */}
      {addingBranch ? (
        <AddBranchPanel
          key="add-branch"
          onCancel={() => setAddingBranch(false)}
          onSave={handleBranchSave}
        />
      ) : !selectedBranch ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length > 0 ? (
            filtered.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch)}
                className="ui-card text-left hover:shadow-md transition p-4"
              >
                <h2 className="font-semibold text-gray-800 text-base">
                  {branch.name}
                </h2>
                <p className="text-sm text-gray-600">Branch ID: {branch.id}</p>
                <p className="text-sm text-gray-500 mt-1">{branch.location}</p>
              </button>
            ))
          ) : (
            <div className="text-gray-500 text-sm italic p-6 col-span-full text-center">
              No branches found.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4 relative">
          <button
            onClick={() => setSelectedBranch(null)}
            className="absolute top-3 right-4 text-sm text-blue-600"
          >
            ← Back to Branch List
          </button>
          <BranchSetupPanel
            key={selectedBranch.id}
            branchId={selectedBranch.id}
          />
        </div>
      )}
    </div>

    {/* ---------- RIGHT STICKY TOOLBAR ---------- */}
    <aside className="hidden md:block sticky top-20  0 self-start w-[72px] pr-4">
      <StickyToolBar
        topTools={[
          
          {
            img: "/icons/department.png",
            label: "Department",
            onClick: () => alert("Department setup coming soon"),
            variant: "blue",
          },
          {
            img: "/icons/caretype.png",
            label: "Caretype",
            onClick: () => alert("Caretype setup coming soon"),
            variant: "pink",
          },
        ]}
        
      />
    </aside>
  </div>
);

}
