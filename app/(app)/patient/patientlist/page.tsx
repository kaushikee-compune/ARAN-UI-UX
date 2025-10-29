"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import UploadModal from "@/components/common/UploadModal";
import FilterBar, { FilterOption } from "@/components/common/FilterBar";

/* ---------------------- Patient Type ---------------------- */
type Patient = {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  uhid: string;
  abhaNumber: string | null;
  abhaAddress: string | null;
  registrationDate: string;
  lastVisitDate?: string;
  lastVisitType?: string;
};

/* ---------------------- Component ---------------------- */
export default function PatientListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "abha" | "non-abha">(
    "all"
  );
  const [gender, setGender] = useState("All");
  const [sortBy, setSortBy] = useState("registrationDate");

  // filters
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "abha" | "non-abha">("all");

  useEffect(() => {
    fetch("/data/patients.json")
      .then((res) => res.json())
      .then((data: Patient[]) => {
        // Add mock last visit fields for now
        const withVisit = data.map((p, i) => ({
          ...p,
          lastVisitDate: ["2025-10-01", "2025-09-22", "2025-09-15"][i % 3],
          lastVisitType: ["OPD", "Daycare", "Immunization"][i % 3],
        }));
        setPatients(withVisit);
      })
      .catch((err) => {
        console.error("Error loading patients:", err);
        setPatients([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = patients.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.abhaNumber || "").toLowerCase().includes(q) ||
        (p.abhaAddress || "").toLowerCase().includes(q);

      const matchesAbha =
        filterType === "all"
          ? true
          : filterType === "abha"
          ? !!p.abhaNumber
          : !p.abhaNumber;

      const matchesGender =
        gender === "All"
          ? true
          : p.gender.toLowerCase() === gender.toLowerCase();

      return matchesQuery && matchesAbha && matchesGender;
    });

    // Sort
    if (sortBy === "registrationDate") {
      list = list.sort(
        (a, b) =>
          new Date(b.registrationDate).getTime() -
          new Date(a.registrationDate).getTime()
      );
    } else if (sortBy === "lastVisitDate") {
      list = list.sort(
        (a, b) =>
          new Date(b.lastVisitDate || 0).getTime() -
          new Date(a.lastVisitDate || 0).getTime()
      );
    }

    return list;
  }, [patients, query, filterType, gender, sortBy]);

  /* ---------------------- Menu State ---------------------- */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, p: Patient) => {
    setAnchorEl(e.currentTarget);
    setSelectedPatient(p);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setSelectedPatient(null);
  };

  /* ---------------------- JSX ---------------------- */
  return (
    <div className="ui-card p-4 md:p-6">
      {/* ---------- Top Bar ---------- */}
      <div className="bg-[#f9fafb] rounded-lg shadow-sm px-3 py-3 mb-3 flex flex-col gap-2 md:gap-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-800 text-sm">
            Patient List
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              className="btn-primary text-sm font-semibold whitespace-nowrap"
              onClick={() => router.push("/patient/registration")}
            >
              Register New
            </button>
            <button
              className="btn-accent text-sm font-semibold whitespace-nowrap"
              onClick={() => setShowQR(true)}
            >
              Scan Desk
            </button>
          </div>
        </div>

        <FilterBar
          fields={[
            {
              type: "search",
              key: "query",
              placeholder: "Search (name / UHID / phone / ABHA)…",
              value: query,
              onChange: setQuery,
            },
            {
              type: "select",
              key: "filterType",
              label: "ABHA Status",
              options: [
                { label: "All Patients", value: "all" },
                { label: "ABHA Linked", value: "abha" },
                { label: "Non-ABHA", value: "non-abha" },
              ],
              value: filterType,
              onChange: (v) => setFilterType(v as "all" | "abha" | "non-abha"),
            },

            {
              type: "select",
              key: "gender",
              label: "Gender",
              options: [
                { label: "All", value: "All" },
                { label: "Female", value: "Female" },
                { label: "Male", value: "Male" },
                { label: "Other", value: "Other" },
              ],
              value: gender,
              onChange: setGender,
            },
            {
              type: "select",
              key: "sortBy",
              label: "Sort By",
              options: [
                { label: "Registration Date", value: "registrationDate" },
                { label: "Last Visit", value: "lastVisitDate" },
              ],
              value: sortBy,
              onChange: setSortBy,
            },
          ]}
        />
      </div>

      {/* ---------- Table ---------- */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">UHID</th>
              <th className="p-2 text-left">Patient</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">ABHA</th>
              <th className="p-2 text-left">Last Visit</th>
              <th className="p-2 text-left">Reg Date</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-3 text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-3 text-gray-500">
                  No patients found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.patientId}
                  className="border-t border-gray-200 hover:bg-gray-50 transition"
                >
                  {/* UHID */}
                  <td className="p-2 text-gray-700">{p.uhid}</td>

                  {/* Patient Info */}
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[--text-highlight] font-semibold">
                        {p.name}
                      </span>

                      {/* New badge */}
                      {(() => {
                        const reg = new Date(p.registrationDate);
                        const daysDiff =
                          (Date.now() - reg.getTime()) / (1000 * 60 * 60 * 24);
                        if (daysDiff <= 7)
                          return (
                            <span className="bg-[var(--secondary)] text-white text-[10px] font-semibold px-2 py-[1px] rounded-full">
                              NEW
                            </span>
                          );
                        return null;
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {p.age} yrs • {p.gender}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="p-2 text-gray-700">{p.phone}</td>

                  {/* ABHA */}
                  <td className="p-2">
                    {p.abhaNumber ? (
                      <>
                        <div className="font-semibold text-sm">
                          {p.abhaNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          {p.abhaAddress}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400 italic">
                        — Not Linked —
                      </div>
                    )}
                  </td>

                  {/* Last Visit */}
                  <td className="p-2">
                    {p.lastVisitDate ? (
                      <>
                        <div>{p.lastVisitDate}</div>
                        <div className="text-xs text-gray-500">
                          {p.lastVisitType}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400">—</div>
                    )}
                  </td>

                  {/* Reg Date */}
                  <td className="p-2 text-gray-700">{p.registrationDate}</td>

                  {/* Action */}
                  <td className="p-2 text-center">
                    <button
                      onClick={(e) => openMenu(e, p)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Action Menu ---------- */}
      {anchorEl && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-md w-36"
          style={{
            top: anchorEl?.getBoundingClientRect().bottom + 8,
            left: anchorEl?.getBoundingClientRect().left,
          }}
        >
          {["Details", "Upload", "ABHA", "Appointment"].map((label) => (
            <button
              key={label}
              onClick={() => {
                closeMenu();
                if (label === "Details" && selectedPatient)
                  router.push(
                    `/patient/patientlist/${selectedPatient.patientId}`
                  );
                else if (label === "Upload") setShowUpload(true);
                else alert(`${label} clicked`);
              }}
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ---------- QR Overlay ---------- */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative bg-white rounded-xl shadow-lg p-6 w-[400px] text-center">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <div className="flex justify-center mb-4">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ABHA-DEMO-PLACEHOLDER"
                alt="ABHA QR Code"
                className="rounded-lg border"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              ABHA QR Code
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Scan this QR code with the ABHA app to share patient profile
            </p>
          </div>
        </div>
      )}

      {/* ---------- Upload Modal ---------- */}
      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        patient={
          selectedPatient
            ? { name: selectedPatient.name, uhid: selectedPatient.uhid }
            : undefined
        }
        onUpload={(formData) => {
          console.log("Uploaded:", Object.fromEntries(formData));
        }}
      />
    </div>
  );
}
