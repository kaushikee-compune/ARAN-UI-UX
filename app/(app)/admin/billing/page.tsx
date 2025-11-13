"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useBranch } from "@/context/BranchContext";

import BillingSummaryCards from "@/components/admin/billing/BillingSummaryCards";
import InvoiceTable from "@/components/admin/billing/InvoiceTable";
import RevenueCharts from "@/components/admin/billing/RevenueCharts";

type RawInvoice = {
  invoiceId: string;
  branchId: string;
  date: string;
  patientName: string;
  doctorName: string;
  totalAmount: number;
  paymentMode: string;
  status: string;
  reconciled: boolean;
  module: string;
};

export default function BillingPage() {
  const { selectedBranch } = useBranch();

  const [invoices, setInvoices] = useState<RawInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract branchId EXACTLY like RoleAccessPage
  const branchId =
    typeof selectedBranch === "string"
      ? selectedBranch
      : selectedBranch?.id ?? null;

  /* -------------------------------------------------------------------------- */
  /*                              ALWAYS RUN HOOKS                              */
  /* -------------------------------------------------------------------------- */

  // Load data
  useEffect(() => {
    if (!branchId) return;

    async function load() {
      try {
        const url = `${window.location.origin}/data/invoices.json`;
        const res = await fetch(url, { cache: "no-store" });
        const data: RawInvoice[] = await res.json();
        const filtered = data.filter((inv) => inv.branchId === branchId);
        setInvoices(filtered);
      } catch (err) {
        console.error("Billing: Failed to load invoices:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [branchId]);

  // SUMMARY hook
  const summary = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const monthISO = new Date().toISOString().slice(0, 7);

    let today = 0;
    let month = 0;
    let pending = 0;
    let reconciled = 0;

    invoices.forEach((inv) => {
      const d = inv.date.slice(0, 10);
      const m = inv.date.slice(0, 7);

      if (d === todayISO) today += inv.totalAmount;
      if (m === monthISO) month += inv.totalAmount;
      if (inv.status.toLowerCase() !== "paid") pending += inv.totalAmount;
      if (inv.reconciled) reconciled += inv.totalAmount;
    });

    return {
      today,
      month,
      pending,
      reconciled,
      totalCount: invoices.length,
    };
  }, [invoices]);

  // MONTHLY chart hook
  const monthlyChart = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => {
      const m = inv.date.slice(0, 7);
      map[m] = (map[m] || 0) + inv.totalAmount;
    });
    return Object.entries(map).map(([month, amount]) => ({ month, amount }));
  }, [invoices]);

  // MODE chart hook
  const modeChart = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => {
      map[inv.paymentMode] = (map[inv.paymentMode] || 0) + inv.totalAmount;
    });
    return Object.entries(map).map(([mode, value]) => ({ mode, value }));
  }, [invoices]);

  /* -------------------------------------------------------------------------- */
  /*          NOW SAFE TO RETURN — ALL HOOKS HAVE BEEN EXECUTED ABOVE          */
  /* -------------------------------------------------------------------------- */

  if (!branchId) {
    return <div className="p-6 text-gray-500">Select a branch...</div>;
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading invoices...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Payments & Billing</h1>

      <BillingSummaryCards data={summary} />

      <RevenueCharts monthly={monthlyChart} modes={modeChart} />

      <InvoiceTable
        invoices={invoices}
        onToggleReconcile={(invoiceId) => {
          setInvoices((prev) =>
            prev.map((inv) =>
              inv.invoiceId === invoiceId
                ? { ...inv, reconciled: !inv.reconciled }
                : inv
            )
          );
        }}
      />
    </div>
  );
}
