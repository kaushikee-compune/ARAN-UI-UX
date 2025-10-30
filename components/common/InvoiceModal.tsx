"use client";
import React from "react";
import InvoiceForm from "./InvoiceForm";

export type InvoiceModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (amount: number, patientName: string) => void;
  defaultPatientName?: string;
};

export default function InvoiceModal({
  open,
  onClose,
  onSave,
  defaultPatientName,
}: InvoiceModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="ui-card w-[min(95vw,480px)] p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-base font-semibold mb-3">Create Invoice</h2>

        <InvoiceForm
          defaultPatientName={defaultPatientName}
          onSave={(invoice) => {
            onSave(invoice.total, invoice.patientName);
          }}
        />
      </div>
    </div>
  );
}
