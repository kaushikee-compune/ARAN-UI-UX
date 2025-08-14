"use client";

/**
 * ARAN • Doctor → Patients (New Consultation Canvas)
 * --------------------------------------------------
 * Spec:
 * 1) Horizontal menu under top header with 5 items + a sidebar toggle switch on the right.
 * 2) Below it, a white paper "health-record pane":
 *    - Center: small logo
 *    - Left: patient demographics
 *    - Right (top): small icon + label "Patient Summary"
 *    - Rest: empty (for future content)
 * 3) A vertical toolbar on the RIGHT EDGE of the health-record pane with icons only
 *    (tooltips on hover): Voice, Form, Scribe.
 * 4) Floating bottom bar with Save and Submit.
 *
 * Notes:
 * - No auto-collapse. Only the toggle switch controls the sidebar via localStorage.
 * - Uses /public/ABHA.png as a placeholder logo. Replace if needed.
 */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";

// --------------------------- Types ---------------------------
type TabKey = "consultation" | "lab" | "immunization" | "discharge" | "consent";

// --------------------------- Page ----------------------------
export default function PatientsPage() {
  // Active tab
  const [active, setActive] = useState<TabKey>("consultation");

  // Sidebar toggle (sync with layout via storage + custom event)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    try {
      setSidebarCollapsed(
        localStorage.getItem("aran:sidebarCollapsed") === "1"
      );
    } catch {}
  }, []);
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem("aran:sidebarCollapsed", next ? "1" : "0");
      window.dispatchEvent(new Event("aran:sidebar"));
    } catch {}
  };

  // Patient snapshot (left demographics)
  const patient = useMemo(
    () => ({
      name: "Ms Shampa Goswami",
      age: "52 yrs",
      gender: "Female",
      abhaNumber: "91-5510-2061-4469",
      abhaAddress: "shampa.go@sbx",
    }),
    []
  );

  // Toast (for Save/Submit feedback)
  const [toast, setToast] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);
  const show = (t: typeof toast) => setToast(t);
  const onSave = useCallback(
    () => show({ type: "info", message: "Draft saved." }),
    []
  );
  const onSubmit = useCallback(
    () => show({ type: "success", message: "Record submitted." }),
    []
  );

  // ------------------------- Render --------------------------
  return (
    <div className="space-y-3">
      {/* 1) Horizontal Menu + Sidebar Toggle */}
      <div className="ui-card px-3 py-2">
        <div className="flex items-center gap-2">
          <TabButton
            active={active === "consultation"}
            onClick={() => setActive("consultation")}
            label="Consultation"
          />
          <TabButton
            active={active === "lab"}
            onClick={() => setActive("lab")}
            label="Lab Request"
          />
          <TabButton
            active={active === "immunization"}
            onClick={() => setActive("immunization")}
            label="Immunization Record"
          />
          <TabButton
            active={active === "discharge"}
            onClick={() => setActive("discharge")}
            label="Discharge Summary"
          />
          <TabButton
            active={active === "consent"}
            onClick={() => setActive("consent")}
            label="Consent"
          />

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600">Sidebar</span>
            <Switch checked={sidebarCollapsed} onChange={toggleSidebar} />
          </div>
        </div>
      </div>

      {/* 2) Health-record Pane (paper canvas) */}
      <div className="relative">
        {/* The canvas frame */}
        <div
          className="relative mx-auto bg-white border rounded-xl shadow-sm"
          style={{
            maxWidth: 1100,
            minHeight: 620,
            // small paper-like texture using subtle gradient
            background:
              "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,252,1) 100%)",
          }}
        >
          {/* Paper inner padding */}
          <div className="p-4 md:p-6">
            {/* Header row inside paper */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-start">
              {/* Left: Patient demographics */}
              <div className="min-w-0 pr-3">
                <div className="text-xs text-gray-500 mb-1">Patient</div>
                <div className="text-sm font-semibold">{patient.name}</div>
                <div className="text-xs text-gray-700 mt-0.5">
                  {patient.gender} • {patient.age}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  ABHA No: {patient.abhaNumber}
                </div>
                <div className="text-xs text-gray-600">
                  ABHA Address: {patient.abhaAddress}
                </div>
              </div>

              {/* Center: Logo */}
              <Image
                src="/whitelogo.png" // because it's now inside /public
                alt="ARAN Logo"
                width={40} // adjust as needed
                height={40}
              />
              {/* Right: Patient Summary (icon + label) */}
              <div className="flex items-start justify-end pl-3">
                <button
                  className="inline-flex items-center gap-2 text-xs text-gray-700 hover:text-gray-900"
                  title="Open Patient Summary"
                >
                  <SummaryIcon className="w-4 h-4" />
                  <span className="font-medium">Patient Summary</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="my-3 border-t border-gray-200" />

            {/* Body area intentionally left empty as per spec */}
            <div className="min-h-[420px] text-center text-xs text-gray-400 pt-6">
              (Health record content will appear here…)
            </div>
          </div>

          {/* 3) Right-edge vertical toolbar (icons only, with tooltips) */}
          <div className="absolute top-6 -right-14 flex flex-col gap-2">
            <ToolButton label="Voice">
              <MicIcon className="w-4 h-4" />
            </ToolButton>
            <ToolButton label="Form">
              <FormIcon className="w-4 h-4" />
            </ToolButton>
            <ToolButton label="Scribe">
              <ScribeIcon className="w-4 h-4" />
            </ToolButton>
          </div>
        </div>
      </div>

      {/* 4) Floating bottom bar */}
      <div className="sticky bottom-4">
        <div className="ui-card px-3 py-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Active:</span> {labelFor(active)}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-outline" onClick={onSave}>
              Save
            </button>
            <button className="btn-primary" onClick={onSubmit}>
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} onClose={() => setToast(null)}>
          {toast.message}
        </Toast>
      )}
    </div>
  );
}

