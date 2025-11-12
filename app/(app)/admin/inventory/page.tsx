"use client";
import React, { useEffect, useState } from "react";
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

  //  oad JSON for selected branch
  useEffect(() => {
    if (!selectedBranch) return;

    // normalize both possible shapes
    const branchId =
      typeof selectedBranch === "string"
        ? selectedBranch
        : selectedBranch.branchId || selectedBranch.id;

    if (!branchId) return; // wait until branch known

    fetch("/data/inventory.json")
      .then((res) => res.json())
      .then((data) => {
        const branch = data.find((b: any) => b.branchId === branchId);
        setItems(branch ? branch.items : []);
      })
      .catch((err) => console.error("Inventory load error:", err));
  }, [selectedBranch]);

  const handleSave = (item: InventoryItem) => {
    setItems((prev) => {
      const index = prev.findIndex((p) => p.id === item.id);
      let updated: InventoryItem[];

      if (index >= 0) {
        // ✅ Update existing item
        updated = [...prev];
        updated[index] = item;
      } else {
        // ✅ Add new item (when it's newly created)
        updated = [...prev, item];
      }

      console.log("✅ Updated inventory:", updated);
      return updated;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mt-4">
        <h2 className="text-lg font-semibold">Inventory Management</h2>
        <button
          className="btn-primary mr-4 px-3 py-1.5 text-sm"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          + Add Item
        </button>
      </div>

      <InventoryQuickStats items={items} />
      <ThresholdAlertBar items={items} />
      <InventoryTable
        items={items}
        onEdit={(it) => {
          setEditing(it);
          setModalOpen(true);
        }}
      />

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
