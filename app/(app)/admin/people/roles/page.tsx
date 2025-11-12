"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useBranch } from "@/context/BranchContext";
import { useRoles } from "@/hooks/useRoles";

type Staff = {
  id: string;
  name: string;
  phone: string;
  email: string;
  department: string | string[];
  branch: string;
  branchId: string;
  role: string[];
  status: string;
};

export default function RoleAccessPage() {
  const { selectedBranch } = useBranch(); // e.g. { id: "B001", name: "Koramangala (Main)" } or "B001"
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Staff | null>(null);
  const { roles } = useRoles();

  // Load staff.json
  useEffect(() => {
    fetch("/data/staff.json")
      .then((res) => res.json())
      .then((data) => setStaff(data))
      .catch((err) => console.error("Failed to load staff.json", err));
  }, []);

  // --- Branch & search filter ---
  const branchStaff = useMemo(() => {
    if (!selectedBranch) return [];
    const branchId =
      typeof selectedBranch === "string"
        ? selectedBranch
        : (selectedBranch as any).id;
    return staff.filter(
      (s) =>
        s.branchId === branchId &&
        (s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.phone.includes(search) ||
          s.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [staff, selectedBranch, search]);

  // --- Save role ---
  const saveRole = (id: string, newRoles: string[]) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, role: newRoles } : s))
    );
    setEditing(null);
  };

  // --- Deactivate ---
  const deactivate = (id: string) => {
    if (confirm("Deactivate this staff member?")) {
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "inactive" } : s))
      );
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">Role & Access</h1>
        <div className="flex-1" />
        <input
          type="search"
          placeholder="Search by name, phone or email..."
          className="ui-input w-[min(300px,100%)]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="ui-card overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left w-16">ID</th>
              <th className="px-3 py-2 text-left">Name / Contact</th>
              <th className="px-3 py-2 text-left">Department</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branchStaff.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No staff found for this branch.
                </td>
              </tr>
            ) : (
              branchStaff.map((s) => (
                <tr
                  key={s.id}
                  className={`border-t ${
                    s.status !== "active" ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-3 py-2">{s.id}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-600">{s.phone}</div>
                    <div className="text-xs text-gray-600">{s.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    {Array.isArray(s.department)
                      ? s.department.join(", ")
                      : s.department}
                  </td>
                  <td className="px-3 py-2">
                    {editing?.id === s.id ? (
                      <div className="flex flex-col gap-1">
                        {(editing.role || []).map((r, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <select
                              className="ui-input w-40"
                              value={r}
                              onChange={(e) => {
                                const updated = [...(editing.role || [])];
                                updated[idx] = e.target.value;
                                setEditing({ ...editing, role: updated });
                              }}
                            >
                              {roles.map((r) => (
  <option key={r.id} value={r.name}>
    {r.name}
  </option>
))}
                            </select>
                            <button
                              className="text-xs text-red-500"
                              onClick={() => {
                                const updated = (editing.role || []).filter(
                                  (_, i) => i !== idx
                                );
                                setEditing({ ...editing, role: updated });
                              }}
                              title="Remove role"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          className="text-xs text-[--secondary] mt-1 hover:underline"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              role: [...(editing.role || []), ""],
                            })
                          }
                        >
                          + Add Role
                        </button>

                        <div className="flex gap-2 mt-2">
                          <button
                            className="btn-outline text-xs"
                            onClick={() => saveRole(s.id, editing.role || [])}
                          >
                            Save
                          </button>
                          <button
                            className="btn-outline text-xs"
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(s.role || []).map((r: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs rounded-full bg-[--secondary]/10 text-[--secondary]"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    {s.status !== "active" ? (
                      <span className="text-xs text-gray-400">Inactive</span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className="text-xs text-[--secondary] hover:underline"
                          onClick={() => setEditing(s)}
                        >
                          Edit Role
                        </button>
                        <button
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => deactivate(s.id)}
                        >
                          Deactivate
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
