"use client";

import React, { useState } from "react";
import type { DayName, DayAvailability } from "./types";
import { generateSlots } from "./utils";

/**
 * QuickAddPanel
 * --------------------------------------------------------------------------
 * Lets admin quickly add Session 1 or Session 2 pattern
 * - Select days
 * - Choose start, end, slot duration
 * - Choose session type (Session 1 / Session 2)
 * --------------------------------------------------------------------------
 */
export default function QuickAddPanel({
  onApply,
  disabled,
}: {
  onApply: (pattern: DayAvailability[]) => void;
  disabled?: boolean;
}) {
  const DAY_ORDER: DayName[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const [selectedDays, setSelectedDays] = useState<DayName[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
  ]);
  const [session, setSession] = useState<"session1" | "session2">("session1");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("14:00");
  const [duration, setDuration] = useState(15);

  const toggleDay = (day: DayName) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const apply = () => {
    const slots = generateSlots(start, end, duration);
    const pattern: DayAvailability[] = selectedDays.map((d) => ({
      day: d,
      session1: session === "session1" ? slots : [],
      session2: session === "session2" ? slots : [],
    }));
    onApply(pattern);
  };

  return (
    <div className="ui-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Quick Add Pattern</div>

        <div className="flex gap-2 text-xs">
          <button
            className={`px-3 py-1.5 rounded-md border ${
              session === "session1"
                ? "bg-[--secondary] text-[--on-secondary] border-[--secondary]"
                : "bg-white text-gray-700 border-gray-300"
            }`}
            onClick={() => setSession("session1")}
          >
            Session 1
          </button>

          <button
            className={`px-3 py-1.5 rounded-md border ${
              session === "session2"
                ? "bg-[--secondary] text-[--on-secondary] border-[--secondary]"
                : "bg-white text-gray-700 border-gray-300"
            }`}
            onClick={() => setSession("session2")}
          >
            Session 2
          </button>
        </div>
      </div>

      {/* Days selector */}
      <div className="flex flex-wrap gap-2">
        {DAY_ORDER.map((d) => {
          const active = selectedDays.includes(d);
          return (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                active
                  ? "bg-[--secondary] text-[--on-secondary] border-[--secondary]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Time Inputs */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-[11px] text-gray-600">Start</label>
          <input
            type="time"
            className="ui-input"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-[11px] text-gray-600">End</label>
          <input
            type="time"
            className="ui-input"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-[11px] text-gray-600">Slot Duration</label>
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

      <div className="pt-1">
        <button
          onClick={apply}
          className="btn-primary"
          disabled={disabled || !selectedDays.length}
        >
          Add {session === "session1" ? "Session 1" : "Session 2"} Schedule
        </button>
      </div>
    </div>
  );
}
