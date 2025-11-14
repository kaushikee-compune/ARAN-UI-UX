"use client";

import React from "react";
import { SessionData, AccessEntry, Role } from "@/lib/auth/role";

interface RolePickerProps {
  session: SessionData;
  onSelect: (role: Role) => void;
}

export default function RolePicker({ session, onSelect }: RolePickerProps) {
  const accessArray: AccessEntry[] = session.access || [];

  // Unique roles
  const roles: Role[] = Array.from(
    new Set(accessArray.map((a: AccessEntry) => a.role))
  ) as Role[];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold text-center">
          Select Your Role
        </h2>

        <p className="text-xs text-gray-500 text-center">
          You have multiple roles in your clinic
        </p>

        <div className="space-y-3">
          {roles.map((role: Role) => (
            <button
              key={role} // role is a string → valid React key
              onClick={() => onSelect(role)}
              className="w-full flex flex-col p-3 border rounded-xl hover:bg-gray-50"
            >
              <span className="font-medium capitalize">{role}</span>

              <span className="text-xs text-gray-500">
                Branches:{" "}
                {accessArray
                  .filter((a: AccessEntry) => a.role === role)
                  .map((a: AccessEntry) => a.branchId)
                  .join(", ")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
