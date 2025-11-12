"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  DoctorInfo,
  DoctorSchedule,
  OffDay,
  DayAvailability,
} from "./types";
import ScheduleGrid from "./ScheduleGrid";
import QuickAddPanel from "./QuickAddPanel";
import OffDayModal from "./OffDayModal";
import { useBranch } from "@/context/BranchContext"; // ✅ global branch context

export default function DoctorSlotScheduler() {
  const { selectedBranch } = useBranch();
  const branchId =
    typeof selectedBranch === "string"
      ? selectedBranch
      : selectedBranch?.id ?? "";
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorInfo | null>(null);
  const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);
  const [offDays, setOffDays] = useState<OffDay[]>([]);
  const [showOffModal, setShowOffModal] = useState(false);

  // ──────────────────────────────
  // Load doctors from JSON
  useEffect(() => {
    fetch("/data/staff.json")
      .then((r) => r.json())
      .then(setDoctors)
      .catch(console.error);
  }, []);

  // ──────────────────────────────
  // Filter doctors for the active branch
  const filteredDoctors = useMemo(() => {
    if (!branchId) return [];
    return doctors.filter((d) => {
      if (Array.isArray(d.branches)) return d.branches.includes(branchId);
      return d.branchId === branchId;
    });
  }, [doctors, branchId]);

  // Reset doctor if branch changes
  useEffect(() => {
    setSelectedDoctor(null);
  }, [branchId]);

  // ──────────────────────────────
  // Load doctor’s schedule + off-days
  useEffect(() => {
    if (!selectedDoctor || !branchId) return;
    Promise.all([
      fetch("/data/doctor-schedule.json").then((r) => r.json()),
      fetch("/data/offdays.json").then((r) => r.json()),
    ]).then(([allSchedules, allOffDays]) => {
      const sch = allSchedules.find(
        (s: DoctorSchedule) =>
          s.doctorId === selectedDoctor.id && s.branchId === branchId
      );
      setSchedule(sch || null);
      setOffDays(
        allOffDays.filter(
          (o: OffDay) =>
            o.doctorId === selectedDoctor.id && o.branchId === branchId
        )
      );
    });
  }, [selectedDoctor, branchId]);

  // ──────────────────────────────
  // Pattern + Save handlers
  const handleApplyPattern = (dayPattern: DayAvailability[]) => {
    if (!schedule) {
      // create a new schedule if none exists
      const newSchedule: DoctorSchedule = {
        doctorId: selectedDoctor?.id || "",
        branchId,
        slotDuration: 15,
        availability: dayPattern,
      };
      setSchedule(newSchedule);
    } else {
      setSchedule({
        ...schedule,
        availability: dayPattern,
      });
    }
  };

  const handleSave = async () => {
    if (!selectedDoctor || !branchId || !schedule) return;
    console.log("Saving schedule:", schedule);
  };

  // ──────────────────────────────
  // Render
  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="ui-input"
          value={selectedDoctor?.id || ""}
          onChange={(e) =>
            setSelectedDoctor(
              filteredDoctors.find((d) => d.id === e.target.value) || null
            )
          }
        >
          <option value="">Select Doctor</option>
          {filteredDoctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleSave}
          className="btn-primary"
          disabled={!selectedDoctor}
        >
          Save Schedule
        </button>
      </div>

      {/* QuickAddPanel */}
      <QuickAddPanel onApply={handleApplyPattern} disabled={!selectedDoctor} />

      {/* Grid */}
      {schedule && (
        <ScheduleGrid
          availability={schedule.availability}
          slotDuration={schedule.slotDuration}
          onChange={(a) =>
            setSchedule((prev) => (prev ? { ...prev, availability: a } : prev))
          }
        />
      )}

      {/* Off Days */}
      <div className="flex items-center gap-2">
        <button
          className="btn-outline"
          onClick={() => setShowOffModal(true)}
          disabled={!selectedDoctor}
        >
          Block Days
        </button>
      </div>

      {showOffModal && selectedDoctor && (
        <OffDayModal
          doctorId={selectedDoctor.id}
          branchId={branchId}
          existing={offDays}
          onClose={() => setShowOffModal(false)}
          onSave={(newList) => setOffDays(newList)}
        />
      )}
    </div>
  );
}
