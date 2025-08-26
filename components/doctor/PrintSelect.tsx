"use client";

import React, { useState, useEffect, useRef } from "react";

const OPTIONS = [
  "Prescription",
  "Vitals",
  "Consultation report",
  "Immunization",
  "Discharge summary",
  "Invoice",
  "Lab Reports",
  "Lab Request",
] as const;

export type PrintOption = (typeof OPTIONS)[number];

export default function PrintSelect({
  onDone,
  onClose,
}: {
  onDone: (opts: PrintOption[]) => void;
  onClose: () => void;
}) {
  const [sel, setSel] = useState<Set<PrintOption>>(new Set());
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, [onClose]);

  const toggle = (opt: PrintOption) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(opt) ? n.delete(opt) : n.add(opt);
      return n;
    });

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-2 w-60 ui-card p-3 border rounded-lg shadow bg-white z-50"
    >
      <div className="text-sm font-semibold mb-2">Select documents</div>
      <div className="max-h-64 overflow-auto space-y-1 text-sm">
        {OPTIONS.map((o) => (
          <label
            key={o}
            className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={sel.has(o)}
              onChange={() => toggle(o)}
            />
            {o}
          </label>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="px-2 py-1 text-xs border rounded bg-gray-900 text-white hover:bg-black disabled:opacity-50"
          disabled={sel.size === 0}
          onClick={() => {
            onDone(Array.from(sel));
            onClose();
          }}
        >
          Print
        </button>
      </div>
    </div>
  );
}
