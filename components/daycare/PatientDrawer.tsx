"use client";

import React, { useState } from "react";
import type { Bed } from "./types";
import InvoiceForm from "@/components/common/InvoiceForm";

interface PatientDrawerProps {
  bed: Bed;
  onClose: () => void;
  onDischarge: (bedId: string) => void;
}

export default function PatientDrawer({
  bed,
  onClose,
  onDischarge,
}: PatientDrawerProps) {
  const [tab, setTab] = useState<"vitals" | "notes" | "billing" | "reports">(
    "vitals"
  );

  // Local demo states
  const [note, setNote] = useState("");
  const [vitals, setVitals] = useState({ temp: "", bp: "", pulse: "" });
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const discharge = () => {
    if (confirm("Mark this patient as discharged?")) {
      onDischarge(bed.bedId);
      onClose();
    }
  };

  const handleSave = () => {
    // Show demo modal with the collected info
    setShowModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="ui-card w-[min(92vw,600px)] max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div>
              <div className="font-semibold text-sm text-gray-900">
                {bed.patient?.name || "Unnamed Patient"}
              </div>
              <div className="text-xs text-gray-500">
                {bed.label} • {bed.patient?.age} • {bed.patient?.gender}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b text-sm">
            {["vitals", "notes", "billing", "reports"].map((t) => (
              <button
                key={t}
                onClick={() =>
                  setTab(t as "vitals" | "notes" | "billing" | "reports")
                }
                className={[
                  "flex-1 py-2 capitalize transition-colors",
                  tab === t
                    ? "font-medium text-[--secondary] border-b-2 border-[--secondary]"
                    : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-800">
            {tab === "vitals" && (
              <section className="space-y-2">
                <h3 className="font-semibold mb-2 text-gray-800">
                  Hourly Vitals
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    className="ui-input"
                    placeholder="Temp (°C)"
                    value={vitals.temp}
                    onChange={(e) =>
                      setVitals({ ...vitals, temp: e.target.value })
                    }
                  />
                  <input
                    className="ui-input"
                    placeholder="BP (mmHg)"
                    value={vitals.bp}
                    onChange={(e) =>
                      setVitals({ ...vitals, bp: e.target.value })
                    }
                  />
                  <input
                    className="ui-input"
                    placeholder="Pulse (/min)"
                    value={vitals.pulse}
                    onChange={(e) =>
                      setVitals({ ...vitals, pulse: e.target.value })
                    }
                  />
                </div>
              </section>
            )}

            {tab === "notes" && (
              <section>
                <h3 className="font-semibold mb-2 text-gray-800">
                  Doctor / Nursing Notes
                </h3>
                <textarea
                  className="ui-textarea w-full min-h-[100px]"
                  placeholder="Add new note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </section>
            )}

            {tab === "billing" && (
              <section>
                <h3 className="font-semibold mb-2 text-gray-800">Billing</h3>
                <InvoiceForm
                  defaultPatientName={bed.patient?.name}
                  onSave={(invoice) => {
                    setInvoiceData(invoice);
                    console.log("Invoice saved inline:", invoice);
                  }}
                />
              </section>
            )}

            {tab === "reports" && (
              <section>
                <h3 className="font-semibold mb-2 text-gray-800">Reports</h3>
                <div className="text-xs text-gray-500">
                  (Upload / preview reports here)
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-5 py-3 flex justify-between items-center">
            <button className="btn-primary" onClick={discharge}>
              Discharge
            </button>
            <button className="btn-accent text-sm px-4" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Demo modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="ui-card w-[min(95vw,500px)] p-5 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <h2 className="text-base font-semibold mb-3">
              Saved Data (Demo Only)
            </h2>

            <div className="space-y-3 text-sm text-gray-800">
              <div>
                <strong>Patient:</strong> {bed.patient?.name || "-"}
              </div>
              <div>
                <strong>Vitals:</strong>{" "}
                {vitals.temp || vitals.bp || vitals.pulse
                  ? `${vitals.temp}°C / ${vitals.bp} / ${vitals.pulse} bpm`
                  : "(none)"}
              </div>
              <div>
                <strong>Notes:</strong> {note || "(none)"}
              </div>
              <div>
                <strong>Invoice:</strong>{" "}
                {invoiceData
                  ? `Amount ₹${invoiceData.amount || 0}`
                  : "(no invoice saved)"}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="btn-outline text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