// ------------------------- Small UI pieces -------------------------

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={[
        "px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition",
        active ? "bg-gray-900 text-white" : "hover:bg-gray-100",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className={[
        "relative inline-flex h-5 w-9 items-center rounded-full border transition",
        checked ? "bg-gray-900 border-gray-900" : "bg-white hover:bg-gray-50",
      ].join(" ")}
      title={checked ? "Expand sidebar" : "Collapse sidebar"}
    >
      <span
        className={[
          "inline-block h-4 w-4 transform rounded-full bg-white transition",
          checked ? "translate-x-4" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function ToolButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className="group relative inline-flex items-center justify-center w-9 h-9 rounded-full border bg-white shadow hover:bg-gray-50"
      title={label}
    >
      {children}
      {/* custom tooltip on hover */}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-3 transition text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded">
        {label}
      </span>
    </button>
  );
}

// --------------------------- Icons ---------------------------
function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 19v2" />
    </svg>
  );
}
function FormIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
function ScribeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path d="M4 20h12l4-4V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16Z" />
      <path d="M14 2v6h6" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  );
}
function SummaryIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

// --------------------------- Helpers ---------------------------
function labelFor(key: TabKey) {
  switch (key) {
    case "consultation":
      return "Consultation";
    case "lab":
      return "Lab Request";
    case "immunization":
      return "Immunization Record";
    case "discharge":
      return "Discharge Summary";
    case "consent":
      return "Consent";
  }
}

// Simple toast
function Toast({
  type,
  children,
  onClose,
}: {
  type: "success" | "error" | "info";
  children: React.ReactNode;
  onClose: () => void;
}) {
  const color =
    type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#2563eb";
  useEffect(() => {
    const t = setTimeout(onClose, 1800);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div
        className="rounded-lg shadow-lg border bg-white px-4 py-3 text-sm"
        style={{ borderColor: color }}
      >
        <div className="flex items-start gap-2">
          <div className="mt-[2px]" style={{ color }}>
            {type === "success" ? "✔" : type === "error" ? "⚠" : "ℹ"}
          </div>
          <div className="text-gray-800">{children}</div>
          <button
            onClick={onClose}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
