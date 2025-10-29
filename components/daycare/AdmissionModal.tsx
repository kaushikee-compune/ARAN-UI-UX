"use client";

import React, { useState } from "react";

/* ---------- Types ---------- */
export type Bed = {
  bedId: string;
  label: string;
  status: "vacant" | "occupied" | "discharged";
};

export type DaycarePatient = {
  id: string;
  name: string;
  age: string;
  gender: string;
  doctor?: string;
  diagnosis?: string;
  admittedAt: string;
};

/* ---------- Props ---------- */
interface AdmissionModalProps {
  beds: Bed[];
  onAdmit: (bedId: string, patient: DaycarePatient) => void;
  onClose: () => void;
}

/* ---------- Component ---------- */
export default function AdmissionModal({
  beds,
  onAdmit,
  onClose,
}: AdmissionModalProps) {
  const [form, setForm] = useState({
    bedId: beds[0]?.bedId || "",
    name: "",
    age: "",
    gender: "",
    doctor: "",
    diagnosis: "",
  });

  const submit = () => {
    if (!form.bedId || !form.name) {
      alert("Please select a bed and enter patient name");
      return;
    }
    onAdmit(form.bedId, {
      id: Date.now().toString(),
      name: form.name,
      age: form.age,
      gender: form.gender,
      doctor: form.doctor,
      diagnosis: form.diagnosis,
      admittedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="ui-card w-[min(90vw,420px)] p-5 space-y-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Admit Patient
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="grid gap-3 text-sm">
          <div className="grid gap-1">
            <label className="text-[11px] text-gray-600">Bed</label>
            <select
              className="ui-input"
              value={form.bedId}
              onChange={(e) => setForm({ ...form, bedId: e.target.value })}
            >
              {beds.map((b) => (
                <option key={b.bedId} value={b.bedId}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-[11px] text-gray-600">Patient Name</label>
            <input
              className="ui-input"
              placeholder="Enter full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <label className="text-[11px] text-gray-600">Age</label>
              <input
                className="ui-input"
                placeholder="e.g. 45 yrs"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-[11px] text-gray-600">Gender</label>
              <select
                className="ui-input"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-[11px] text-gray-600">
              Consultant Doctor
            </label>
            <input
              className="ui-input"
              placeholder="Dr. Name"
              value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            />
          </div>

          <div className="grid gap-1">
            <label className="text-[11px] text-gray-600">
              Diagnosis / Reason
            </label>
            <textarea
              className="ui-textarea min-h-[70px]"
              placeholder="Enter diagnosis or reason for admission"
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-outline text-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary text-sm px-4" onClick={submit}>
            Admit
          </button>
        </div>
      </div>
    </div>
  );
}
