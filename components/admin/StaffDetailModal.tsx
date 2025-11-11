"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Pencil,
  Mail,
  Phone,
  UserCircle2,
  Briefcase,
  Building2,
  Save,
} from "lucide-react";
import type { Staff } from "@/types/staff";

type StaffWithMultiDept = Staff & {
  departments?: string[];
  department?: string;
};

type Props = {
  open: boolean;
  staff: StaffWithMultiDept | null;
  onClose: () => void;
  onUpdate?: (updated: StaffWithMultiDept) => void;
};

export default function StaffDetailModal({
  open,
  staff,
  onClose,
  onUpdate,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<StaffWithMultiDept | null>(staff);

  // always run hooks before returns
  useEffect(() => {
    setForm(staff);
  }, [staff]);

  if (!open || !staff) return null;

  const handleChange = (field: keyof StaffWithMultiDept, value: string) => {
    if (!form) return;
    setForm({ ...form, [field]: value });
  };

  const handleDeptChange = (index: number, value: string) => {
    if (!form) return;
    const newDepts = [...(form.departments || [])];
    newDepts[index] = value;
    setForm({ ...form, departments: newDepts });
  };

  const handleSave = () => {
    if (!form) return;
    console.log("✅ Updated Staff Record:", form); // 👈 log updated info
    if (onUpdate) onUpdate(form);
    setEditMode(false);
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

        {/* Header (read-only) */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <UserCircle2 size={40} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{staff.name}</h2>
            <p className="text-sm text-gray-600">
              {staff.role}{" "}
              {staff.departments?.length
                ? `– ${staff.departments.join(", ")}`
                : staff.department
                ? `– ${staff.department}`
                : ""}
            </p>
            <p className="text-xs text-gray-500">ID: {staff.id}</p>
          </div>
        </div>

        <hr />

        {/* Header bar with edit/save icon */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Staff Details</h3>
          {editMode ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 text-[--primary] hover:opacity-80"
              title="Save changes"
            >
              <Save size={16} />
              <span className="text-sm">Save</span>
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="text-gray-500 hover:text-gray-700"
              title="Edit"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>

        {/* Detail fields */}
        <div className="space-y-3">
          {/* Email */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Mail size={15} className="text-gray-500" />
            {editMode ? (
              <input
                type="email"
                className="ui-input flex-1"
                value={form?.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            ) : (
              staff.email
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone size={15} className="text-gray-500" />
            {editMode ? (
              <input
                type="text"
                className="ui-input flex-1"
                value={form?.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            ) : (
              staff.phone
            )}
          </div>

          {/* Departments (two editable lines) */}
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <Briefcase size={15} className="text-gray-500 mt-1" />
            <div className="flex flex-col gap-2 w-full">
              {editMode ? (
                <>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Department ${i + 1}`}
                      className="ui-input"
                      value={form?.departments?.[i] || ""}
                      onChange={(e) => handleDeptChange(i, e.target.value)}
                    />
                  ))}
                </>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {(staff.departments || [staff.department || ""]).map(
                    (d, i) =>
                      d && (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-gray-100 rounded-full text-gray-700"
                        >
                          {d}
                        </span>
                      )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Branch */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Building2 size={15} className="text-gray-500" />
            {staff.branch}
          </div>

          {/* Status */}
          <div className="text-xs text-gray-500 mt-2">
            Status:{" "}
            {staff.status === "active" ? (
              <span className="text-green-600 font-medium">Active</span>
            ) : (
              <span className="text-red-600 font-medium">Inactive</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
