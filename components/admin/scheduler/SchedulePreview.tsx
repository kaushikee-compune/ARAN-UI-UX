"use client";

import React from "react";
import type { DayAvailability } from "./types";
import { formatTimeRange } from "./utils";

export default function SchedulePreview({
  availability,
  doctorName,
  branchName,
}: {
  availability: DayAvailability[];
  doctorName: string;
  branchName: string;
}) {
  if (!availability || availability.length === 0) return null;

  // Group identical time combos
  const seen = new Map<string, string[]>();
  for (const a of availability) {
    const s1 =
      a.session1 && a.session1.length ? formatTimeRange(a.session1) : "";
    const s2 =
      a.session2 && a.session2.length ? formatTimeRange(a.session2) : "";
    const key = `${s1}|${s2}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(a.day);
  }

  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const joinDays = (days: string[]) => {
    const sorted = days.sort(
      (a, b) => order.indexOf(a) - order.indexOf(b)
    );
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      const current = sorted[i];
      if (order.indexOf(current) === order.indexOf(prev) + 1) {
        prev = current;
        continue;
      }
      if (start === prev) ranges.push(start);
      else ranges.push(`${start}–${prev}`);
      start = current;
      prev = current;
    }
    return ranges.join(", ");
  };

  const rows = Array.from(seen.entries()).map(([key, days]) => {
    const [s1, s2] = key.split("|");
    return {
      days: joinDays(days),
      session1: s1 || "—",
      session2: s2 || "—",
    };
  });

  return (
    <div className="ui-card p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
        <div className="font-semibold text-gray-700 text-sm">
          {doctorName || "Doctor"} –{" "}
          <span className="text-gray-500">{branchName}</span>
        </div>
        <div className="text-xs text-gray-500">Schedule Preview</div>
      </div>

      {/* Table */}
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-[1fr_1fr_1fr] font-medium text-gray-600 border-b pb-1">
          <div>Days</div>
          <div>Session 1</div>
          <div>Session 2</div>
        </div>

        {rows.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_1fr] py-1 border-b last:border-0"
          >
            <div className="font-medium text-gray-800">{r.days}</div>
            <div className="text-gray-700">{r.session1}</div>
            <div className="text-gray-700">{r.session2}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
