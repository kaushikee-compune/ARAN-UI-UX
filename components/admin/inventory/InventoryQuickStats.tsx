"use client";
import React, { useEffect, useState } from "react";
import type { InventoryItem } from "./types";

interface Props {
  items: InventoryItem[];
}

export default function InventoryQuickStats({ items }: Props) {
  const below = items.filter((i) => i.stockQty <= i.threshold);
  const total = items.length;

  const [dateLabel, setDateLabel] = useState<string>("—");

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString());
  }, []);

  const cards = [
    { label: "Total Items", value: total },
    { label: "Below Threshold", value: below.length },
    { label: "Last Updated", value: dateLabel },
  ];

  return (
    <div className="grid sm:grid-cols-3 gap-3 mb-3">
      {cards.map((c, idx) => (
        <div key={idx} className="ui-card p-3 text-center">
          <div className="text-md text-gray-500">{c.label}</div>
          <div className="text-lg font-semibold mt-1">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
