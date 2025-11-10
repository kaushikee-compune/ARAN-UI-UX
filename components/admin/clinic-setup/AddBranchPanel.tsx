"use client";

import React, { useEffect, useState } from "react";
import type { BranchDetail } from "@/lib/services/branchDetailService";

export default function AddBranchPanel({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (data: BranchDetail) => void;
}) {
  const [formData, setFormData] = useState<BranchDetail | null>(null);
  const [template, setTemplate] = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptOptions, setDeptOptions] = useState<string[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<string[]>([]);

  // ───── Load sample JSON ─────
  useEffect(() => {
    async function loadData() {
      try {
        const [branchRes, deptRes, facilityRes] = await Promise.all([
          fetch("/data/sample-branch.json"),
          fetch("/data/departments-eye.json"),
          fetch("/data/facilities-eye.json"),
        ]);

        const branchData = await branchRes.json();
        const deptData = await deptRes.json();
        const facilityData = await facilityRes.json();

        setFormData({
          ...branchData,
          workingHours: [
            {
              dayStart: "Monday",
              dayEnd: "Friday",
              openTime: "08:00",
              closeTime: "20:00",
            },
            {
              dayStart: "Saturday",
              dayEnd: "Sunday",
              openTime: "08:00",
              closeTime: "14:00",
            },
          ],
        });
        setTemplate(branchData);
        setDeptOptions(deptData.departments);
        setFacilityOptions(facilityData.facilities);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (key: keyof BranchDetail, value: any) =>
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleListChange = (
    key: "departments" | "facilities",
    index: number,
    value: string
  ) => {
    if (!formData) return;
    const updated = [...formData[key]];
    updated[index] = value;
    setFormData({ ...formData, [key]: updated });
  };

  const addToList = (key: "departments" | "facilities") =>
    formData && setFormData({ ...formData, [key]: [...formData[key], ""] });

  const handleSave = () => {
    if (!formData) return;

    const name = formData.branchName?.trim();
    const phone = formData.phone?.trim();
    const departments = Array.isArray(formData.departments)
      ? formData.departments.filter((d) => d.trim() !== "")
      : [];

    const errors: string[] = [];

    if (!name) errors.push("Branch Name is required.");
    if (!phone) errors.push("Phone number is required.");
    if (departments.length === 0)
      errors.push("Please add at least one Department.");

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return; // ❌ stop save if errors exist
    }

    console.log("✅ Branch saved:", formData); // 🔜 replace with API POST
    onSave(formData);
  };

  // ───── Placeholder clear logic ─────
  const handleFocusField = (key: keyof BranchDetail) => {
    if (!formData || !template) return;
    const currentValue = formData[key];
    const templateValue = template[key];
    if (typeof currentValue === "string" && currentValue === templateValue) {
      handleChange(key, "");
    }
  };

  const handleBlurField = (key: keyof BranchDetail) => {
    if (!formData || !template) return;
    const currentValue = formData[key];
    const templateValue = template[key];
    if (typeof currentValue === "string" && currentValue.trim() === "") {
      handleChange(key, templateValue);
    }
  };

  if (loading || !formData)
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        Loading form template…
      </div>
    );

  return (
    <div className="min-h-screen bg-white rounded-xl shadow-sm p-6 relative space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Add New Branch
          </h1>
          <p className="text-sm text-gray-500">
            Review and update the pre-filled template before saving.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="btn-neutral border px-4 py-2 text-sm rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-accent px-4 py-2 text-sm font-medium"
          >
            Save Branch
          </button>
        </div>
      </header>

      {/* Fields */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <FormField label={<RequiredLabel label="Branch Name" />}>
              <input
                className="ui-input w-full"
                value={formData.branchName}
                required
                onFocus={() => handleFocusField("branchName")}
                onBlur={() => handleBlurField("branchName")}
                onChange={(e) => handleChange("branchName", e.target.value)}
              />
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="ABDM  HFR ID">
              <input
                className="ui-input w-full"
                value={formData.hfrId}
                onFocus={() => handleFocusField("hfrId")}
                onBlur={() => handleBlurField("hfrId")}
                onChange={(e) => handleChange("hfrId", e.target.value)}
              />
            </FormField>
          </div>
        </div>
        {/* Phone + Email in one row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <FormField label={<RequiredLabel label="Phone" />}>
              <input
                className="ui-input w-full"
                value={formData.phone}
                required
                onFocus={() => handleFocusField("phone")}
                onBlur={() => handleBlurField("phone")}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex-1">
            <FormField label="Email">
              <input
                className="ui-input w-full"
                value={formData.email}
                onFocus={() => handleFocusField("email")}
                onBlur={() => handleBlurField("email")}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </FormField>
          </div>
        </div>
        <FormField label="Address">
          <textarea
            className="ui-textarea w-full"
            value={formData.address}
            onFocus={() => handleFocusField("address")}
            onBlur={() => handleBlurField("address")}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </FormField>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <FormField
              label={
                <RequiredLabel label="Departments (Ophthalmology Sub-Specialties)" />
              }
            >
              <div className="space-y-2">
                {formData.departments.map((d, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      list="dept-options"
                      className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-1 focus:ring-blue-500"
                      style={{ appearance: "auto" }} // 👈 enables dropdown again
                      value={d}
                      placeholder="Select or type department"
                      onChange={(e) =>
                        handleListChange("departments", i, e.target.value)
                      }
                    />
                    <button
                      className="text-xs text-red-500 px-2"
                      type="button"
                      onClick={() =>
                        handleChange(
                          "departments",
                          formData.departments.filter((_, j) => j !== i)
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* ✅ Only ONE global datalist outside map */}
                <datalist id="dept-options">
                  {deptOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>

                <button
                  type="button"
                  className="text-xs  px-2 py-1 rounded mt-1"
                  onClick={() => addToList("departments")}
                >
                  + Add Department
                </button>
              </div>
            </FormField>
          </div>
          <div className="flex-1">
            <FormField label="Key Facilities">
              <div className="space-y-2">
                {formData.facilities.map((f, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      list="facility-options"
                      className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-1 focus:ring-blue-500"
                      style={{ appearance: "auto" }}
                      value={f}
                      placeholder="Select or type facility"
                      onChange={(e) =>
                        handleListChange("facilities", i, e.target.value)
                      }
                    />
                    <button
                      className="text-xs text-red-500 px-2"
                      type="button"
                      onClick={() =>
                        handleChange(
                          "facilities",
                          formData.facilities.filter((_, j) => j !== i)
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <datalist id="facility-options">
                  {facilityOptions.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>

                <button
                  type="button"
                  className="text-xs  px-2 py-1 rounded mt-1"
                  onClick={() => addToList("facilities")}
                >
                  + Add Facility
                </button>
              </div>
            </FormField>
          </div>
        </div>

        {/* ---------- Open–Close Timings ---------- */}
        <FormField label="Open–Close Timings">
          <WorkingHoursSection
            formData={formData}
            handleChange={handleChange}
          />
        </FormField>

        
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                        WORKING HOURS SUBCOMPONENT                          */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*                        WORKING HOURS SUBCOMPONENT                          */
/* -------------------------------------------------------------------------- */
function WorkingHoursSection({
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
    const updated = Array.isArray((formData as any).workingHours)
      ? [...(formData as any).workingHours, entry]
      : [entry];
    handleChange("workingHours" as any, updated);
  };

  const removeEntry = (index: number) => {
    const updated = (formData as any).workingHours.filter(
      (_: any, i: number) => i !== index
    );
    handleChange("workingHours" as any, updated);
  };

  const hours = (formData as any).workingHours || [];

  const formatTime = (time24: string): string => {
    const [h, m] = time24.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
  };

  return (
    <div className="space-y-4">
      {/* Input Row */}
      <div className="flex flex-wrap items-center gap-2 justify-between  rounded-lg p-3 bg-gray-50">
        <div className="flex items-center gap-2 flex-1">
          {/* Days */}
          <select
            className="ui-input px-2 py-1 text-sm w-[110px]"
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
            className="ui-input px-2 py-1 text-sm w-[110px]"
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

          {/* Times */}
          <input
            type="time"
            className="ui-input px-2 py-1 text-sm w-[120px]"
            value={entry.openTime}
            onChange={(e) => setEntry({ ...entry, openTime: e.target.value })}
          />
          <span className="text-gray-500 text-sm">to</span>
          <input
            type="time"
            className="ui-input px-2 py-1 text-sm w-[120px]"
            value={entry.closeTime}
            onChange={(e) => setEntry({ ...entry, closeTime: e.target.value })}
          />
        </div>

        {/* Add Button */}
        <button
          type="button"
          className="text-xs border px-3 py-1 rounded text-gray-700 hover:bg-white ml-auto"
          onClick={addEntry}
        >
          + Add
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-50 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left px-3 py-2 w-[40%]">Days</th>
              <th className="text-left px-3 py-2 w-[45%]">Timings</th>
              <th className="text-right px-3 py-2 w-[15%]">Action</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((w: any, i: number) => (
              <tr key={i} className="border-t border-gray-200">
                <td className="px-3 py-2 text-gray-800">
                  {w.dayStart} – {w.dayEnd}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {formatTime(w.openTime)} – {formatTime(w.closeTime)}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => removeEntry(i)}
                    className="text-xs text-red-500 hover:text-red-700"
                    title="Remove"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {hours.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-3 text-gray-400 italic"
                >
                  No timings added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- Label helper -------------------- */
function RequiredLabel({ label }: { label: string }) {
  return (
    <label className="text-sm font-medium text-gray-700">
      {label} <span className="text-red-500">*</span>
    </label>
  );
}

/* -------------------- Reusable FormField -------------------- */
function FormField({
  label,
  children,
}: {
  label: string | React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {typeof label === "string" ? (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      ) : (
        label
      )}
      {children}
    </div>
  );
}
