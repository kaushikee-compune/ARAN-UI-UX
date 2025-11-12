"use client";

import React, { useState } from "react";
import type { DayName, DayAvailability } from "./types";
import { generateSlots } from "./utils";

/**
 * QuickAddPanel
 * ----------------------------------------------------------------------
 * Lets admin quickly create a recurring pattern:
 *  - choose days (Mon–Sun)
 *  - choose start/end times
 *  - choose slot duration
 * Then emits an array of DayAvailability via onApply().
 */
export default function QuickAddPanel({
  onApply,
  disabled,
}: {
  onApply: (pattern: DayAvailability[]) => void;
  disabled?: boolean;
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

  const [selectedDays, setSelectedDays] = useState<DayName[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
  ]);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("14:00");
  const [duration, setDuration] = useState(15);

  const toggleDay = (day: DayName) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const apply = () => {
    if (!selectedDays.length) return;
    const pattern: DayAvailability[] = selectedDays.map((d) => ({
      day: d,
      slots: generateSlots(start, end, duration),
    }));
    onApply(pattern);
  };

  return (
    <div className="ui-card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Quick Add Pattern</div>
          <div className="text-xs text-gray-500">
            Select days, time, and slot duration
          </div>
        </div>
      </div>

      {/* Days Row */}
      <div className="flex flex-wrap gap-2">
        {DAY_ORDER.map((d) => {
          const active = selectedDays.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={[
                "px-3 py-1.5 rounded-md text-sm border transition",
                active
                  ? "bg-[--secondary] text-[--on-secondary] border-[--secondary]"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300",
              ].join(" ")}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Time & Duration Inputs */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-[11px] text-gray-600">Start Time</label>
          <input
            type="time"
            className="ui-input"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-[11px] text-gray-600">End Time</label>
          <input
            type="time"
            className="ui-input"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-[11px] text-gray-600">Slot Duration (min)</label>
          <select
            className="ui-input"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            {[15, 30, 45, 60].map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action */}
      <div className="pt-1">
        <button
          type="button"
          className="btn-primary"
          disabled={disabled || !selectedDays.length}
          onClick={apply}
        >
          Apply Pattern
        </button>
      </div>
    </div>
  );
}
