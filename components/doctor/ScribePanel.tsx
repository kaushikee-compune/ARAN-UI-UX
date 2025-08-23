// components/doctor/ScribePanel.tsx
"use client";

import React from "react";

export default function ScribePanel({ onClose }: { onClose?: () => void }) {
  return (
    <div className="ui-card p-4 rounded-xl shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Scribe</h3>
        <button
          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          onClick={onClose}
          title="Close"
        >
          Close
        </button>
      </div>

      {/* Minimal placeholder UI */}
      <div className="mt-4 space-y-3">
        <div className="text-xs text-gray-600">
          Live scribe stream will appear here.
        </div>
        <div className="rounded-md border p-3 text-xs text-gray-500 min-h-[220px]">
          <p className="opacity-80">Waiting for dictation…</p>
        </div>
        <div className="flex gap-2">
          <button className="px-2.5 py-1 text-xs rounded border hover:bg-gray-50">
            Start
          </button>
          <button className="px-2.5 py-1 text-xs rounded border hover:bg-gray-50">
            Pause
          </button>
          <button className="px-2.5 py-1 text-xs rounded border hover:bg-gray-50">
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}
