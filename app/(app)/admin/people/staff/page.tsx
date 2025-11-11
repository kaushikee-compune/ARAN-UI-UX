"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import ReactDOM from "react-dom";

type Staff = {
  id: string;
  name: string;
  role: "Doctor" | "Nurse" | "Branch Admin" | "Clinic Admin";
  department: string;
  branch: string; // human-readable name
  email: string;
  phone: string;
  status: "active" | "inactive" | "pending";
};

type Branch = { id: string; name: string; status: "active" | "pending" | "inactive" };

export default function StaffPage() {
  const { selectedBranch } = useBranch();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: "",
    id: "",
    department: "",
    role: "",
  });

  // ---------------------------------------------------------------------------
  // Load data: staff + branch info (from users.json)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const [staffRes, userRes] = await Promise.all([
          fetch("/data/staff.json"),
          fetch("/data/users.json"),
        ]);

        const staffData: Staff[] = staffRes.ok ? await staffRes.json() : [];
        const userData = userRes.ok ? await userRes.json() : { clinics: [] };

        // Flatten branches
        const allBranches: Branch[] = userData.clinics.flatMap(
          (c: any) => c.branches || []
        );

        setStaffList(staffData);
        setBranches(allBranches);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ---------------------------------------------------------------------------
  // Derive current branch info (supports string or object from context)
  // ---------------------------------------------------------------------------
  let branchName = "";
  let branchId = "";
  let branchStatus: "active" | "pending" | "inactive" = "active";

  if (typeof selectedBranch === "string") {
    // match by ID or name
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

  // ---------------------------------------------------------------------------
  // Filter staff list by branch + search filters
  // ---------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const branchFiltered = staffList.filter((s) => {
      const staffBranch = s.branch.toLowerCase().trim();
      const matchName = branchName.toLowerCase().trim();
      const matchId = branchId.toLowerCase().trim();

      // match if same name or if branchId maps to this name
      return (
        staffBranch === matchName ||
        staffBranch.includes(matchName) ||
        staffBranch.includes(matchId)
      );
    });

    return branchFiltered.filter((s) => {
      const matchName = s.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchId = s.id.toLowerCase().includes(filters.id.toLowerCase());
      const matchDept = s.department
        .toLowerCase()
        .includes(filters.department.toLowerCase());
      const matchRole = filters.role ? s.role === filters.role : true;
      return matchName && matchId && matchDept && matchRole;
    });
  }, [staffList, branchName, branchId, filters]);

  // ---------------------------------------------------------------------------
  // Handle pending / loading / no branch
  // ---------------------------------------------------------------------------
  if (!selectedBranch)
    return (
      <div className="ui-card p-6 text-center text-gray-600">
        No branch selected. Please choose a branch.
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
      <div className="ui-card p-8 text-center text-amber-700 bg-amber-50 border border-amber-200">
        <h2 className="text-base font-semibold mb-2">
          This branch is not yet activated.
        </h2>
        <p className="text-sm italic">Awaiting approval from ARAN Admin.</p>
      </div>
    );

  // ---------------------------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Branch Info */}
      <div className="text-sm text-gray-600 px-4 py-2">
        <span className="font-medium">Branch:</span> {branchName || "—"}
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center w-2/3">
          <input
            type="text"
            placeholder="Search by name,ID,Department"
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
        <button className="btn-primary justify-center px-4 py-2 mr-4 text-sm ">
          + Add Staff
        </button>
      </div>

      

      {/* Table */}
      <div className="ui-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-600">
              <th className="text-left py-2 px-2">ID</th>
              <th className="text-left py-2 px-2">Name</th>
              <th className="text-left py-2 px-2">Role</th>
              <th className="text-left py-2 px-2">Department</th>
              <th className="text-right py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No staff found for this branch.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-200 last:border-none hover:bg-gray-50"
                >
                  <td className="py-2 px-2 font-mono text-xs text-gray-700">
                    {s.id}
                  </td>
                  <td className="py-2 px-2">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      {s.phone} • {s.email}
                    </div>
                  </td>
                  <td className="py-2 px-2">{s.role}</td>
                  <td className="py-2 px-2">{s.department}</td>
                  <td className="py-2 px-2 text-right">
                    <ActionMenu staff={s} />
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

/* ---------------------- 3-dot Action Menu ---------------------- */
function ActionMenu({ staff }: { staff: Staff }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ x: rect.right, y: rect.bottom + 4 });
    }
    setOpen(!open);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => setOpen(false);
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100"
        onClick={toggleMenu}
      >
        <MoreVertical size={16} />
      </button>

      {open &&
        coords &&
        ReactDOM.createPortal(
          <div
            className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[9999] w-40 animate-fadeIn"
            style={{
              top: coords.y,
              left: coords.x - 150, // shift left to stay aligned
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="block w-full text-left text-sm px-3 py-2 hover:bg-gray-50">
              ✏️ Edit
            </button>
            <button className="block w-full text-left text-sm px-3 py-2 hover:bg-gray-50">
              🚫 Deactivate
            </button>
            <button className="block w-full text-left text-sm px-3 py-2 hover:bg-gray-50">
              💬 Message
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

