"use client";
import React from "react";
import type { InventoryItem } from "./types";

interface Props {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
}

export default function InventoryTable({ items, onEdit }: Props) {
  return (
    <div className="ui-card overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <Th>Item</Th>
            <Th>Category</Th>
            <Th>Stock</Th>
            <Th>Threshold</Th>
            <Th>Unit</Th>
            <Th>Supplier</Th>
            <Th>Action</Th>
          </tr>
        </thead>

        <tbody>
          {items.map((it, index) => {
            const low = it.stockQty <= it.threshold;
            const near =
              !low &&
              it.stockQty > it.threshold &&
              it.stockQty <= it.threshold * 1.25;

            // decide chip color & label
            const chipColor = low
              ? "bg-red-100 text-red-700 border border-red-200"
              : near
              ? "bg-amber-100 text-amber-700 border border-amber-200"
              : "bg-emerald-100 text-emerald-700 border border-emerald-200";

            const chipLabel = low
              ? "Low"
              : near
              ? "Near Limit"
              : "Healthy";

            return (
              <tr
                key={it.id || `${it.name}-${index}`}
                className={
                  "border-t " +
                  (low ? "bg-blue-50/60" : "hover:bg-gray-50 transition")
                }
              >
                <Td>
                  <div className="flex flex-col">
                    <span className="text-xs mb-0.5">
                      <span
                        className={`inline-block px-1.5 py-[1px] rounded-full text-[10px] font-medium ${chipColor}`}
                      >
                        {chipLabel}
                      </span>
                    </span>
                    <span className="font-medium text-gray-900">
                      {it.name}
                    </span>
                  </div>
                </Td>

                <Td>{it.category}</Td>
                <Td>{it.stockQty}</Td>
                <Td>{it.threshold}</Td>
                <Td>{it.unit}</Td>
                <Td>{it.supplier || "—"}</Td>
                <Td>
                  <button
                    onClick={() => onEdit(it)}
                    className="px-2 py-1 text-xs hover:bg-gray-50 btn-neutral"
                  >
                    Edit
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-2 py-1.5 border border-gray-400 text-left text-xs text-gray-700">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1.5 border-t border-gray-300 align-top">{children}</td>;
}
