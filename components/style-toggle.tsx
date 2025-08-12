"use client";

import React from "react";
import { useTheme, UIStyle } from "./theme-provider";

type Option = { label: string; value: UIStyle };

const OPTIONS: Option[] = [
  { label: "Material", value: "material" },
  { label: "Skeuomorphism", value: "skeuo" },
  { label: "Neumorphism", value: "neumorph" },
  { label: "Paper", value: "paper" },
];

export default function StyleToggle() {
  const { ui, setUi } = useTheme();

  const Swatch = ({ value }: { value: UIStyle }) => {
    const baseClass = "inline-block w-3.5 h-3.5 rounded-[6px]";
    switch (value) {
      case "material":
        return <span className={baseClass} style={{ background: "linear-gradient(180deg,#fff,rgba(0,0,0,.06))", boxShadow: "0 1px 2px rgba(0,0,0,.15)" }} />;
      case "skeuo":
        return <span className={baseClass} style={{ background: "linear-gradient(145deg,#ffffff,#dfe6ee)", boxShadow: "6px 6px 10px #cfd6e1, -6px -6px 10px #ffffff" }} />;
      case "neumorph":
        return <span className={baseClass} style={{ background: "linear-gradient(145deg,#ffffff,#e9edf5)", boxShadow: "4px 4px 8px #d7dde6, -4px -4px 8px #ffffff" }} />;
      case "paper":
        return <span className={baseClass} style={{ background: "#fffdf7", border: "1px solid #e7e1d5", boxShadow: "0 1px 0 rgba(0,0,0,.04), 0 6px 14px rgba(0,0,0,.08)" }} />;
    }
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="UI style selector">
      {OPTIONS.map((opt) => {
        const active = ui === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setUi(opt.value)}
            className={[
              "inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs",
              active
                ? "border-[--tertiary] bg-[--tertiary] text-[--on-tertiary]"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
            ].join(" ")}
            aria-pressed={active}
            title={opt.label}
          >
            <Swatch value={opt.value} />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
