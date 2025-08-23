// components/doctor/VoiceOverlay.tsx
"use client";

import React, { useEffect } from "react";

export default function VoiceOverlay({ onClose }: { onClose: () => void }) {
  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // Fixed, small, bottom-right; NO backdrop, NO blur
    <div className="fixed z-50 bottom-4 right-4 w-[320px] max-w-[92vw]">
      <div className="ui-card p-4 rounded-xl shadow-xl border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Voice Capture</h3>
          <button
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
            onClick={onClose}
            title="Close"
          >
            Close
          </button>
        </div>

        {/* Compact "listening" UI */}
        <div className="h-[220px] grid place-items-center">
          <div className="relative">
            {/* soft pulse */}
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: "var(--secondary)" }}
            />
            {/* solid mic circle */}
            <span
              className="relative inline-flex items-center justify-center w-20 h-20 rounded-full"
              style={{ background: "var(--secondary)", color: "var(--on-secondary)" }}
            >
              <MicIcon className="w-8 h-8" />
            </span>
          </div>

          <div className="mt-4 text-center">
            <div className="text-sm font-medium text-gray-800">Speak on your mobile</div>
            <div className="text-[11px] text-gray-500 mt-1">
              Voice input is active on your phone linked to this session.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 19v2" />
    </svg>
  );
}
