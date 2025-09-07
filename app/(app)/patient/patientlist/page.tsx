"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Patient = {
  id: string;
  name: string;
  phone: string;
  dob: string;
  age: number;
  uhid: string;
  abhaNumber: string | null;
  abhaAddress: string | null;
  registrationDate: string;
};

export default function PatientListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [filterAbha, setFilterAbha] = useState<"all" | "with" | "without">(
    "all"
  );
  const [filterDob, setFilterDob] = useState("");
  const [filterReg, setFilterReg] = useState("");

  // Load JSON from public/data/patients.json
  useEffect(() => {
    fetch("/data/patients.json")
      .then((res) => res.json())
      .then((data: Patient[]) => setPatients(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const q = query.trim().toLowerCase();

      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.abhaAddress || "").toLowerCase().includes(q) ||
        (p.abhaNumber || "").replace(/\s+/g, "").includes(q.replace(/\s+/g, ""));

      const matchesDob = !filterDob || p.dob === filterDob;
      const matchesReg = !filterReg || p.registrationDate === filterReg;

      const matchesAbha =
        filterAbha === "all"
          ? true
          : filterAbha === "with"
          ? !!p.abhaNumber
          : !p.abhaNumber;

      return matchesQuery && matchesDob && matchesReg && matchesAbha;
    });
  }, [patients, query, filterDob, filterReg, filterAbha]);

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading patients…</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Search & Filters */}
      <div className="ui-card p-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, ABHA number, ABHA address..."
          className="ui-input w-full"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-gray-600">DOB</label>
            <input
              type="date"
              value={filterDob}
              onChange={(e) => setFilterDob(e.target.value)}
              className="ui-input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Registration Date</label>
            <input
              type="date"
              value={filterReg}
              onChange={(e) => setFilterReg(e.target.value)}
              className="ui-input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">ABHA Filter</label>
            <select
              value={filterAbha}
              onChange={(e) =>
                setFilterAbha(e.target.value as "all" | "with" | "without")
              }
              className="ui-input w-full"
            >
              <option value="all">All</option>
              <option value="with">With ABHA</option>
              <option value="without">Without ABHA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className="overflow-x-auto ui-card">
        <table className="w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Age</Th>
              <Th>UHID</Th>
              <Th>ABHA Details</Th>
              
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              // ✅ robust unique key even if sample data has duplicate IDs
              <tr key={`${p.id}-${i}`} className="border-t">
                <Td>{p.name}</Td>
                <Td>{p.phone}</Td>
                <Td>{p.age}</Td>
                <Td>{p.uhid}</Td>
                <Td>
                  {p.abhaNumber ? (
                    <div>
                      <div>{p.abhaNumber}</div>
                      <div className="text-xs text-gray-500">
                        {p.abhaAddress}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </Td>
                <Td>
                  <ActionMenu patient={p} />
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-gray-500"
                >
                  No patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Small Components ---------- */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>;
}

function ActionMenu({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-2 py-1 rounded hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Actions"
        title="Actions"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border rounded-lg shadow z-20">
          <button className="block w-full px-3 py-2 text-sm text-left hover:bg-gray-50">
            View Details
          </button>
          {patient.abhaNumber && (
            <>
              <button className="block w-full px-3 py-2 text-sm text-left hover:bg-gray-50">
                View ABHA
              </button>
              <button className="block w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50">
                Delink ABHA
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
