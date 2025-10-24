"use client";
import React from "react";

export type WeeklyData = { day: string; patients: number }[];

export default function WeeklyOverview({ data }: { data?: WeeklyData }) {
  const loading = !data;

  const week = loading
    ? [...Array(7)].map((_, i) => ({ day: `Day ${i + 1}`, patients: 0 }))
    : data;

  return (
    <div className="ui-card p-4">
      <h3 className="text-sm font-semibold mb-3">Weekly Overview</h3>
      {loading ? (
        <div className="space-y-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-7 gap-1 text-xs text-center">
          {week!.map((v, i) => (
            <div
              key={i}
              className="bg-[--secondary]/20 rounded-md p-2 animate-fade-in"
            >
              <div className="font-medium text-gray-800">{v.patients}</div>
              <div className="text-[10px] text-gray-500">{v.day}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
