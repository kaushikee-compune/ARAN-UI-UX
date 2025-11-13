"use client";

import React from "react";

export type SummaryData = {
  today: number;
  month: number;
  pending: number;
  reconciled: number;
  totalCount: number;
};

export default function BillingSummaryCards({ data }: { data: SummaryData }) {
  const cards = [
    { label: "Today's Revenue (₹)", value: data.today, color: "text-emerald-600" },
    { label: "This Month Revenue(₹)", value: data.month, color: "text-blue-600" },
    { label: "Pending Payments (₹)", value: data.pending, color: "text-amber-600" },
    {
      label: "Reconciled Amount (₹)",
      value: data.reconciled,
      color: "text-indigo-600",
    },
    { label: "Total Invoices", value: data.totalCount, color: "text-gray-700" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="ui-card p-4 border">
          <div className="text-xs text-gray-500">{card.label}</div>
          <div className={`mt-1 text-xl font-semibold ${card.color}`}>
            {card.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
