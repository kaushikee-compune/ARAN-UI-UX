"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useBranch } from "@/context/BranchContext";
import InventoryQuickStats from "@/components/admin/inventory/InventoryQuickStats";
import ThresholdAlertBar from "@/components/admin/inventory/ThresholdAlertBar";
import InventoryTable from "@/components/admin/inventory/InventoryTable";
import InventoryFormModal from "@/components/admin/inventory/InventoryFormModal";
import type { InventoryItem } from "@/components/admin/inventory/types";

export default function InventoryPage() {
  const { selectedBranch } = useBranch();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [lowOnly, setLowOnly] = useState(false);

  // Load JSON
  useEffect(() => {
    if (!selectedBranch) return;
    const branchId =
      typeof selectedBranch === "string"
        ? selectedBranch
        : selectedBranch.branchId || selectedBranch.id;
    if (!branchId) return;

    fetch("/data/inventory.json")
      .then((res) => res.json())
      .then((data) => {
        const branch = data.find((b: any) => b.branchId === branchId);
        setItems(branch ? branch.items : []);
      });
  }, [selectedBranch]);

  // Filtered view
  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (category !== "All") {
      list = list.filter((i) => i.category === category);
    }
    if (lowOnly) {
      list = list.filter((i) => i.stockQty <= i.threshold);
    }
    return list;
  }, [items, search, category, lowOnly]);

  const handleSave = (item: InventoryItem) => {
    setItems((prev) => {
      const index = prev.findIndex((p) => p.id === item.id);
      const updated =
        index >= 0
          ? prev.map((p, i) => (i === index ? item : p))
          : [...prev, item];
      console.log("✅ Updated inventory:", updated);
      return updated;
    });
  };

  // Distinct categories
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category)))],
    [items]
  );

  return (
    <div className="space-y-3">
      {/* ---------- Header / Search Bar ---------- */}
      <div className="flex items-center justify-between mt-4 gap-2">
        {/* Left section — Search + Category (2/3 width) */}
        <div className="flex flex-1 items-center gap-2">
          <input
            type="search"
            placeholder="Search by item name..."
            className="ui-input flex-[2_2_0%]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="ui-input flex-[1_1_0%]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
           >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
            
          </select>
        </div>

        {/* Right section — Low Stock + Add (1/3 width) */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-1 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
            />
            Low stock only
          </label>

          <button
            className="btn-primary px-3 py-1.5 text-sm mr-4"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* ---------- Dashboard Summary ---------- */}
      <InventoryQuickStats items={filtered} />
      <ThresholdAlertBar items={filtered} />

      {/* ---------- Table ---------- */}
      {filtered.length === 0 ? (
        <div className="text-sm text-gray-500 border p-3 rounded-lg bg-gray-50">
          No items found.
        </div>
      ) : (
        <InventoryTable
          items={filtered}
          onEdit={(it) => {
            setEditing(it);
            setModalOpen(true);
          }}
        />
      )}

      {/* ---------- Modal ---------- */}
      <InventoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editing={editing}
        branchId={
          typeof selectedBranch === "string"
            ? selectedBranch
            : selectedBranch?.branchId || selectedBranch?.id || ""
        }
      />
    </div>
  );
}
