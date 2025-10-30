"use client";

import React, { useState, useMemo } from "react";
import InvoiceModal from "@/components/common/InvoiceModal";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */
type Invoice = {
  id: string;
  patientName: string;
  patientUHID: string;
  abhaAddress: string;
  phone: string;
  date: string;
  amount: number;
  status: "Paid" | "Unpaid";
};

type InvoiceItem = { service: string; qty: number; price: number };

/* -------------------------------------------------------------------------- */
/*                             Mock Initial Data                              */
/* -------------------------------------------------------------------------- */
const INITIAL_INVOICES: Invoice[] = [
  {
    id: "INV-1001",
    patientName: "Sampath Rao",
    patientUHID: "UHID-001",
    abhaAddress: "sampath@abdm",
    phone: "9876543210",
    date: "2025-10-07",
    amount: 1500,
    status: "Paid",
  },
  {
    id: "INV-1002",
    patientName: "Meena Kumari",
    patientUHID: "UHID-002",
    abhaAddress: "meena@abdm",
    phone: "9123456780",
    date: "2025-10-07",
    amount: 2200,
    status: "Unpaid",
  },
];

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */
export default function BillingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const filtered = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.date === date &&
        (inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
          inv.patientUHID.toLowerCase().includes(search.toLowerCase()) ||
          inv.abhaAddress.toLowerCase().includes(search.toLowerCase()) ||
          inv.phone.includes(search))
    );
  }, [invoices, date, search]);

  /* ---------------------------------------------------------------------- */
  /*                        Save new invoice to table                       */
  /* ---------------------------------------------------------------------- */
  const handleSaveInvoice = (amount: number, patientName: string) => {
    const newInv: Invoice = {
      id: `INV-${1000 + invoices.length + 1}`,
      patientName: patientName || "New Patient",
      patientUHID: `UHID-${String(invoices.length + 1).padStart(3, "0")}`,
      abhaAddress: "new@abdm",
      phone: "9999999999",
      date,
      amount,
      status: "Unpaid",
    };
    setInvoices((prev) => [...prev, newInv]);
    setShowInvoiceModal(false);
  };

  /* ---------------------------------------------------------------------- */
  /*                                  JSX                                   */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-3">
      {/* ----------------------- Header Filter Bar ----------------------- */}
      <div className="ui-card flex items-center gap-3 p-3">
        {/* Date */}
        <div className="flex items-center shrink-0">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ui-input w-[7.5rem]" // ~120px, compact and uniform height
          />
        </div>

        {/* Search */}
        <div className="flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search (name, UHID, phone, ABHA no/address)…"
            className="ui-input w-full"
          />
        </div>

        {/* Button */}
        <div className="shrink-0">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            + Create Invoice
          </button>
        </div>
      </div>

      {/* -------------------------- Invoice List -------------------------- */}
      <div className="ui-card p-4 overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Invoice ID",
                "Patient",
                "UHID",
                "ABHA",
                "Phone",
                "Date",
                "Amount",
                "Status",
              ].map((h) => (
                <th key={h} className="px-2 py-1.5 text-left border-b">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No invoices found.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-1.5">{inv.id}</td>
                  <td className="px-2 py-1.5">{inv.patientName}</td>
                  <td className="px-2 py-1.5">{inv.patientUHID}</td>
                  <td className="px-2 py-1.5">{inv.abhaAddress}</td>
                  <td className="px-2 py-1.5">{inv.phone}</td>
                  <td className="px-2 py-1.5">{inv.date}</td>
                  <td className="px-2 py-1.5">₹{inv.amount}</td>
                  <td
                    className={`px-2 py-1.5 font-semibold ${
                      inv.status === "Paid" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {inv.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ----------------------- Centered Invoice Modal ----------------------- */}
      <InvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSave={handleSaveInvoice}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Invoice Form                                  */
/* -------------------------------------------------------------------------- */
function InvoiceForm({
  onSave,
}: {
  onSave: (amount: number, patientName: string) => void;
}) {
  const [patientName, setPatientName] = useState("");
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
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <label className="text-xs text-gray-600">Patient Name</label>
        <input
          className="ui-input"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="Enter patient name"
        />
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left border">Service</th>
            <th className="px-2 py-1 border">Qty</th>
            <th className="px-2 py-1 border">Price</th>
            <th className="px-2 py-1 border">Total</th>
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
              <td className="px-2 py-1 border w-20">
                <input
                  type="number"
                  className="ui-input w-full"
                  value={it.qty}
                  onChange={(e) => updateItem(idx, { qty: +e.target.value })}
                />
              </td>
              <td className="px-2 py-1 border w-28">
                <input
                  type="number"
                  className="ui-input w-full"
                  value={it.price}
                  onChange={(e) => updateItem(idx, { price: +e.target.value })}
                />
              </td>
              <td className="px-2 py-1 border text-right">
                ₹{it.qty * it.price}
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

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
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
          <span>₹{total}</span>
        </div>
      </div>

      <div className="text-right mt-4">
        <button
          onClick={() => onSave(total, patientName)}
          className="btn-primary px-4 py-2"
        >
          Save Invoice
        </button>
      </div>
    </div>
  );
}
