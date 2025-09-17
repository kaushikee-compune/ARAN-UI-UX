"use client";

import React, { useState, useEffect } from "react";
import { UserIcon, MapPinIcon, HeartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import FloatingActionMenu from "@/components/FloatingActionMenu";
import AbhaRegistrationPage from "../abharegistration/page";

/* ---------------- Types ---------------- */
type PatientForm = {
  phone: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  gender: string;
  dob: string;
  age: string;
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

export default function RegisterPatientPage() {
  const router = useRouter();

  /* State */
  const [tab, setTab] = useState<"registration" | "abha" | "abhascan">("registration");
  const [uhid, setUhid] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [abhaMode, setAbhaMode] = useState<"create" | "verify">("verify");

  const [form, setForm] = useState<PatientForm>({
    phone: "",
    firstName: "",
    middleName: "",
    lastName: "",
    fullName: "",
    gender: "",
    dob: "",
    age: "",
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

  /* --- Auto full name --- */
  useEffect(() => {
    const full = [form.firstName, form.middleName, form.lastName]
      .filter(Boolean)
      .join(" ");
    setForm((f) => ({ ...f, fullName: full }));
  }, [form.firstName, form.middleName, form.lastName]);

  /* --- Auto age from DOB --- */
  useEffect(() => {
    if (!form.dob) return;
    const dobDate = new Date(form.dob);
    const diff = Date.now() - dobDate.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    setForm((f) => ({ ...f, age: String(age) }));
  }, [form.dob]);

  /* --- Fake pincode lookup --- */
  useEffect(() => {
    if (form.pincode.length === 6) {
      setForm((f) => ({
        ...f,
        city: "Bangalore",
        state: "Karnataka",
      }));
    }
  }, [form.pincode]);

  const update = (patch: Partial<PatientForm>) =>
    setForm((f) => ({ ...f, ...patch }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUhid = "UHID-" + Math.floor(100000 + Math.random() * 900000);
    setUhid(newUhid);
    console.log("Register Patient:", form);
    setShowMenu(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setTab("registration")}
          className={`px-8 py-3 rounded-lg font-semibold text-sm ${
            tab === "registration"
              ? "bg-[#02066b] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Registration
        </button>
        <button
          onClick={() => setTab("abha")}
          className={`px-8 py-3 rounded-lg font-semibold text-sm ${
            tab === "abha"
              ? "bg-[#02066b] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Registration with ABHA
        </button>
         <button
          onClick={() => setShowQR(true)}
          className={`px-8 py-3 rounded-lg font-semibold text-sm ${
            tab === "abhascan"
              ? "bg-[#02066b] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Scan Desk
        </button>
      </div>

      {/* Registration Tab */}
      {tab === "registration" && (
        <form onSubmit={onSubmit} className="space-y-6">
          <h1 className="text-lg font-semibold mb-4">Register New Patient</h1>

          {/* Group 1: Personal Details */}
          <div className="ui-card p-4 space-y-2 !bg-orange-50">
            <UserIcon className="w-5 h-5 text-orange-500" />
            <LabeledInput
              label="Phone"
              value={form.phone}
              onChange={(v) => update({ phone: v })}
              placeholder="Search existing / enter new"
            />
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
                <label className="text-[11px] text-gray-600">Gender</label>
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
                label="Date of Birth"
                type="date"
                value={form.dob}
                onChange={(v) => update({ dob: v })}
              />
              <LabeledInput label="Age" value={form.age} readOnly />
            </div>
          </div>

          {/* Group 2: Contact + Address */}
          <div className="ui-card p-4 space-y-2 !bg-purple-50">
            <MapPinIcon className="w-5 h-5 text-purple-500" />
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
              <LabeledInput label="City" value={form.city} readOnly />
              <LabeledInput label="State" value={form.state} readOnly />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <LabeledInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => update({ email: v })}
              />
              <div className="grid md:grid-cols-2 gap-3">
                <LabeledInput
                  label="Emergency Contact Person"
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
          </div>

          {/* Group 3: Medical + Insurance */}
          <div className="ui-card p-2 space-y-2 !bg-green-50">
            <HeartIcon className="w-5 h-5 text-green-500" />
            <div className="grid md:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-[11px] text-gray-600">Blood Group</label>
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
            <div className="grid md:grid-cols-2 gap-3">
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
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => update({ consent: e.target.checked })}
              />
              I consent to the use of my data for treatment and record keeping
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border rounded-md bg-[#02066b] text-white hover:bg-[#1a1f91]"
            >
              Register Patient
            </button>
          </div>
        </form>
      )}

      {/* ABHA Registration Tab */}
      {tab === "abha" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            {/* <h1 className="text-lg font-semibold">
              Register Patient with ABHA
            </h1> */}
            {/* <button
              type="button"
              onClick={() => setShowQR(true)}
              className="px-4 py-2 rounded-md bg-[#02066b] text-white hover:bg-[#1a1f91] text-sm font-medium"
            >
              Scan ABHA QR
            </button> */}
          </div>

          {/* ABHA options */}
          <div className="flex gap-6 mb-4 pl-8 justify-center">
  <label className="inline-flex items-center gap-2">
    <input
      type="radio"
      checked={abhaMode === "create"}
      onChange={() => setAbhaMode("create")}
    />
    Create ABHA
  </label>
  <label className="inline-flex items-center gap-2">
    <input
      type="radio"
      checked={abhaMode === "verify"}
      onChange={() => setAbhaMode("verify")}
    />
    Verify ABHA
  </label>
</div>

          {/* Mode-specific content */}
          {abhaMode === "verify" && (
            <div className="ui-card p-4 space-y-3 bg-blue-50">
              <LabeledInput label="ABHA Number" value="" onChange={() => {}} />
              <LabeledInput label="ABHA Address" value="" onChange={() => {}} />
              <p className="text-xs text-gray-500">
                After verifying ABHA, demographics will auto-fill.
              </p>
            </div>
          )}

          {abhaMode === "create" && (
            <>
              {/* Full ABHA wizard mounted here */}
              <AbhaRegistrationPage />
            </>
          )}
        </div>
      )}

      {/* Scan ABHA Tab */}

      {/* {tab === "abha" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-semibold">
              SCAN Desk
            </h1>
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="px-4 py-2 rounded-md bg-[#02066b] text-white hover:bg-[#1a1f91] text-sm font-medium"
            >
              Scan ABHA QR
            </button>
          </div>        
          
        </div>
      )} */}



      {/* FloatingActionMenu */}
      {showMenu && uhid && (
        <FloatingActionMenu
          role="staff"
          uhid={uhid}
          onClose={() => setShowMenu(false)}
          onAction={(action) => {
            if (action === "rx") router.push("/doctor/console");
            if (action === "appointment") router.push("/doctor/appointments");
            if (action === "payment") router.push("/billing");
            if (action === "upload") router.push("/patients/upload");
            if (action === "emergency") router.push("/emergency");
          }}
        />
      )}

      {/* Scan Desk QR Modal */}
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
    </div>
  );
}

/* ---------------- Shared small UI ---------------- */
function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-[12px] text-gray-600">{label}</label>
      <input
        className="ui-input w-full min-w-0"
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
}
