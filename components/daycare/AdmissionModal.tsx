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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-[min(90vw,420px)] p-5 space-y-3">
        <h2 className="text-base font-semibold">Admit Patient</h2>

        <div className="grid gap-2 text-sm">
          <label className="grid gap-1">
            <span className="text-xs text-gray-600">Bed</span>
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
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">Patient Name</span>
            <input
              className="ui-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-xs text-gray-600">Age</span>
              <input
                className="ui-input"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-gray-600">Gender</span>
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
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">Consultant Doctor</span>
            <input
              className="ui-input"
              value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">Diagnosis / Reason</span>
            <textarea
              className="ui-textarea min-h-[60px]"
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-outline text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-1.5 text-sm rounded bg-blue-400 text-black hover:opacity-90"
            onClick={submit}
          >
            Admit
          </button>
        </div>
      </div>
    </div>
  );
}
