"use client";

import React, { useEffect, useState } from "react";
import {
  getBranchDetail,
  type BranchDetail,
} from "@/lib/services/branchDetailService";

/* -------------------------------------------------------------------------- */
/*                               Type Definition                              */
/* -------------------------------------------------------------------------- */
export type BranchSetupPanelProps = {
  branchId: string; // required — passed from context/page
};

/* -------------------------------------------------------------------------- */
/*                                Main Component                              */
/* -------------------------------------------------------------------------- */
export default function BranchSetupPanel({ branchId }: BranchSetupPanelProps) {
  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [formData, setFormData] = useState<BranchDetail | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- Placeholder Reference Template ---------- */
  const initialTemplate: Partial<BranchDetail> = {
    branchLogo: "/icons/logo.png", // default logo path
    branchName: "Enter branch name…",
    address: "Enter full address…",
    phone: "Enter phone number…",
    email: "Enter email address…",
    hfrId: "Enter ABDM HFR ID…",
    departments: ["Department 1", "Department 2"],
    timings: "Add clinic working hours…",
    facilities: ["Facility 1", "Facility 2"],
  };

  /* ---------- Load data from JSON ---------- */
  useEffect(() => {
    if (!branchId) return; // safety guard
    setLoading(true);
    getBranchDetail(branchId)
      .then((data) => {
        setBranch(data);
        setFormData(data);
      })
      .catch((err) => console.error("Branch detail load error:", err))
      .finally(() => setLoading(false));
  }, [branchId]);

  /* ---------- Handlers ---------- */
  const handleChange = (key: keyof BranchDetail, value: any) =>
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleDone = () => {
    console.log("✅ Branch changes saved:", formData);
    setEditingField(null);
    // TODO: Replace console.log with writeToJson() or updateBranch API later
  };

  const handleFocusField = (key: keyof BranchDetail) => {
    if (!formData) return;
    const currentValue = formData[key];
    const templateValue = initialTemplate[key];
    if (typeof currentValue === "string" && currentValue === templateValue) {
      handleChange(key, "");
    }
  };

  const handleBlurField = (key: keyof BranchDetail) => {
    if (!formData) return;
    const currentValue = formData[key];
    const templateValue = initialTemplate[key];
    if (typeof currentValue === "string" && currentValue.trim() === "") {
      handleChange(key, templateValue || "");
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                                Render UI                               */
  /* ---------------------------------------------------------------------- */
  if (loading)
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        Loading branch details…
      </div>
    );

  if (!formData)
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        Branch data not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ---------- Floating Save Button ---------- */}
      {editingField && (
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={handleDone}
            className="btn-accent px-4 py-2 text-sm font-medium shadow-md"
          >
            Save Changes
          </button>
        </div>
      )}
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto space-y-10">
        {/* ---------- Header ---------- */}
        <section className="space-y-2">
          <div className="flex items-center justify-center gap-4 relative">
            {/* ---------- Logo with edit ---------- */}
            <div className="relative w-12 h-12 shrink-0">
              <img
                src={formData.branchLogo || "/icons/logo.png"}
                alt="Branch Logo"
                className="w-12 h-12 rounded-full shadow-sm  bg-white object-cover"
              />
              <button
                className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow hover:bg-gray-50"
                onClick={() => setEditingField("branchLogo")}
              >
                <PenIcon className="w-3.5 h-3.5 text-gray-600" />
              </button>
              {editingField === "branchLogo" && (
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      handleChange("branchLogo" as keyof BranchDetail, url);
                      setEditingField(null);
                    }
                  }}
                />
              )}
            </div>

            {/* ---------- Branch Name ---------- */}
            <div className="flex flex-col items-start text-left">
              <h1
                className="text-2xl font-semibold text-gray-900 cursor-pointer"
                onClick={() => setEditingField("branchName")}
              >
                {editingField === "branchName" ? (
                  <input
                    className="ui-input w-80 text-left"
                    value={formData.branchName}
                    onFocus={() => handleFocusField("branchName")}
                    onBlur={() => handleBlurField("branchName")}
                    onChange={(e) => handleChange("branchName", e.target.value)}
                  />
                ) : (
                  formData.branchName
                )}
              </h1>
              <p className="text-sm text-gray-600 italic">
                Clinic branch configuration and operational details
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Address & Contact ---------- */}
        <EditableSection
          title="Address & Contact"
          isEditing={editingField === "address"}
          onEdit={() => setEditingField("address")}
          onDone={handleDone}
        >
          {editingField === "address" ? (
            <div className="space-y-2">
              <textarea
                className="ui-textarea w-full text-sm"
                value={formData.address}
                onFocus={() => handleFocusField("address")}
                onBlur={() => handleBlurField("address")}
                onChange={(e) => handleChange("address", e.target.value)}
              />
              <input
                className="ui-input w-full text-sm"
                value={formData.phone}
                onFocus={() => handleFocusField("phone")}
                onBlur={() => handleBlurField("phone")}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              <input
                className="ui-input w-full text-sm"
                value={formData.email}
                onFocus={() => handleFocusField("email")}
                onBlur={() => handleBlurField("email")}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          ) : (
            <>
              <p className="text-gray-700">{formData.address}</p>
              <p className="text-gray-800 font-medium mt-1">
                📞 {formData.phone}
              </p>
              <p className="text-gray-600 text-sm">{formData.email}</p>
            </>
          )}
        </EditableSection>

        {/* ---------- HFR ID ---------- */}
        <EditableSection
          title="ABDM – HFR ID"
          isEditing={editingField === "hfrId"}
          onEdit={() => setEditingField("hfrId")}
          onDone={handleDone}
        >
          {editingField === "hfrId" ? (
            <input
              className="ui-input w-60"
              value={formData.hfrId}
              onFocus={() => handleFocusField("hfrId")}
              onBlur={() => handleBlurField("hfrId")}
              onChange={(e) => handleChange("hfrId", e.target.value)}
            />
          ) : (
            <p className="text-gray-700">{formData.hfrId}</p>
          )}
        </EditableSection>

        {/* ---------- Departments ---------- */}
        {/* ---------- Departments ---------- */}
        <EditableSection
          title="Departments"
          isEditing={editingField === "departments"}
          onEdit={() => setEditingField("departments")}
          onDone={handleDone}
        >
          {editingField === "departments" ? (
            <DynamicListEditor
              items={formData.departments}
              onChange={(updated) => handleChange("departments", updated)}
              placeholder="Add or select department"
              predefinedPath="/data/departments-eye.json"
            />
          ) : (
            <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
              {formData.departments.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </EditableSection>

        {/* ---------- Working Hours ---------- */}
        <EditableSection
          title="Open–Close Timings"
          isEditing={editingField === "timings"}
          onEdit={() => setEditingField("timings")}
          onDone={handleDone}
        >
          {editingField === "timings" ? (
            <WorkingHoursEditor
              formData={formData}
              handleChange={handleChange}
            />
          ) : (
            <WorkingHoursTable formData={formData} />
          )}
        </EditableSection>

        {/* ---------- Facilities ---------- */}
        {/* ---------- Facilities ---------- */}
        <EditableSection
          title="Key Facilities"
          isEditing={editingField === "facilities"}
          onEdit={() => setEditingField("facilities")}
          onDone={handleDone}
        >
          {editingField === "facilities" ? (
            <DynamicListEditor
              items={formData.facilities}
              onChange={(updated) => handleChange("facilities", updated)}
              placeholder="Add or select facility"
              predefinedPath="/data/facilities-eye.json"
            />
          ) : (
            <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
              {formData.facilities.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </EditableSection>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Working Hours Components                         */
/* -------------------------------------------------------------------------- */
function WorkingHoursEditor({
  formData,
  handleChange,
}: {
  formData: BranchDetail;
  handleChange: (key: keyof BranchDetail, value: any) => void;
}) {
  const [entry, setEntry] = useState({
    dayStart: "Monday",
    dayEnd: "Friday",
    openTime: "08:00",
    closeTime: "20:00",
  });

  const addEntry = () => {
    const newItem = { ...entry };
    const updated = Array.isArray((formData as any).workingHours)
      ? [...(formData as any).workingHours, newItem]
      : [newItem];
    handleChange("workingHours" as any, updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <select
          className="ui-input px-2 py-1 text-sm"
          value={entry.dayStart}
          onChange={(e) => setEntry({ ...entry, dayStart: e.target.value })}
        >
          {[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <span className="text-gray-500 text-sm">to</span>
        <select
          className="ui-input px-2 py-1 text-sm"
          value={entry.dayEnd}
          onChange={(e) => setEntry({ ...entry, dayEnd: e.target.value })}
        >
          {[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <input
          type="time"
          className="ui-input px-2 py-1 text-sm"
          value={entry.openTime}
          onChange={(e) => setEntry({ ...entry, openTime: e.target.value })}
        />
        <span className="text-gray-500 text-sm">to</span>
        <input
          type="time"
          className="ui-input px-2 py-1 text-sm"
          value={entry.closeTime}
          onChange={(e) => setEntry({ ...entry, closeTime: e.target.value })}
        />
        <button
          type="button"
          className="text-xs border px-3 py-1 rounded text-gray-700 hover:bg-gray-50"
          onClick={addEntry}
        >
          + Add
        </button>
      </div>
      <WorkingHoursTable formData={formData} />
    </div>
  );
}

function WorkingHoursTable({ formData }: { formData: BranchDetail }) {
  const hours = (formData as any).workingHours || [
    { dayStart: "Mon", dayEnd: "Fri", openTime: "08:00", closeTime: "20:00" },
    { dayStart: "Sat", dayEnd: "Sun", openTime: "08:00", closeTime: "14:00" },
  ];

  const formatTime = (time24: string): string => {
    const [h, m] = time24.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="text-left px-3 py-2">Days</th>
            <th className="text-left px-3 py-2">Timings</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((w: any, i: number) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2 text-gray-800">
                {w.dayStart} – {w.dayEnd}
              </td>
              <td className="px-3 py-2 text-gray-600">
                {formatTime(w.openTime)} – {formatTime(w.closeTime)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Shared Elements                             */
/* -------------------------------------------------------------------------- */
function EditableSection({
  title,
  isEditing,
  onEdit,
  onDone,
  children,
}: {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onDone: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 text-lg">{title}</h2>
        {isEditing ? (
          <button onClick={onDone}>
            <span className="text-xs text-blue-600 font-medium">Done</span>
          </button>
        ) : (
          <button onClick={onEdit}>
            <PenIcon className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* -------------------- Pen Icon -------------------- */
function PenIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
/* -------------------------------------------------------------------------- */
/*                         Dynamic List Editor (Reusable)                     */
/* -------------------------------------------------------------------------- */
function DynamicListEditor({
  items,
  onChange,
  placeholder,
  predefinedPath,
}: {
  items: string[];
  onChange: (updated: string[]) => void;
  placeholder: string;
  predefinedPath: string;
}) {
  const [options, setOptions] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch(predefinedPath);
        if (!res.ok) throw new Error("Failed to load predefined options");
        const data = await res.json();

        // ✅ Normalize structure — handle array or object with key
        if (Array.isArray(data)) {
          setOptions(data);
        } else if (Array.isArray(data.departments)) {
          setOptions(data.departments);
        } else if (Array.isArray(data.facilities)) {
          setOptions(data.facilities);
        } else {
          console.warn("Unexpected predefined JSON format:", data);
          setOptions([]);
        }
      } catch (err) {
        console.error("Error loading predefined list:", err);
        setOptions([]);
      }
    }

    loadOptions();
  }, [predefinedPath]);

  const addItem = () => {
    if (!newItem.trim()) return;
    const trimmed = newItem.trim();

    // ✅ Prevent duplicates (case-insensitive)
    if (items.some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
      setNewItem("");
      return;
    }

    onChange([...items, trimmed]);
    setNewItem("");
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Current items */}
      {items.length > 0 && (
        <ul className="space-y-1 text-sm">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between border rounded px-2 py-1"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new item */}
      <div className="flex gap-2">
        <input
          list={`options-${predefinedPath}`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          className="ui-input flex-1 text-sm"
        />
        <datalist id={`options-${predefinedPath}`}>
          {Array.isArray(options) &&
            options.map((opt) => <option key={opt} value={opt} />)}
        </datalist>
        <button
          type="button"
          onClick={addItem}
          className="btn-outline text-xs shrink-0 px-3"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
