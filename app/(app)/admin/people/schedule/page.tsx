// app/(app)/admin/people/schedule/page.tsx
"use client";

import React from "react";
import DoctorSlotScheduler from "@/components/admin/scheduler/DoctorSlotScheduler";

export default function SchedulePage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Doctor Slot Scheduler</h1>
      <p className="text-sm text-gray-600">
        Configure each doctor’s availability and off-days for appointments.
      </p>
      <DoctorSlotScheduler />
    </div>
  );
}
