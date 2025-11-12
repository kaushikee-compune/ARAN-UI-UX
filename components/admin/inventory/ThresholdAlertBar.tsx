"use client";
import React from "react";
import type { InventoryItem } from "./types";

export default function ThresholdAlertBar({ items }: { items: InventoryItem[] }) {
  const lowStock = items.filter((i) => i.stockQty <= i.threshold);
  if (lowStock.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
      ⚠️ {lowStock.length} item{lowStock.length > 1 ? "s" : ""} below threshold:{" "}
      <span className="font-medium">
        {lowStock.slice(0, 3).map((i) => i.name).join(", ")}
        {lowStock.length > 3 ? "…" : ""}
      </span>
    </div>
  );
}
