"use client";

import React from "react";

export type Invoice = {
  invoiceId: string;
  date: string;
  patientName: string;
  doctorName: string;
  totalAmount: number;
  paymentMode: string;
  status: string;
  reconciled: boolean;
};

type Props = {
  invoices: Invoice[];
  onToggleReconcile: (invoiceId: string) => void;
};

export default function InvoiceTable({ invoices, onToggleReconcile }: Props) {
  return (
    <div className="ui-card p-4 mt-4 ">
      <div className="text-sm font-semibold justify-center items-center mb-3">Generated Invoices</div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm ">
          <thead className="bg-gray-50">
            <tr>
              <Th>Invoice ID</Th>
              <Th>Date</Th>
              <Th>Patient</Th>
              <Th>Doctor</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Mode</Th>
              <Th>Reconciled</Th>
              <Th>Action</Th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.invoiceId} className="border-t border-gray-300">
                <Td>{inv.invoiceId}</Td>
                <Td>{new Date(inv.date).toLocaleDateString()}</Td>
                <Td>{inv.patientName}</Td>
                <Td>{inv.doctorName}</Td>
                <Td>₹{inv.totalAmount.toLocaleString()}</Td>
                <Td>{inv.status}</Td>
                <Td>{inv.paymentMode}</Td>
                <Td>
                  {inv.reconciled ? (
                    <span className="text-emerald-600 font-medium">✔ Yes</span>
                  ) : (
                    <span className="text-amber-600 font-medium">✗ No</span>
                  )}
                </Td>
                <Td>
                  <button
                    onClick={() => onToggleReconcile(inv.invoiceId)}
                    className="text-xs px-2 py-1 rounded shadow-lg bg-gray-50 hover:bg-gray-100"
                  >
                  {/* {inv.status.toLowerCase() === "paid" ? "Paid" : "Not Paid"} */}
                  Change Status
                  </button>
                </Td>
              </tr>
            ))}

            {invoices.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-gray-500 py-4">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-gray-700 border-b border-gray-300 text-xs">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-gray-800 align-top">{children}</td>;
}
