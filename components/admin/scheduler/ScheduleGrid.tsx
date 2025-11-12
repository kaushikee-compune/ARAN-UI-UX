"use client";

import React, { useMemo } from "react";
import type { DayAvailability, DayName, TimeSlot } from "./types";
import { minsToTime } from "./utils";

/**
 * ScheduleGrid
 * --------------------------------------------------------------------------
 * Displays a 7×N grid (Mon–Sun × time rows)
 * Each cell represents a slot (e.g., 15/30/45 min)
 * Works with two sessions: session1 and session2
 *
 * Props:
 *  - availability: current schedule array
 *  - slotDuration: minutes per cell
 *  - editSession: "session1" | "session2" | "both" (default: "session1")
 *  - onChange: callback with updated schedule
 */
export default function ScheduleGrid({
  availability,
  slotDuration,
  onChange,
  editSession = "session1",
}: {
  availability: DayAvailability[];
  slotDuration: number;
  onChange: (next: DayAvailability[]) => void;
  editSession?: "session1" | "session2" | "both";
}) {
  const DAY_ORDER: DayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  /** Generate all visible times (6 am → 10 pm) */
  const allSlots = useMemo(() => {
    const arr: string[] = [];
    for (let m = 6 * 60; m < 22 * 60; m += slotDuration) {
      arr.push(minsToTime(m));
    }
    return arr;
  }, [slotDuration]);

  /** Whether a given cell is active in either session */
  const isActive = (day: DayName, time: string): boolean => {
    const d = availability.find((a) => a.day === day);
    if (!d) return false;
    const combined = [...(d.session1 || []), ...(d.session2 || [])];
    return combined.some((s) => time >= s.start && time < s.end);
  };

  /** Toggle cell for selected editSession */
  const toggleSlot = (day: DayName, time: string) => {
    const next = availability.map((a) => ({ ...a }));
    let dayEntry = next.find((a) => a.day === day);

    if (!dayEntry) {
      const newDay: DayAvailability = { day, session1: [], session2: [] };
      next.push(newDay);
      dayEntry = newDay;
    }

    const slot: TimeSlot = {
      start: time,
      end: minsToTime(
        parseInt(time.split(":")[0]) * 60 +
          parseInt(time.split(":")[1]) +
          slotDuration
      ),
    };

    const existsIn = (arr?: TimeSlot[]) =>
      arr?.some((s) => s.start === slot.start && s.end === slot.end) ?? false;

    const removeFrom = (which: "session1" | "session2") => {
      dayEntry![which] = (dayEntry![which] || []).filter(
        (s) => !(s.start === slot.start && s.end === slot.end)
      );
    };

    const addTo = (which: "session1" | "session2") => {
      if (!existsIn(dayEntry![which]))
        dayEntry![which] = [...(dayEntry![which] || []), slot];
    };

    const inS1 = existsIn(dayEntry.session1);
    const inS2 = existsIn(dayEntry.session2);

    if (editSession === "both") {
      if (inS1 || inS2) {
        removeFrom("session1");
        removeFrom("session2");
      } else {
        addTo("session1");
        addTo("session2");
      }
    } else if (editSession === "session2") {
      inS2 ? removeFrom("session2") : addTo("session2");
    } else {
      inS1 ? removeFrom("session1") : addTo("session1");
    }

    onChange(next);
  };

  return (
    <div className="ui-card p-4 overflow-x-auto">
      <div className="text-sm font-semibold mb-2">Availability Grid</div>
      <div className="text-xs text-gray-500 mb-3">
        Click cells to toggle {editSession === "both" ? "both sessions" : editSession === "session2" ? "Session 2" : "Session 1"} availability
        (each = {slotDuration} min)
      </div>

      <div className="min-w-[700px] border rounded-md overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 bg-gray-50 border-b">
          <div className="px-2 py-1 text-xs text-gray-600 border-r">Time</div>
          {DAY_ORDER.map((d) => (
            <div
              key={d}
              className="px-2 py-1 text-xs text-center font-medium text-gray-700 border-r last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Time rows */}
        {allSlots.map((t, idx) => (
          <div
            key={t}
            className={`grid grid-cols-8 text-sm ${
              idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
            }`}
          >
            {/* Time label */}
            <div className="px-2 py-1 border-r text-xs text-gray-600 whitespace-nowrap">
              {t}
            </div>

            {/* Day cells */}
            {DAY_ORDER.map((d) => {
              const active = isActive(d, t);
              return (
                <button
                  key={d + t}
                  onClick={() => toggleSlot(d, t)}
                  className={[
                    "h-6 border-r border-t transition",
                    active
                      ? "bg-[--secondary] hover:brightness-95"
                      : "hover:bg-gray-100",
                  ].join(" ")}
                  title={`${d} ${t}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
