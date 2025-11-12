"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import StaffDetailModal from "@/components/admin/StaffDetailModal";
import type { Staff } from "@/types/staff";
import AddStaffModal from "@/components/admin/AddStaffModal";
import { useRoles } from "@/hooks/useRoles";


type StaffWithMultiDept = Staff & {
  departments?: string[]; // supports multiple departments
  department?: string; // backward compatibility
};

export default function StaffPage() {
  const { selectedBranch } = useBranch();
  const [staffList, setStaffList] = useState<StaffWithMultiDept[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { roles, loading: loadingRoles } = useRoles();
  const [filters, setFilters] = useState({
    name: "",
    id: "",
    department: "",
    role: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffWithMultiDept | null>(
    null
  );

  const handleToggleStatus = (id: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: s.status === "inactive" ? "active" : "inactive",
            }
          : s
      )
    );
  };
  const [addModalOpen, setAddModalOpen] = useState(false);
  // ───────────────────────────────────────────────
  // Load staff and branch data
  // ───────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [staffRes, userRes] = await Promise.all([
          fetch("/data/staff.json"),
          fetch("/data/users.json"),
        ]);

        const staffData: StaffWithMultiDept[] = staffRes.ok
          ? await staffRes.json()
          : [];
        const userData = userRes.ok ? await userRes.json() : { clinics: [] };
        const allBranches = userData.clinics.flatMap(
          (c: any) => c.branches || []
        );

        setStaffList(staffData);
        setBranches(allBranches);
      } catch (err) {
        console.error("Error loading staff/users:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ───────────────────────────────────────────────
  // Derive current branch info
  // ───────────────────────────────────────────────
  let branchName = "";
  let branchId = "";
  let branchStatus: "active" | "pending" | "inactive" = "active";

  if (typeof selectedBranch === "string") {
    const match =
      branches.find(
        (b) =>
          b.id.toLowerCase() === selectedBranch.toLowerCase() ||
          b.name.toLowerCase() === selectedBranch.toLowerCase()
      ) || null;
    branchId = match?.id || selectedBranch;
    branchName = match?.name || selectedBranch;
    branchStatus = match?.status || "active";
  } else if (selectedBranch && typeof selectedBranch === "object") {
    // @ts-ignore
    branchId = selectedBranch.id || "";
    // @ts-ignore
    branchName = selectedBranch.name || "";
    // @ts-ignore
    branchStatus = selectedBranch.status || "active";
  }

  // ───────────────────────────────────────────────
  // Filter staff list
  // ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    const branchFiltered = staffList.filter((s) => {
      const staffBranch = s.branch.toLowerCase().trim();
      const selected = branchName.toLowerCase().trim();
      return staffBranch === selected || staffBranch.includes(selected);
    });
    return branchFiltered.filter((s) => {
      const matchName = s.name
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const matchId = s.id.toLowerCase().includes(filters.id.toLowerCase());
      const matchDept = filters.department
        ? (s.departments || [s.department || ""])
            .join(", ")
            .toLowerCase()
            .includes(filters.department.toLowerCase())
        : true;
      
const matchRole =
  !filters.role ||
  s.role.includes(filters.role as "Doctor" | "Nurse" | "Branch Admin" | "Clinic Admin");

      return matchName && matchId && matchDept && matchRole;
    });
  }, [staffList, branchName, filters]);

  // ───────────────────────────────────────────────
  // UI states
  // ───────────────────────────────────────────────
  if (!selectedBranch)
    return (
      <div className="ui-card p-6 text-center text-gray-600">
        No branch selected.
      </div>
    );
  if (loading)
    return (
      <div className="ui-card p-6 text-center text-gray-500">
        Loading staff data…
      </div>
    );
  if (branchStatus === "pending")
    return (
      <div className="ui-card p-6 text-center text-gray-600">
        Approval pending for this branch.
      </div>
    );

  // ───────────────────────────────────────────────
  // Main UI
  // ───────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="ui-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2 py-4">
        <div className="flex flex-wrap gap-2 items-center w-2/3">
          <input
            type="text"
            placeholder="Search by name, id, department"
            className="ui-input flex-1"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />

          <select
            className="ui-input flex-1"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All Roles</option>
            <option>Doctor</option>
            <option>Nurse</option>
            <option>Branch Admin</option>
            <option>Clinic Admin</option>
          </select>
        </div>
        <button
          className="btn-primary px-4 py-2 text-sm shrink-0"
          onClick={() => setAddModalOpen(true)}
        >
          + Add Staff
        </button>
      </div>

      {/* Branch info */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">Branch:</span> {branchName}
      </div>

      {/* Staff table */}
      <div className="ui-card overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-600">
              <th className="text-left py-2 px-2">ID</th>
              <th className="text-left py-2 px-2">Name</th>
              <th className="text-left py-2 px-2">Role</th>
              <th className="text-left py-2 px-2">Departments</th>
              <th className="text-right py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No staff found.
                </td>
              </tr>
            ) : (
              filtered.map((s, index) => (
                <tr
                  key={`${s.id}-${index}`}
                  className={`border-b border-gray-200 last:border-none hover:bg-gray-50 transition ${
                    s.status === "inactive" ? "opacity-50" : ""
                  }`}
                >
                  {/* ID */}
                  <td className="py-2 px-2 font-mono text-xs text-gray-700">
                    {s.id}
                  </td>

                  {/* Name + Contact */}
                  <td className="py-2 px-2">
                    <div className="flex flex-col">
                      {s.status === "inactive" && (
                        <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wide mb-0.5">
                          Inactive
                        </span>
                      )}
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">
                        {s.phone} • {s.email}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-2 px-2">{s.role}</td>

                  {/* Departments */}
                  <td className="py-2 px-2">
                    {Array.isArray(s.departments) ? (
                      <div className="flex flex-wrap gap-1">
                        {s.departments.map((d, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-gray-100 rounded-full text-gray-700"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      s.department || ","
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-2 text-right">
                    <ActionMenu
                      staff={s}
                      onEdit={() => {
                        setSelectedStaff(s);
                        setModalOpen(true);
                      }}
                      onToggleStatus={handleToggleStatus}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Detail Modal */}
      <StaffDetailModal
        open={modalOpen}
        staff={selectedStaff}
        onClose={() => setModalOpen(false)}
        onUpdate={(updated) => {
          setStaffList((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }}
      />

{/* Staff Detail Modal */}
      <AddStaffModal
  open={addModalOpen}
  onClose={() => setAddModalOpen(false)}
  onSave={(newStaff) => {
    setStaffList((prev) => [...prev, newStaff]);
  }}
/>
    </div>
  );
}

/* ---------------------- 3-dot Action Menu ---------------------- */
/* ---------------------- 3-dot Action Menu with Deactivate Toggle ---------------------- */
function ActionMenu({
  staff,
  onEdit,
  onToggleStatus,
}: {
  staff: StaffWithMultiDept;
  onEdit: () => void;
  onToggleStatus: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    setOpen(false);
    onToggleStatus(staff.id);
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="block w-full text-left text-sm px-3 py-2 hover:bg-gray-50"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            ✏️ Edit
          </button>
          <button
            className="block w-full text-left text-sm px-3 py-2 hover:bg-gray-50"
            onClick={handleToggle}
          >
            {staff.status === "inactive" ? "✅ Activate" : "🚫 Deactivate"}
          </button>
          <button className="block w-full text-left text-sm px-3 py-2 hover:bg-gray-50">
            💬 Message
          </button>
        </div>
      )}
    </div>
  );
}
