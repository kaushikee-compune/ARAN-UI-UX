"use client";
import React from "react";

export default function ProgressBar({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  return (
    <div className="w-full flex items-center justify-between">
      {Array.from({ length: total }).map((_, idx) => {
        const isActive = idx <= step;
        const isCurrent = idx === step;

        return (
          <div key={idx} className="flex-1 flex items-center">
            {/* Circle */}
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border-2 ${
                isActive
                  ? "bg-[#66ad45] border-[#66ad45] text-white"
                  : "bg-white border-gray-300 text-gray-500"
              } ${isCurrent ? "ring-2 ring-offset-2 ring-[#66ad45]" : ""}`}
            >
              {idx + 1}
            </div>

            {/* Line (skip after last node) */}
            {idx < total - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  isActive ? "bg-[#66ad45]" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
