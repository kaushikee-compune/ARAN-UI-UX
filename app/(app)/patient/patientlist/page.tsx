"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import UploadModal from "@/components/common/UploadModal";
import FilterBar from "@/components/common/FilterBar";
import { useBranch } from "@/context/BranchContext";

/* ---------------------- Types ---------------------- */
type RegistrationEntry = {
  branchId: string;
  doctorId: string;
  registrationDate: string;
  lastVisitDate?: string;
  lastVisitType?: string;
};

type Demographics = {
  name: string;
  phone: string;
  dob: string;
  age: number;
  gender: string;
  uhid: string;
  abhaNumber: string | null;
  abhaAddress: string | null;
};

type Patient = {
  patientId: string;
  demographics: Demographics;
  registrations: RegistrationEntry[];
};

export default function PatientListPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();

  /* ---------------------- State ---------------------- */
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  // Menu + UI
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [showQR, setShowQR] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Filters
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "abha" | "non-abha">(
    "all"
  );
  const [gender, setGender] = useState("All");
  const [sortBy, setSortBy] = useState("registrationDate");

  /* ---------------------- Load session ---------------------- */
  useEffect(() => {
    try {
      const raw = document.cookie
        .split("; ")
        .find((r) => r.startsWith("aran.session="));

      if (raw) {
        const encoded = raw.split("=")[1];
        const decoded = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
        setSession(JSON.parse(decoded));
      }
    } catch (err) {
      console.error("Session decode error:", err);
      setSession(null);
    }
  }, []);

  const doctorId = session?.id; // doctorId from session

  /* ---------------------- Load patients.json ---------------------- */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/data/patients.json?" + Date.now());
        const data = await res.json();
        setPatients(data);
      } catch (err) {
        console.error("Error loading patients.json:", err);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------------------- Filter patients ---------------------- */
  const filtered = useMemo(() => {
    if (!doctorId) return [];

    const q = query.toLowerCase();

    // STEP 1: Filter by doctor + branch
    let list = patients
      .filter((p) =>
        p.registrations.some(
          (r) => r.branchId === selectedBranch && r.doctorId === doctorId
        )
      )
      .map((p) => {
        const reg = p.registrations.find(
          (r) => r.branchId === selectedBranch && r.doctorId === doctorId
        );
        return { ...p, reg };
      });

    // STEP 2: Apply search + ABHA + gender filters
    list = list.filter(({ demographics, reg }) => {
      const matchesQuery =
        !q ||
        demographics.name.toLowerCase().includes(q) ||
        demographics.uhid.toLowerCase().includes(q) ||
        demographics.phone.toLowerCase().includes(q) ||
        (demographics.abhaNumber || "").toLowerCase().includes(q) ||
        (demographics.abhaAddress || "").toLowerCase().includes(q);

      const matchesAbha =
        filterType === "all"
          ? true
          : filterType === "abha"
          ? !!demographics.abhaNumber
          : !demographics.abhaNumber;

      const matchesGender =
        gender === "All"
          ? true
          : demographics.gender.toLowerCase() === gender.toLowerCase();

      return matchesQuery && matchesAbha && matchesGender;
    });

    // STEP 3: Sorting

    if (sortBy === "registrationDate") {
      list.sort(
        (a, b) =>
          new Date(b.reg!.registrationDate).getTime() -
          new Date(a.reg!.registrationDate).getTime()
      );
    } else if (sortBy === "lastVisitDate") {
      list.sort(
        (a, b) =>
          new Date(b.reg!.lastVisitDate || 0).getTime() -
          new Date(a.reg!.lastVisitDate || 0).getTime()
      );
    }

    return list;
  }, [patients, query, filterType, gender, sortBy, selectedBranch, doctorId]);

  /* ---------------------- Menu actions ---------------------- */
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
              onChange: (v) => setFilterType(v as any),
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
              filtered.map((p) => {
                const d = p.demographics;
                const reg = p.reg!;
                if (!reg) return null;

                const daysDiff =
                  (Date.now() - new Date(reg.registrationDate).getTime()) /
                  (1000 * 60 * 60 * 24);

                return (
                  <tr
                    key={p.patientId}
                    className="border-t border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="p-2">{d.uhid}</td>

                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[--text-highlight] font-semibold">
                          {d.name}
                        </span>

                        {daysDiff <= 7 && (
                          <span className="bg-[var(--secondary)] text-white text-[10px] font-semibold px-2 py-[1px] rounded-full">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500">
                        {d.age} yrs • {d.gender}
                      </div>
                    </td>

                    <td className="p-2">{d.phone}</td>

                    <td className="p-2">
                      {d.abhaNumber ? (
                        <>
                          <div className="font-semibold text-sm">
                            {d.abhaNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {d.abhaAddress}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          — Not Linked —
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      {reg!.lastVisitDate ? (
                        <>
                          <div>{reg!.lastVisitDate}</div>
                          <div className="text-xs text-gray-500">
                            {reg!.lastVisitType}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">—</div>
                      )}
                    </td>

                    <td className="p-2">{reg.registrationDate}</td>

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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Action Menu ---------- */}
      {anchorEl && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-md w-36"
          style={{
            top: anchorEl.getBoundingClientRect().bottom + 8,
            left: anchorEl.getBoundingClientRect().left,
          }}
        >
          {["Details", "Upload", "ABHA", "Appointment"].map((label) => (
            <button
              key={label}
              onClick={() => {
                closeMenu();

                if (label === "Details" && selectedPatient) {
                  router.push(
                    `/patient/patientlist/${selectedPatient.patientId}`
                  );
                } else if (label === "Upload") {
                  setShowUpload(true);
                } else {
                  alert(`${label} clicked`);
                }
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
                alt="QR"
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
            ? {
                name: selectedPatient.demographics.name,
                uhid: selectedPatient.demographics.uhid,
              }
            : undefined
        }
        onUpload={(formData) => {
          console.log("Uploaded:", Object.fromEntries(formData));
        }}
      />
    </div>
  );
}
