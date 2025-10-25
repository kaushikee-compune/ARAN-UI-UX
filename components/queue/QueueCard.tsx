"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";

export type QueueStatus =
  | "waiting"
  | "inconsult"
  | "paused"
  | "completed"
  | "noshow";

export type QueueEntry = {
  uhid: string;
  token: string;
  name: string;
  gender: string;
  abhaAddress: string;
  status: QueueStatus;
  isNew?: boolean;
  doctorId?: string;
  docname?: string; // ✅ NEW: consulting doctor
  vitalsCaptured?: boolean;
};

/* ---------- Color Mapping ---------- */
const STATUS_COLORS: Record<QueueStatus, string> = {
  waiting: "#FACC15", // Yellow
  inconsult: "#3B82F6", // Blue
  paused: "#F59E0B", // Amber
  completed: "#22C55E", // Green
  noshow: "#EF4444", // Red
};

/* ---------- Component ---------- */
export default function QueueCard({
  entry,
  onMoveUp,
  onMoveDown,
  onStatusChange,
  onStart, // ✅ added
}: {
  entry: QueueEntry;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onStatusChange?: (uhid: string, status: QueueStatus) => void;
  onStart?: () => void; // ✅ added
}) {
  const [menu, setMenu] = useState(false);
  const color = STATUS_COLORS[entry.status || "waiting"];
  const router = useRouter();

  /* ---------- Status Handlers ---------- */
  const handleStart = () => {
  // mark patient as in consultation
  onStatusChange?.(entry.uhid, "inconsult");

  // use parent's handler (role-based) if provided
  if (onStart) {
    onStart();
  }
};

  const handlePause = () => onStatusChange?.(entry.uhid, "paused");
  const handleResume = () => onStatusChange?.(entry.uhid, "inconsult");
  const handleEnd = () => onStatusChange?.(entry.uhid, "completed");
  const handleNoShow = () => onStatusChange?.(entry.uhid, "noshow");

  /* ---------- Action Renderer ---------- */
  const renderActions = () => {
    switch (entry.status) {
      case "waiting":
        return (
          <div className="flex gap-2 text-gray-600">
            {onStart && (
            <IconBtn title="Start Consultation" onClick={handleStart}>
              <Play />
            </IconBtn>
            )}
            <IconBtn title="Mark No Show" onClick={handleNoShow}>
              <X />
            </IconBtn>
            <IconBtn title="Move Up" onClick={onMoveUp}>
              <ArrowUp />
            </IconBtn>
            <IconBtn title="Move Down" onClick={onMoveDown}>
              <ArrowDown />
            </IconBtn>
          </div>
        );

      case "inconsult":
        return (
          <div className="flex gap-2 text-gray-600">
            <IconBtn title="Pause Consultation" onClick={handlePause}>
              <Pause />
            </IconBtn>
            <IconBtn title="End Consultation" onClick={handleEnd}>
              <Check />
            </IconBtn>
          </div>
        );

      case "paused":
        return (
          <div className="flex gap-2 text-gray-600">
            <IconBtn title="Resume Consultation" onClick={handleResume}>
              <Play />
            </IconBtn>
            <IconBtn title="End Consultation" onClick={handleEnd}>
              <Check />
            </IconBtn>
          </div>
        );

      case "completed":
        return (
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              className="p-1.5 rounded-md hover:bg-gray-100"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {menu && (
              <div
                className="absolute right-0 mt-1 w-36 rounded-lg border bg-white shadow-lg z-50"
                onMouseLeave={() => setMenu(false)}
              >
                <MenuItem label="Upload Report" />
                <MenuItem label="Payment" />
                <Link
                  href={`/app/(app)/patient/patientlist/${entry.uhid}/page.tsx`}
                >
                  <MenuItem label="Edit Details" />
                </Link>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={[
        "ui-card px-4 py-3 flex items-center justify-between rounded-xl transition border-l-[5px]",
        entry.status === "paused" ? "bg-amber-50" : "hover:shadow",
      ].join(" ")}
      style={{ borderLeftColor: color }}
    >
      {/* ---------- Left Content ---------- */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold truncate">{entry.name}</div>
          {entry.isNew && (
            <span
              className="text-[10px] px-2 py-[1px] rounded-full text-white"
              style={{ background: "#7C3AED" }}
            >
              NEW
            </span>
          )}
        </div>

        <div className="text-xs text-gray-600 truncate">
          UHID: <span className="font-medium">{entry.uhid}</span> • Token:{" "}
          <span className="font-medium">{entry.token}</span>
        </div>

        <div className="text-xs text-gray-500 truncate">
          ABHA: {entry.abhaAddress}
        </div>
        {entry.docname && (
          <div className="text-xs text-gray-500 mt-0.5">{entry.docname}</div>
        )}
      </div>

      {/* ---------- Right Actions ---------- */}
      <div className="flex items-center gap-3">
        <span
          className="text-[10px] font-medium px-2 py-[2px] rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {labelFor(entry.status)}
        </span>
        {renderActions()}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function labelFor(status?: QueueStatus) {
  switch (status) {
    case "inconsult":
      return "In Consultation";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "noshow":
      return "No Show";
    default:
      return "Waiting";
  }
}

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-md hover:bg-gray-100 text-green-700 "
      type="button"
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            className: "w-4 h-4",
            color: "currentColor",
          } as React.SVGProps<SVGSVGElement>)
        : children}
    </button>
  );
}

function MenuItem({ label }: { label: string }) {
  return (
    <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700">
      {label}
    </button>
  );
}
