"use client";
import React, { useState, useEffect } from "react";
import type { InventoryItem } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  editing?: InventoryItem | null;
  branchId: string; // ✅ added
}

export default function InventoryFormModal({
  open,
  onClose,
  onSave,
  editing,
  branchId, // ✅ destructure here
}: Props) {
  const [form, setForm] = useState<InventoryItem>({
    id: "",
    branchId: "",
    name: "",
    category: "",
    unit: "",
    stockQty: 0,
    threshold: 0,
    supplier: "",
  });

  useEffect(() => {
    if (editing) setForm(editing);
    else
      setForm({
        id: "",
        branchId,
        name: "",
        category: "",
        unit: "",
        stockQty: 0,
        threshold: 0,
        supplier: "",
      });
  }, [editing, branchId]);

  if (!open) return null;

  const handleSubmit = () => {
    const id = editing ? editing.id : `I${Date.now()}`;
    const payload: InventoryItem = { ...form, id, branchId }; // ✅ branchId + id explicitly set
    onSave(payload);
    onClose();
  };

  const update = (k: keyof InventoryItem, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="ui-card p-4 w-[min(90vw,420px)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">
            {editing ? "Edit Item" : "Add Item"}
          </h3>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-2 text-sm">
          <Input label="Name" value={form.name} onChange={(v) => update("name", v)} />
          <Input label="Category" value={form.category} onChange={(v) => update("category", v)} />
          <Input label="Unit" value={form.unit} onChange={(v) => update("unit", v)} />
          <Input
            label="Stock Quantity"
            type="number"
            value={String(form.stockQty)}
            onChange={(v) => update("stockQty", Number(v))}
          />
          <Input
            label="Threshold"
            type="number"
            value={String(form.threshold)}
            onChange={(v) => update("threshold", Number(v))}
          />
          <Input
            label="Supplier"
            value={form.supplier || ""}
            onChange={(v) => update("supplier", v)}
          />
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button className="btn-outline px-3 py-1 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary px-3 py-1 text-sm" onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-[11px] text-gray-600">{label}</label>
      <input
        type={type}
        className="ui-input w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
