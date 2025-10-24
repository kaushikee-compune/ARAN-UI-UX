"use client";
import React from "react";

export type SummaryData = {
  appointmentsToday: number;
  queueCount: number;
  consultationsDone: number;
  paymentsTotal: number;
};

export default function SummaryCards({ data }: { data?: SummaryData }) {
  const loading = !data;

  const items = loading
    ? [
        { title: "Today's Appointments", value: "—" },
        { title: "In Queue", value: "—" },
        { title: "Consultations Done", value: "—" },
        { title: "Payments (₹)", value: "—" },
      ]
    : [
        { title: "Today's Appointments", value: data.appointmentsToday },
        { title: "In Queue", value: data.queueCount },
        { title: "Consultations Done", value: data.consultationsDone },
        { title: "Payments (₹)", value: data.paymentsTotal.toLocaleString() },
      ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((c) => (
        <div
          key={c.title}
          className="ui-card text-center p-4 animate-fade-in"
        >
          <div className="text-sm text-gray-500">{c.title}</div>
          <div className="text-2xl font-semibold mt-1 text-gray-800">
            {loading ? (
              <span className="inline-block w-8 h-5 bg-gray-200 animate-pulse rounded" />
            ) : (
              c.value
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
