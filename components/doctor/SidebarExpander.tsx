// components/doctor/SidebarExpander.tsx
"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

export default function SidebarExpander({ collapsed }: { collapsed: boolean }) {
  if (!collapsed) return null;

  const expand = () => {
    try {
      localStorage.setItem("aran:sidebarCollapsed", "0");
      window.dispatchEvent(new Event("aran:sidebar"));
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={expand}
      title="Open menu"
      aria-label="Open menu"
      className={[
        "fixed left-2 top-1/2 -translate-y-1/2 z-50",
        "group grid place-items-center",
        "w-7 h-11 rounded-r-xl",
        "bg-white border border-gray-300 shadow-sm",
        "text-gray-700 hover:bg-gray-50 hover:border-gray-400",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900",
      ].join(" ")}
    >
      <ChevronRight className="w-4 h-4" />
      {/* tiny tooltip */}
      <span className="pointer-events-none absolute left-full ml-2 px-2 py-0.5 text-[10px] rounded bg-gray-900 text-white opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition">
        Menu
      </span>
    </button>
  );
}
