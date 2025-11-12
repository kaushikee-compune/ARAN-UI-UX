"use client";

import React, { useMemo, useState } from "react";
import type { DayAvailability, DayName, TimeSlot } from "./types";
import { minsToTime } from "./utils";

/**
 * ScheduleGrid
 * ----------------------------------------------------------------------
 * Displays a 7×N grid (Mon–Sun × time rows)
 * Each cell represents a slot (e.g., 15/30/45 mins)
 * Click toggles availability.
 */
export default function ScheduleGrid({
  availability,
  slotDuration,
  onChange,
}: {
  availability: DayAvailability[];
  slotDuration: number;
  onChange: (next: DayAvailability[]) => void;
}) {
  const DAY_ORDER: DayName[] = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  // full time range: 6:00 to 22:00 (can be adjusted)
  const allSlots: string[] = useMemo(() => {
    const slots: string[] = [];
    for (let m = 6 * 60; m < 22 * 60; m += slotDuration) {
      slots.push(minsToTime(m));
    }
    return slots;
  }, [slotDuration]);

  // helper: find if slot active for given day/time
  const isActive = (day: DayName, time: string): boolean => {
    const d = availability.find((a) => a.day === day);
    if (!d) return false;
    return d.slots.some((s) => time >= s.start && time < s.end);
  };

  // toggle cell on click
  const toggleSlot = (day: DayName, time: string) => {
    const next = availability.map((a) => ({ ...a }));
    let dayEntry = next.find((a) => a.day === day);
    if (!dayEntry) {
      dayEntry = { day, slots: [] };
      next.push(dayEntry);
    }

    const slot: TimeSlot = {
      start: time,
      end: minsToTime(
        parseInt(time.split(":")[0]) * 60 +
          parseInt(time.split(":")[1]) +
          slotDuration
      ),
    };

    const currentlyActive = isActive(day, time);
    if (currentlyActive) {
      // remove that slot
      dayEntry.slots = dayEntry.slots.filter(
        (s) => !(s.start === slot.start && s.end === slot.end)
      );
    } else {
      dayEntry.slots.push(slot);
    }

    onChange(next);
  };

  return (
    <div className="ui-card p-4 overflow-x-auto">
      <div className="text-sm font-semibold mb-2">Availability Grid</div>
      <div className="text-xs text-gray-500 mb-3">
        Click to toggle availability (each cell = {slotDuration} min)
      </div>

      <div className="min-w-[700px] border rounded-md overflow-hidden">
        {/* Header row */}
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
              idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
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
