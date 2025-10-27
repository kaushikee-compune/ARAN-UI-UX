"use client";

import dynamic from "next/dynamic";

// Dynamically import the panel with SSR disabled
const DaycarePanel = dynamic(() => import("@/components/daycare/DaycarePanel"), {
  ssr: false,
});

export default function DaycarePage() {
  return (
    <div className="p-4">
      <DaycarePanel />
    </div>
  );
}
