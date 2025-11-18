"use client";

import { useState, useCallback } from "react";

export type CompanionMode = "off" | "form" | "voice" | "scribe";

function collapseSidebar(collapse: boolean) {
  try {
    localStorage.setItem("aran:sidebarCollapsed", collapse ? "1" : "0");
    window.dispatchEvent(new Event("aran:sidebar"));
  } catch {}
}

export function useCompanion() {
  const [companionMode, setCompanionMode] = useState<CompanionMode>("off");

  const handleCompanionSwitch = useCallback((checked: boolean) => {
    if (checked) {
      setCompanionMode("form");
      collapseSidebar(true);
    } else {
      setCompanionMode("off");
      collapseSidebar(false);
    }
  }, []);

  const pickCompanion = useCallback(
    (mode: Extract<CompanionMode, "form" | "voice" | "scribe">) => {
      setCompanionMode(mode);
      collapseSidebar(true);
    },
    []
  );

  return {
    companionMode,
    companionOn: companionMode !== "off",
    setCompanionMode,
    handleCompanionSwitch,
    pickCompanion,
  };
}
