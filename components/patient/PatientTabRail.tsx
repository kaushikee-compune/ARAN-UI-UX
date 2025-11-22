"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

type TabItem = {
  key: "registration" | "abha" | "abhaCreate" |"scan";
  label: string;
  href?: string;        // only for route tabs
  action?: () => void;  // only for modal tab
};

export default function PatientTabRail({
  scanActive = false, // optional: highlight scan tab when modal is open
}: {
  scanActive?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs: TabItem[] = [
    {
      key: "registration",
      label: "Registration",
      href: "/patient/registration",
    },
    {
      key: "abha",
      label: "Registration with ABHA",
      href: "/patient/abhaverification",
    },
    {
      key: "abhaCreate",
      label: "Create Health Card",
      href: "/patient/abharegistration",
    },
    {
      key: "scan",
      label: "Scan Desk",
      action: () => {
        // Trigger modal from global event listener
        const evt = new CustomEvent("open-scan-desk");
        window.dispatchEvent(evt);
      },
    },
  ];

  const isActive = (t: TabItem) => {
    if (t.key === "scan") return scanActive; // manually highlight only when modal open
    return t.href ? pathname.startsWith(t.href) : false;
  };

  return (
    <div className="flex justify-center gap-4 mb-4">
      {tabs.map((t) => {
        const active = isActive(t);

        return (
          <button
            key={t.key}
            onClick={() => {
              if (t.action) return t.action();
              if (t.href) router.push(t.href);
            }}
            className={[
              "px-6 py-2 rounded-md text-sm font-semibold transition",
              active ? "bg-[#450693] text-white" : "bg-gray-100"
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
