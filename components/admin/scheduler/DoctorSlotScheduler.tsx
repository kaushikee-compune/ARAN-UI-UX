"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { DoctorInfo, DoctorSchedule, DayAvailability, TimeSlot } from "./types";
import QuickAddPanel from "./QuickAddPanel";
import SchedulePreview from "./SchedulePreview";
import { useBranch } from "@/context/BranchContext";

export default function DoctorSlotScheduler() {
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch;
    
  const branchName = selectedBranch;
   

  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorInfo | null>(null);
  const [schedule, setSchedule] = useState<DoctorSchedule | null>(null);

  // ─────────────────────────────────────────────
  useEffect(() => {
    fetch("/data/staff.json")
      .then((r) => r.json())
      .then(setDoctors)
      .catch(console.error);
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!branchId) return [];
    return doctors.filter((d) => {
      if (Array.isArray(d.branches)) return d.branches.includes(branchId);
      return d.branchId === branchId;
    });
  }, [doctors, branchId]);

  useEffect(() => {
    setSelectedDoctor(null);
    setSchedule(null);
  }, [branchId]);

  // ─────────────────────────────────────────────
  // Helpers to merge patterns (append without overwriting)
  const dedupeSlots = (slots: TimeSlot[]): TimeSlot[] => {
    const key = (s: TimeSlot) => `${s.start}-${s.end}`;
    const map = new Map<string, TimeSlot>();
    for (const s of slots) map.set(key(s), s);
    return Array.from(map.values()).sort((a, b) => (a.start < b.start ? -1 : 1));
    // (sorted for stable preview)
  };

  const mergeAvailability = (
    base: DayAvailability[],
    incoming: DayAvailability[]
  ): DayAvailability[] => {
    const next = [...base.map((d) => ({ ...d,
      session1: [...(d.session1 || [])],
      session2: [...(d.session2 || [])],
    }))];

    for (const inc of incoming) {
      const idx = next.findIndex((d) => d.day === inc.day);
      if (idx === -1) {
        next.push({
          day: inc.day,
          session1: dedupeSlots(inc.session1 || []),
          session2: dedupeSlots(inc.session2 || []),
        });
      } else {
        next[idx] = {
          day: next[idx].day,
          session1: dedupeSlots([...(next[idx].session1 || []), ...(inc.session1 || [])]),
          session2: dedupeSlots([...(next[idx].session2 || []), ...(inc.session2 || [])]),
        };
      }
    }
    // keep day order Mon..Sun
    const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    next.sort((a, b) => order.indexOf(a.day as any) - order.indexOf(b.day as any));
    return next;
  };

  const handleAddPattern = (newPattern: DayAvailability[]) => {
    if (!selectedDoctor) return;
    setSchedule((prev) => {
      if (!prev) {
        return {
          doctorId: selectedDoctor.id,
          branchId,
          slotDuration: 15,
          availability: mergeAvailability([], newPattern),
        };
      }
      return {
        ...prev,
        availability: mergeAvailability(prev.availability, newPattern),
      };
    });
  };

  // ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!schedule) return;
    console.log("Saving schedule:", schedule);
  };

  return (
    <div className="space-y-4">
      {/* Doctor selector */}
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
      </div>

      {/* Add pattern */}
      <QuickAddPanel onApply={handleAddPattern} disabled={!selectedDoctor} />

      {/* Preview + Save */}
      {schedule && schedule.availability.length > 0 && (
        <div className="space-y-3">
          <SchedulePreview
            availability={schedule.availability}
            doctorName={selectedDoctor?.name || ""}
            branchName={branchName}
          />
          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-accent">
              Save Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
