// components/use-companion-mode.ts
"use client";

import { useEffect, useState } from "react";

/** Global Companion Mode (persisted + cross-tab events) */
export function useCompanionMode() {
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem("aran:companionMode") === "1";
      setIsOn(v);
      const handler = () => setIsOn(localStorage.getItem("aran:companionMode") === "1");
      window.addEventListener("aran:companion", handler);
      return () => window.removeEventListener("aran:companion", handler);
    } catch {}
  }, []);

  const set = (next: boolean) => {
    setIsOn(next);
    try {
      localStorage.setItem("aran:companionMode", next ? "1" : "0");
      window.dispatchEvent(new Event("aran:companion"));
    } catch {}
  };

  const toggle = () => set(!isOn);

  return { isOn, set, toggle };
}
