"use client";

import ProfileManagement from "@/components/doctor/ProfileManagement/page";

export default function DoctorProfilePage() {
  return (
    <div className="space-y-3">
      <div className="ui-card px-3 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold">Profile Management</h1>
          <span className="text-xs text-gray-500">Doctor • Public profile</span>
        </div>
      </div>

      <ProfileManagement />
    </div>
  );
}
