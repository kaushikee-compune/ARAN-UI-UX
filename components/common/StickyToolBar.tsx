"use client";

import React from "react";
import { RoundPill, type PillVariant } from "@/components/common/RoundPill";

/**
 * StickyToolBar — reusable vertical toolbar
 * For Doctor / Staff / Admin consoles
 */

export type ToolButton = {
  img: string;
  label: string;
  onClick?: () => void;
  variant?: PillVariant;
  type?: "pill" | "tiny";
};

export interface StickyToolBarProps {
  readonly topTools?: readonly ToolButton[];
  readonly bottomTools?: readonly ToolButton[];
}

export function StickyToolBar({
  topTools = [],
  bottomTools = [],
}: StickyToolBarProps) {
  return (
    <aside className="hidden md:block sticky top-20 self-start w-[72px]">
      <div className="flex flex-col items-center gap-4">
        <div className="ui-card p-1.5 w-[58px] flex flex-col items-center gap-3">
          {/* Group A — Round Pills */}
          {topTools.map((tool, i) =>
            tool.type === "tiny" ? null : (
              <RoundPill
                key={i}
                label={tool.label}
                img={tool.img}
                variant={tool.variant || "gray"}
                onClick={tool.onClick}
              />
            )
          )}

          {/* Divider (only if both groups exist) */}
          {topTools.length > 0 && bottomTools.length > 0 && (
            <div className="my-6 h-px w-full bg-gray-300" />
          )}

          {/* Group B — Tiny Icons */}
          {bottomTools.map((tool, i) => (
            <TinyIcon
              key={i}
              img={tool.img}
              label={tool.label}
              onClick={tool.onClick}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* TinyIcon — smaller circular button                                         */
/* -------------------------------------------------------------------------- */
function TinyIcon({
  img,
  label,
  onClick,
}: {
  img: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
      title={label}
      aria-label={label}
      type="button"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={label} className="w-4 h-4" />
    </button>
  );
}

export default StickyToolBar;
