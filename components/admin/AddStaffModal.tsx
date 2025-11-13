"use client";

import React, { useEffect, useState } from "react";
import { X, Mail, UserPlus } from "lucide-react";
import { useBranch } from "@/context/BranchContext";
import type { Staff } from "@/types/staff";
import { useRoles } from "@/hooks/useRoles";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (newStaff: Staff) => void;
};

export default function AddStaffModal({ open, onClose, onSave }: Props) {
  const { selectedBranch } = useBranch();
  const { roles, loading } = useRoles();

  const [departments, setDepartments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  type AddStaffFormData = {
    name: string;
    email: string;
    phone: string;
    department: string;
    consultationFee: string;
    role: string[]; // multiple roles
    status: string; // "inactive" | "active" | etc.
    signatureFile: File | null;
    registrationNumber: string;
  };

  // ✅ single unified form state
  const [formData, setFormData] = useState<AddStaffFormData>({
    name: "",
    email: "",
    phone: "",
    department: "",
    consultationFee: "",
    role: [],
    status: "inactive",
    signatureFile: null,
    registrationNumber: "",
  });

  /* ----------------------------- Load Departments ---------------------------- */
  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await fetch("/data/departments-eye.json");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (Array.isArray(data)) setDepartments(data);
        else if (Array.isArray(data.departments))
          setDepartments(data.departments);
      } catch (err) {
        console.error("Error loading departments:", err);
      }
    }
    loadDepartments();
  }, []);

  /* ----------------------------- Reset on Close ------------------------------ */
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        department: "",
        consultationFee: "",
        role: [],
        status: "inactive",
        signatureFile: null,
        registrationNumber: "",
      });
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  /* ----------------------------- Save Handler ----------------------------- */
  const handleSave = () => {
    console.log("FormData roles =", formData.role);

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim() ||
      !formData.department.trim() ||
      formData.role.length === 0
    ) {
      alert("Please fill all required fields and assign at least one role.");
      return;
    }

    const branchName =
      typeof selectedBranch === "object" && selectedBranch
        ? (selectedBranch as any).name ?? ""
        : (selectedBranch as string);

    const newStaff: Staff = {
      id: `stf${Math.floor(Math.random() * 9000 + 1000)}`,
      name: formData.name,
      role: formData.role as Staff["role"],
      department: formData.department,
      branch: branchName,
      email: formData.email,
      phone: formData.phone,
      consultationFee: formData.consultationFee
        ? Number(formData.consultationFee)
        : undefined,
      status: "inactive",
    };

    console.log("🆕 Staff Added (inactive):", newStaff);
    console.log(`📧 Invitation sent to ${formData.email}`);

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave(newStaff);
      onClose();
    }, 600);
  };

  /* ----------------------------- Render Modal ----------------------------- */
 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

    {/* Modal Container */}
    <div className="ui-card relative w-[95vw] max-w-[650px] max-h-[90vh] shadow-xl flex flex-col">

      {/* Close Button */}
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        <X size={20} />
      </button>

      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex items-center gap-2">
        <UserPlus size={22} className="text-[--primary]" />
        <h2 className="text-lg font-semibold">Add New Staff</h2>
      </div>

      <hr />

      {/* Body (Scrollable) */}
      <div className="px-6 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: "65vh" }}>

        {/* Name */}
        <input
          type="text"
          placeholder="Full Name"
          className="ui-input w-full"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        {/* Phone */}
        <input
          type="text"
          placeholder="Phone Number"
          className="ui-input w-full"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email Address"
          className="ui-input w-full"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        {/* Department */}
        <select
          className="ui-input w-full"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Roles */}
        <div>
          <label className="block text-sm font-medium mb-1">Assign Roles</label>

          {loading ? (
            <div className="text-xs text-gray-500">Loading roles…</div>
          ) : (
            <div className="grid grid-cols-2 gap-y-1">
              {roles.map((r) => (
                <label key={r.id} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="ui-checkbox"
                    checked={formData.role.includes(r.name)}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updated = e.target.checked
                          ? [...prev.role, r.name]
                          : prev.role.filter((x) => x !== r.name);
                        return { ...prev, role: updated };
                      })
                    }
                  />
                  <span>{r.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Consultation Fee */}
        <input
          type="number"
          placeholder="Consultation Fee (₹)"
          className="ui-input w-full"
          value={formData.consultationFee}
          onChange={(e) =>
            setFormData({ ...formData, consultationFee: e.target.value })
          }
        />

        {/* Signature + Registration */}
        <div className="flex flex-col sm:flex-row gap-4">
          
          {/* Signature Upload */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Upload Doctor's Signature
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              className="ui-input w-full"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!["image/png", "image/jpeg"].includes(file.type)) {
                  alert("Only PNG or JPG files allowed.");
                  e.target.value = "";
                  return;
                }
                if (file.size > 20 * 1024) {
                  alert("File must be less than 20 KB.");
                  e.target.value = "";
                  return;
                }

                setFormData((prev) => ({ ...prev, signatureFile: file }));
              }}
            />

            <p className="text-xs text-gray-500 mt-1">
              PNG or JPG • Max 20 KB
            </p>

            {formData.signatureFile && (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(formData.signatureFile)}
                  alt="Signature preview"
                  className="h-12 border rounded p-1 bg-white"
                />
              </div>
            )}
          </div>

          {/* Registration Number */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Registration Number
            </label>
            <input
              type="text"
              className="ui-input w-full"
              placeholder="Enter registration number"
              value={formData.registrationNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  registrationNumber: e.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* Branch Info */}
        <div className="text-sm text-gray-600">
            Branch:{" "}
            <span className="font-medium">
              {typeof selectedBranch === "object" && selectedBranch
                ? selectedBranch.name
                : (selectedBranch as string)}
            </span>
          </div>

          <div className="text-xs text-gray-500">
            Status: Inactive (Invite Pending)
          </div>
        </div>


      {/* Footer */}
      <div className="px-6 py-4 flex justify-end gap-3 border-t">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={
            saving ||
            !formData.name.trim() ||
            !formData.phone.trim() ||
            !formData.email.trim() ||
            !formData.department.trim() ||
            formData.role.length === 0
          }
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