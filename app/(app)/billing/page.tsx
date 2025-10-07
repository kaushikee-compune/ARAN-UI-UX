"use client";

import React, { useMemo, useState } from "react";

/* ---------------- Types ---------------- */
type Invoice = {
  id: string;
  patientName: string;
  patientUHID: string;
  abhaAddress: string;
  phone: string;
  date: string; // yyyy-mm-dd
  amount: number;
  status: "Paid" | "Unpaid";
};

type Payment = {
  id: string;
  patientUHID: string;
  invoiceId: string;
  date: string;
  method: "Cash" | "Card" | "UPI" | "Insurance";
  amount: number;
};

type InvoiceItem = {
  service: string;
  qty: number;
  price: number;
};

/* ---------------- Mock Data ---------------- */
const MOCK_INVOICES: Invoice[] = [
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

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "PAY-5001",
    patientUHID: "UHID-001",
    invoiceId: "INV-1001",
    date: "2025-10-07",
    method: "UPI",
    amount: 1500,
  },
  {
    id: "PAY-5002",
    patientUHID: "UHID-002",
    invoiceId: "INV-1002",
    date: "2025-10-07",
    method: "Cash",
    amount: 2200,
  },
];

/* ---------------- Components ---------------- */
function HeaderPanel({
  date,
  onDateChange,
  search,
  onSearchChange,
  onCreateInvoice,
}: {
  date: string;
  onDateChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onCreateInvoice: () => void;
}) {
  return (
    <div className="ui-card p-3 flex flex-wrap gap-3 items-end justify-between">
      {/* Date filter */}
      <div>
        <label className="text-[11px] text-gray-600 block">Date</label>
        <input
          type="date"
          className="ui-input"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {/* Smart search */}
      <div className="flex-1 min-w-[220px]">
        <label className="text-[11px] text-gray-600 block">Search Patient</label>
        <input
          type="text"
          placeholder="Name, UHID, ABHA, Phone"
          className="ui-input w-full"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Create invoice */}
      <button
        onClick={onCreateInvoice}
        className="px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700"
      >
        + Create Invoice
      </button>
    </div>
  );
}

function InvoiceList({
  invoices,
  onShowHistory,
}: {
  invoices: Invoice[];
  onShowHistory: (uhid: string) => void;
}) {
  return (
    <div className="ui-card p-4">
      <h2 className="text-lg font-semibold mb-3">Invoices</h2>
      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <Th>Invoice</Th>
            <Th>Patient</Th>
            <Th>UHID</Th>
            <Th>ABHA</Th>
            <Th>Phone</Th>
            <Th>Date</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t">
              <Td>{inv.id}</Td>
              <Td>{inv.patientName}</Td>
              <Td>{inv.patientUHID}</Td>
              <Td>{inv.abhaAddress}</Td>
              <Td>{inv.phone}</Td>
              <Td>{inv.date}</Td>
              <Td>₹{inv.amount}</Td>
              <Td>{inv.status}</Td>
              <Td>
                <button
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  onClick={() => onShowHistory(inv.patientUHID)}
                >
                  Payment History
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentHistory({
  payments,
  patientUHID,
  onClose,
}: {
  payments: Payment[];
  patientUHID: string | null;
  onClose: () => void;
}) {
  if (!patientUHID) return null;
  const filtered = payments.filter((p) => p.patientUHID === patientUHID);

  return (
    <div className="ui-card p-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold">
          Payment History for {patientUHID}
        </h3>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
        >
          Close
        </button>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 mt-2">No payments found.</p>
      ) : (
        <table className="w-full border text-sm mt-3">
          <thead className="bg-gray-50">
            <tr>
              <Th>Payment ID</Th>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th>Method</Th>
              <Th>Amount</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pay) => (
              <tr key={pay.id} className="border-t">
                <Td>{pay.id}</Td>
                <Td>{pay.invoiceId}</Td>
                <Td>{pay.date}</Td>
                <Td>{pay.method}</Td>
                <Td>₹{pay.amount}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* -------- Floating Invoice Panel -------- */
function InvoicePanel({
  patientName,
  onClose,
}: {
  patientName: string;
  onClose: () => void;
}) {
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
    <div className="fixed inset-0 bg-black/30 flex justify-end z-50">
      <div className="w-full max-w-md bg-white h-full shadow-lg p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Create Invoice</h2>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        <div className="text-sm mb-4">
          <div>Patient: <strong>{patientName || "—"}</strong></div>
          <div>Date: {new Date().toLocaleDateString()}</div>
        </div>

        {/* Items */}
        <table className="w-full border text-sm mb-3">
          <thead className="bg-gray-50">
            <tr>
              <Th>Service</Th>
              <Th>Qty</Th>
              <Th>Price</Th>
              <Th>Total</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-t">
                <Td>
                  <input
                    className="ui-input w-full"
                    value={it.service}
                    onChange={(e) =>
                      updateItem(idx, { service: e.target.value })
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className="ui-input w-16"
                    value={it.qty}
                    onChange={(e) =>
                      updateItem(idx, { qty: Number(e.target.value) })
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className="ui-input w-20"
                    value={it.price}
                    onChange={(e) =>
                      updateItem(idx, { price: Number(e.target.value) })
                    }
                  />
                </Td>
                <Td>₹{it.qty * it.price}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50 mb-3"
          onClick={() => setItems([...items, { service: "", qty: 1, price: 0 }])}
        >
          + Add Item
        </button>

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>GST (%)</span>
            <input
              type="number"
              className="ui-input w-16 text-right"
              value={gst}
              onChange={(e) => setGst(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-between items-center">
            <span>Discount</span>
            <input
              type="number"
              className="ui-input w-20 text-right"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-4 text-right">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
            Save Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-2 py-1.5 text-left text-gray-700 border text-xs sm:text-sm">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-2 py-1.5 text-gray-900 break-words whitespace-normal align-top">
      {children}
    </td>
  );
}

/* ---------------- Page ---------------- */
export default function BillingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showInvoicePanel, setShowInvoicePanel] = useState(false);

  const filteredInvoices = useMemo(() => {
    return MOCK_INVOICES.filter(
      (inv) =>
        inv.date === date &&
        (inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
          inv.patientUHID.toLowerCase().includes(search.toLowerCase()) ||
          inv.abhaAddress.toLowerCase().includes(search.toLowerCase()) ||
          inv.phone.includes(search))
    );
  }, [date, search]);

  const patientName =
    search && filteredInvoices.length > 0
      ? filteredInvoices[0].patientName
      : search;

  return (
    <div className="space-y-4">
      <HeaderPanel
        date={date}
        onDateChange={setDate}
        search={search}
        onSearchChange={setSearch}
        onCreateInvoice={() => setShowInvoicePanel(true)}
      />
      <InvoiceList invoices={filteredInvoices} onShowHistory={setSelectedPatient} />
      <PaymentHistory
        payments={MOCK_PAYMENTS}
        patientUHID={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

      {showInvoicePanel && (
        <InvoicePanel
          patientName={patientName || ""}
          onClose={() => setShowInvoicePanel(false)}
        />
      )}
    </div>
  );
}
