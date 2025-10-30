"use client";
import React, { useState } from "react";
import { generateInvoicePdf } from "@/lib/pdf/generateInvoicePdf";

export type InvoiceItem = { service: string; qty: number; price: number };

export interface InvoiceFormProps {
  defaultPatientName?: string;
  onSave: (invoice: {
    patientName: string;
    items: InvoiceItem[];
    gst: number;
    discount: number;
    total: number;
  }) => void;
}

export default function InvoiceForm({ defaultPatientName, onSave }: InvoiceFormProps) {
  const [patientName, setPatientName] = useState(defaultPatientName || "");
  const [items, setItems] = useState<InvoiceItem[]>([
    { service: "Consultation", qty: 1, price: 500 },
  ]);
  const [gst, setGst] = useState(18);
  const [discount, setDiscount] = useState(0);

  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const gstAmount = (subtotal * gst) / 100;
  const total = subtotal + gstAmount - discount;

  const updateItem = (i: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Patient */}
      <div className="grid gap-2">
        <label className="text-xs text-gray-600">Patient Name</label>
        <input
          className="ui-input"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="Enter patient name"
        />
      </div>

      {/* Table */}
      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left border">Service</th>
            <th className="px-2 py-1 border w-20 text-center">Qty</th>
            <th className="px-2 py-1 border w-28 text-center">Price</th>
            <th className="px-2 py-1 border text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-2 py-1 border">
                <input
                  className="ui-input w-full"
                  value={it.service}
                  onChange={(e) => updateItem(idx, { service: e.target.value })}
                />
              </td>
              <td className="px-2 py-1 border text-center">
                <input
                  type="number"
                  className="ui-input w-full text-center"
                  value={it.qty}
                  onChange={(e) => updateItem(idx, { qty: +e.target.value })}
                />
              </td>
              <td className="px-2 py-1 border text-center">
                <input
                  type="number"
                  className="ui-input w-full text-center"
                  value={it.price}
                  onChange={(e) => updateItem(idx, { price: +e.target.value })}
                />
              </td>
              <td className="px-2 py-1 border text-right">
                Rs. {(it.qty * it.price).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={() => setItems([...items, { service: "", qty: 1, price: 0 }])}
        className="btn-outline text-sm"
      >
        + Add Item
      </button>

      {/* Summary */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rs. {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (%)</span>
          <input
            type="number"
            className="ui-input w-20"
            value={gst}
            onChange={(e) => setGst(+e.target.value)}
          />
        </div>
        <div className="flex justify-between">
          <span>Discount</span>
          <input
            type="number"
            className="ui-input w-20"
            value={discount}
            onChange={(e) => setDiscount(+e.target.value)}
          />
        </div>
        <div className="flex justify-between font-semibold mt-1 border-t pt-1">
          <span>Total</span>
          <span className="text-blue-600">Rs. {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="text-right mt-4 flex justify-end gap-2">
        <button
          onClick={() =>
            generateInvoicePdf({
              invoiceId: `INV-${Math.floor(Math.random() * 10000)}`,
              patientName,
              date: new Date().toISOString().slice(0, 10),
              items,
              gst,
              discount,
              total,
            })
          }
          className="btn-accent"
        >
          Print
        </button>

        <button
          onClick={() => onSave({ patientName, items, gst, discount, total })}
          className="btn-primary px-4 py-2"
        >
          Save Invoice
        </button>
      </div>
    </div>
  );
}
