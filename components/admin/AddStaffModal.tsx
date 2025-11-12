"use client";

import React, { useEffect, useState } from "react";
import { X, Save, UserPlus, Mail } from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import type { Staff } from "@/types/staff";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (newStaff: Staff) => void;
};

export default function AddStaffModal({ open, onClose, onSave }: Props) {
  const { selectedBranch } = useBranch();

  const [departments, setDepartments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // independent state variables
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<Staff["role"] | "">("");
  const [consultationFee, setConsultationFee] = useState("");

  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await fetch("/data/departments-eye.json");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (Array.isArray(data)) setDepartments(data);
        else if (Array.isArray(data.departments)) setDepartments(data.departments);
      } catch (err) {
        console.error("Error loading departments:", err);
      }
    }
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!open) {
      setName("");
      setPhone("");
      setEmail("");
      setDepartment("");
      setRole("");
      setConsultationFee("");
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    if (!name || !phone || !email || !department || !role) {
      alert("Please fill all required fields.");
      return;
    }

    const branchName =
      typeof selectedBranch === "object" && selectedBranch
        ? (selectedBranch as any).name ?? ""
        : (selectedBranch as string);

    const newStaff: Staff = {
      id: `stf${Math.floor(Math.random() * 9000 + 1000)}`,
      name,
      role: role as Staff["role"],
      department,
      branch: branchName,
      email,
      phone,
      consultationFee: consultationFee ? Number(consultationFee) : undefined,
      // 🔸 Mark as inactive by default
      status: "inactive",
    };

    console.log("🆕 Staff Added (inactive):", newStaff);
    console.log(`📧 Invitation sent to ${email}`);

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave(newStaff);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="ui-card w-[min(95vw,500px)] relative p-6 space-y-4 shadow-xl">
        {/* Close */}
        <button
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2">
          <UserPlus size={20} className="text-[--primary]" />
          <h2 className="text-lg font-semibold">Add New Staff</h2>
        </div>

        <hr />

        {/* Fields */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            className="ui-input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone Number"
            className="ui-input w-full"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email Address"
            className="ui-input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <select
            className="ui-input w-full"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="ui-input w-full"
            value={role}
            onChange={(e) => setRole(e.target.value as Staff["role"])}
          >
            <option value="">Select Role</option>
            <option>Doctor</option>
            <option>Nurse</option>
            <option>Branch Admin</option>
            <option>Clinic Admin</option>
          </select>

          <input
            type="number"
            placeholder="Consultation Fee (₹)"
            className="ui-input w-full"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
          />

          {/* Branch Info */}
          <div className="text-sm text-gray-600">
            Branch:{" "}
            <span className="font-medium">
              {typeof selectedBranch === "object" && selectedBranch
                ? (selectedBranch as any).name
                : (selectedBranch as string)}
            </span>
          </div>

          <div className="text-xs text-gray-500">
            Status: Inactive (Invite Pending)
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-1"
          >
            <Mail size={16} />
            {saving ? "Sending..." : "Save & Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
