"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import FloatingActionMenu from "@/components/FloatingActionMenu";
import patientsData from "@/public/data/patients.json"; // patient lookup JSON
import { useBranch } from "@/context/BranchContext"; // your branch context
import UploadModal from "@/components/common/UploadModal";
import PatientTabRail from "@/components/patient/PatientTabRail";

/* -------------------------------- Types ------------------------------- */
type PatientJSON = {
  patientId: string;
  demographics: {
    name: string;
    phone: string;
    dob: string;
    age: number;
    gender: string;
    uhid: string;
    abhaNumber: string | null;
    abhaAddress: string | null;
  };
  registrations: {
    branchId: string;
    doctorId: string;
    registrationDate: string;
    lastVisitDate: string;
    lastVisitType: string;
  }[];
};

type PatientForm = {
  phone: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  gender: string;
  dob: string;
  age: string;
  abhaNumber: string;
  abhaAddress: string;
  pincode: string;
  city: string;
  state: string;
  address: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  allergy: string;
  ailments: string;
  medications: string;
  insuranceName: string;
  insuranceNumber: string;
  consent: boolean;
};

export default function RegistrationPage() {
  const router = useRouter();
  const { selectedBranch } = useBranch();

  /* ---------------------------- State ----------------------------- */
  const [tab, setTab] = useState<"registration" | "abha" | "scan">(
    "registration"
  );
  const [search, setSearch] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [showCreateAbhaModal, setShowCreateAbhaModal] = useState(false);
  const [foundPatient, setFoundPatient] = useState<PatientJSON | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [generatedUhid, setGeneratedUhid] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PatientJSON[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [form, setForm] = useState<PatientForm>({
    phone: "",
    firstName: "",
    middleName: "",
    lastName: "",
    fullName: "",
    gender: "",
    dob: "",
    age: "",
    abhaNumber: "",
    abhaAddress: "",
    pincode: "",
    city: "",
    state: "",
    address: "",
    email: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodGroup: "",
    allergy: "",
    ailments: "",
    medications: "",
    insuranceName: "",
    insuranceNumber: "",
    consent: false,
  });

  const update = (patch: Partial<PatientForm>) =>
    setForm((f) => ({ ...f, ...patch }));

  /* -------------------------- Auto Full Name -------------------------- */
  useEffect(() => {
    const full = [form.firstName, form.middleName, form.lastName]
      .filter(Boolean)
      .join(" ");
    // avoid infinite loop by not reusing fullName from form
    setForm((f) => ({ ...f, fullName: full }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.firstName, form.middleName, form.lastName]);

  /* -------------------------- Auto Age -------------------------- */
  useEffect(() => {
    if (!form.dob) return;
    const dobDate = new Date(form.dob);
    if (Number.isNaN(dobDate.getTime())) return;
    const diff = Date.now() - dobDate.getTime();
    const ageYears = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    setForm((f) => ({ ...f, age: String(ageYears) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dob]);

  /* -------------------------- Auto Pincode Lookup (mock) -------------------------- */
  useEffect(() => {
    if (form.pincode.length === 6) {
      setForm((f) => ({ ...f, city: "Bangalore", state: "Karnataka" }));
    }
  }, [form.pincode]);

  /* -------------------------- Search Logic -------------------------- */
  const handleSearch = () => {
    const q = search.trim().toLowerCase();
    if (!q) {
      toast.error("Enter phone / name / UHID to search");
      return;
    }

    const match: PatientJSON | undefined = (patientsData as PatientJSON[]).find(
      (p) => {
        return (
          p.demographics.phone === q ||
          p.demographics.uhid.toLowerCase() === q ||
          p.demographics.name.toLowerCase().includes(q)
        );
      }
    );

    if (!match) {
      // CASE 2 — Patient Not Found
      setShowCreateAbhaModal(true);
      return;
    }

    // CASE 1 — Patient Found
    setFoundPatient(match);

    const branches = Array.from(
      new Set(match.registrations.map((r) => r.branchId))
    );

    /* ---------------- 1A. Found in another branch ---------------- */
    if (selectedBranch && !branches.includes(selectedBranch)) {
      toast(`Patient is registered in another branch (${branches.join(", ")})`);

      console.log({
        message: "Adding new branch",
        oldBranches: branches,
        addedBranch: selectedBranch,
      });
    }

    /* ------------ 1B. abhaAddress = "ABHA" → Show ABHA modal ------------ */
    const abhaAddr = match.demographics.abhaAddress;
    if (abhaAddr === "ABHA") {
      setShowAbhaModal(true);
    }

    /* ------------ 1C / 1D — Auto-fill always ------------ */
    autoFillForm(match);
  };

  const autoFillForm = (p: PatientJSON) => {
    const parts = p.demographics.name.split(" ");
    const fn = parts[0] || "";
    const ln = parts.length > 1 ? parts[parts.length - 1] : "";
    const mn =
      parts.length > 2 ? parts.slice(1, parts.length - 1).join(" ") : "";

    setForm((f) => ({
      ...f,
      firstName: fn,
      middleName: mn,
      lastName: ln,
      gender: p.demographics.gender,
      dob: p.demographics.dob,
      age: String(p.demographics.age),
      phone: p.demographics.phone,
      abhaNumber: p.demographics.abhaNumber || "",
      abhaAddress: p.demographics.abhaAddress || "",
    }));
  };

  /* -------------------------- Submit Logic -------------------------- */
  const generateUHID = () => {
    const branch = selectedBranch || "B001";
    const count = (patientsData as PatientJSON[]).length + 1;
    return `CH-${branch}-${String(count).padStart(6, "0")}`;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone) {
      toast.error("Phone number is mandatory");
      return;
    }
    if (!form.consent) {
      toast.error("Please provide consent");
      return;
    }

    const newUhid = generateUHID();
    setGeneratedUhid(newUhid);

    toast.success(`Registered. UHID: ${newUhid}`);

    console.log("Registered Patient:", {
      ...form,
      uhid: newUhid,
      branchId: selectedBranch,
      date: new Date().toISOString(),
    });

    setShowMenu(true);
  };

  /* -------------------------------------------------------------------- */

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">

      
      {/* ------------------ Tabs ------------------ */}
      {/* ⭐ COMMON TAB RAIL HERE ⭐ */}
      <PatientTabRail />
      {/* <div className="flex justify-center gap-4 mb-4">
        <button
          className={`px-6 py-2 rounded-md text-sm font-semibold ${
            tab === "registration" ? "bg-[#450693] text-white" : "bg-gray-100"
          }`}
          onClick={() => setTab("registration")}
        >
          Registration
        </button>

        <button
          className={`px-6 py-2 rounded-md text-sm font-semibold ${
            tab === "abha" ? "bg-gray-900 text-white" : "bg-gray-100"
          }`}
          onClick={() => router.push("/patient/abhaverification")}
        >
          Registration with ABHA
        </button>

        <button
          className={`px-6 py-2 rounded-md text-sm font-semibold ${
            tab === "scan" ? "bg-gray-900 text-white" : "bg-gray-100"
          }`}
          onClick={() => {
            setTab("scan");
            setShowQR(true);
          }}
        >
          Scan Desk
        </button>
      </div> */}

      {/* ---------------- Search Box ---------------- */}
      <div className="ui-card p-4 relative z-[50]">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);
              if (v.length >= 2) {
                const q = v.toLowerCase();
                const matches = (patientsData as PatientJSON[])
                  .filter((p) => {
                    return (
                      p.demographics.phone.includes(q) ||
                      p.demographics.name.toLowerCase().includes(q) ||
                      p.demographics.uhid.toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 8);

                setSuggestions(matches);
                setShowSuggestions(matches.length > 0);
                setHighlightIndex(-1); // reset selection
              } else {
                setShowSuggestions(false);
                setHighlightIndex(-1);
              }
            }}
            onKeyDown={(e) => {
              if (!showSuggestions || suggestions.length === 0) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIndex((prev) =>
                  prev < suggestions.length - 1 ? prev + 1 : 0
                );
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIndex((prev) =>
                  prev > 0 ? prev - 1 : suggestions.length - 1
                );
              }

              if (e.key === "Enter" && highlightIndex >= 0) {
                e.preventDefault();
                const selected = suggestions[highlightIndex];
                setSearch(selected.demographics.phone);
                setShowSuggestions(false);
                setTimeout(() => handleSearch(), 100);
              }

              if (e.key === "Escape") {
                setShowSuggestions(false);
                setHighlightIndex(-1);
              }
            }}
            placeholder="Search by Phone / Name / UHID"
            className="ui-input flex-1"
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 150);
            }}
          />

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-900 text-white rounded-md"
          >
            Search
          </button>
        </div>

        {/* ---------- Suggestion Dropdown ---------- */}
        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-[9999] max-h-56 overflow-y-auto">
            {suggestions.map((p) => (
              <button
                key={p.patientId}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => {
                  setSearch(p.demographics.phone); // or name/uhid
                  setShowSuggestions(false);
                  setTimeout(() => handleSearch(), 100);
                }}
              >
                <div className="font-medium">{p.demographics.name}</div>
                <div className="text-xs text-gray-600">
                  {p.demographics.phone} • {p.demographics.uhid}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- Registration Form ---------------- */}
      <form onSubmit={handleRegister} className="space-y-6">
        {/* PERSONAL DETAILS */}
        <div className="ui-card p-4 space-y-3 overflow-visible">
          <div className="grid md:grid-cols-4 gap-3">
            <LabeledInput
              label="First Name"
              value={form.firstName}
              onChange={(v) => update({ firstName: v })}
            />
            <LabeledInput
              label="Middle Name"
              value={form.middleName}
              onChange={(v) => update({ middleName: v })}
            />
            <LabeledInput
              label="Last Name"
              value={form.lastName}
              onChange={(v) => update({ lastName: v })}
            />
            <LabeledInput label="Full Name" value={form.fullName} readOnly />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-gray-600">Gender</label>
              <select
                className="ui-input"
                value={form.gender}
                onChange={(e) => update({ gender: e.target.value })}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <LabeledInput
              type="date"
              label="DOB"
              value={form.dob}
              max={new Date().toISOString().split("T")[0]} // ⬅ PATCH
              onChange={(v) => update({ dob: v })}
            />

            <LabeledInput label="Age" value={form.age} readOnly />
          </div>
        </div>

        {/* ABHA DETAILS */}
        <div className="ui-card p-4 space-y-3">
          <LabeledInput
            label="ABHA Number"
            value={form.abhaNumber}
            onChange={(v) => update({ abhaNumber: v })}
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <LabeledInput
                label="ABHA Address"
                value={form.abhaAddress}
                onChange={(v) => update({ abhaAddress: v })}
              />
            </div>
            {form.abhaAddress && (
              <span className="px-2 py-1 rounded bg-yellow-200 text-yellow-800 text-xs mb-[2px]">
                ABHA Found
              </span>
            )}
          </div>
        </div>

        {/* CONTACT */}
        <div className="ui-card p-4 space-y-3">
          <LabeledInput
            label="Phone"
            value={form.phone}
            onChange={(v) => update({ phone: v })}
          />
          <LabeledInput
            label="Email"
            value={form.email}
            onChange={(v) => update({ email: v })}
          />
          <div className="grid md:grid-cols-2 gap-3">
            <LabeledInput
              label="Emergency Contact"
              value={form.emergencyContactName}
              onChange={(v) => update({ emergencyContactName: v })}
            />
            <LabeledInput
              label="Emergency Phone"
              value={form.emergencyContactPhone}
              onChange={(v) => update({ emergencyContactPhone: v })}
            />
          </div>
        </div>

        {/* ADDRESS */}
        <div className="ui-card p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <LabeledInput
              label="Pincode"
              value={form.pincode}
              onChange={(v) => update({ pincode: v })}
            />
            <LabeledInput
              label="House No / Street"
              value={form.address}
              onChange={(v) => update({ address: v })}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <LabeledInput label="City" value={form.city} readOnly />
            <LabeledInput label="State" value={form.state} readOnly />
          </div>
        </div>

        {/* MEDICAL */}
        <div className="ui-card p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-gray-600">Blood Group</label>
              <select
                className="ui-input"
                value={form.bloodGroup}
                onChange={(e) => update({ bloodGroup: e.target.value })}
              >
                <option value="">Select</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>

            <LabeledInput
              label="Allergy"
              value={form.allergy}
              onChange={(v) => update({ allergy: v })}
            />
            <LabeledInput
              label="Known Ailments"
              value={form.ailments}
              onChange={(v) => update({ ailments: v })}
            />
            <LabeledInput
              label="Medications On"
              value={form.medications}
              onChange={(v) => update({ medications: v })}
            />
          </div>
        </div>

        {/* INSURANCE */}
        <div className="ui-card p-4 space-y-3">
          <LabeledInput
            label="Insurance Name"
            value={form.insuranceName}
            onChange={(v) => update({ insuranceName: v })}
          />
          <LabeledInput
            label="Insurance Number"
            value={form.insuranceNumber}
            onChange={(v) => update({ insuranceNumber: v })}
          />
        </div>

        {/* CONSENT */}
        <div className="ui-card p-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => update({ consent: e.target.checked })}
            />
            I consent to the use of my data for treatment and record keeping.
          </label>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button type="button" className="px-4 py-2 border rounded-md">
            Cancel
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-md"
          >
            Register Patient
          </button>
        </div>
      </form>

      {/* ---------------- Floating Action Menu ---------------- */}
      {showMenu && generatedUhid && (
        <FloatingActionMenu
          role="staff"
          uhid={generatedUhid}
          onClose={() => setShowMenu(false)}
          onAction={(action) => {
            if (action === "rx") router.push("/doctor/console");
            if (action === "appointment") router.push("/appointments");
            if (action === "payment") router.push("/billing");
            if (action === "upload") setShowUploadModal(true);
            // if (action === "emergency") router.push("/emergency");
          }}
        />
      )}

      {/* ---------------- Scan QR Modal ---------------- */}
      {showQR && (
        <Modal onClose={() => setShowQR(false)}>
          <div className="flex justify-center mb-4">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ABHA-DEMO-PLACEHOLDER"
              alt="ABHA QR Code"
              className="rounded-lg border"
            />
          </div>
          <h2 className="font-semibold text-lg text-center mt-1">
            ABHA QR Code
          </h2>
          <p className="text-sm text-gray-600 text-center mt-1">
            Scan this QR code with the ABHA app to share patient profile
          </p>
        </Modal>
      )}

      {/* ---------------- ABHA Modal ---------------- */}
      {showAbhaModal && (
        <Modal onClose={() => setShowAbhaModal(false)}>
          <p className="text-center">
            You have ABHA card. Do you want to register using ABHA Health ID?
          </p>
          <div className="flex justify-center mt-4 gap-3">
            <button
              className="px-4 py-2 bg-gray-900 text-white rounded-md"
              onClick={() => router.push("/patient/abharegistration")}
            >
              Yes
            </button>
            <button
              className="px-4 py-2 border rounded-md"
              onClick={() => setShowAbhaModal(false)}
            >
              No
            </button>
          </div>
        </Modal>
      )}

      {/* ---------------- Create ABHA Modal ---------------- */}
      {showCreateAbhaModal && (
        <Modal onClose={() => setShowCreateAbhaModal(false)}>
          <p className="text-center">
            Patient not found. Do you want to create ABHA Health ID?
          </p>
          <div className="flex justify-center mt-4 gap-3">
            <button
              className="px-4 py-2 bg-gray-900 text-white rounded-md"
              onClick={() => router.push("/patient/abharegistration")}
            >
              Yes
            </button>
            <button
              className="px-4 py-2 border rounded-md"
              onClick={() => setShowCreateAbhaModal(false)}
            >
              No
            </button>
          </div>
        </Modal>
      )}

      {showUploadModal && (
        <UploadModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={(formData) => {
            console.log(
              "Uploaded file:",
              Object.fromEntries(formData.entries())
            );
            toast.success("Document uploaded!");
          }}
          patient={
            generatedUhid
              ? { name: form.fullName || form.firstName, uhid: generatedUhid }
              : undefined
          }
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  readOnly,
  max,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  readOnly?: boolean;
  max?: string; // ⬅ NEW
}) {
  return (
    <div className="grid gap-1">
      <label className="text-xs text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        max={max} // ⬅ PATCH ADDED
        className="ui-input w-full"
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[360px] relative shadow-lg">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
