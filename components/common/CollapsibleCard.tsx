"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react"; // If you don’t use lucide, see note below

export default function CollapsibleCard({
  title,
  subtitle,
  children,
  defaultOpen = false,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`ui-card rounded-xl shadow-sm ${className}`}>
      {/* Header Row */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 px-3"
      >
        <div className="flex items-center gap-2">
          {/* Caret */}
          <ChevronRight
            className={`w-4 h-4 text-gray-700 transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />

          <span className="text-sm font-semibold text-gray-600">{title}</span>
        </div>

        {/* Optional summary */}
        {subtitle && !open && (
          <span className="text-xs text-gray-500 truncate max-w-[50%] text-right">
            {subtitle}
          </span>
        )}
      </button>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}
