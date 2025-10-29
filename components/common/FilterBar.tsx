"use client";
import React from "react";

export type FilterOption = { label: string; value: string };

export type FilterField =
  | {
      type: "select";
      key: string;
      label?: string;
      options: FilterOption[];
      value: string;
      onChange: (val: string) => void;
    }
  | {
      type: "search";
      key: string;
      placeholder?: string;
      value: string;
      onChange: (val: string) => void;
    };

type Props = {
  fields: FilterField[];
  className?: string;
};

/**
 * 🔹 Reusable global filter bar (Doctor/Dept, ABHA filter, etc.)
 */
export default function FilterBar({ fields, className }: Props) {
  return (
    <div
      className={`flex flex-wrap md:flex-nowrap items-center justify-between gap-2 rounded-lg border border-gray-200 shadow-sm bg-white px-3 py-2 ${className || ""}`}
    >
      <div className="flex flex-1 items-center gap-2 w-full">
        {fields.map((field) => {
          if (field.type === "select") {
            return (
              <div key={field.key} className="flex-shrink-0">
                <select
                  className="ui-input min-w-[140px]"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.type === "search") {
            return (
              <div key={field.key} className="flex-grow min-w-[260px]">
                <input
                  type="text"
                  className="ui-input w-full"
                  placeholder={field.placeholder || "Search…"}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
