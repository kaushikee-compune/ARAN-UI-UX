"use client";

import { useMemo } from "react";
import { getDigitalRxPlugin } from "@/components/doctor/digital-rx/plugin-loader";

import ImmunizationForm from "@/components/doctor/ImmunizationForm";
import DaycareSummary from "@/components/doctor/DaycareSummary";

export type ActiveTool =
  | "none"
  | "digitalrx"
  | "immunization"
  | "daycare";

export interface ToolLoaderResult {
  plugin: ReturnType<typeof getDigitalRxPlugin>;
  ToolBody: React.ComponentType<any> | null;
}

export function useToolLoaders(opts: {
  activeTool: ActiveTool;
  dept: string;
}): ToolLoaderResult {
  const { activeTool, dept } = opts;

  const plugin = useMemo(() => getDigitalRxPlugin(dept), [dept]);
  const DigitalRx = plugin.Form;

  const ToolBody = useMemo<React.ComponentType<any> | null>(() => {
    switch (activeTool) {
      case "digitalrx":
        return DigitalRx;

      case "immunization":
        return ImmunizationForm;

      case "daycare":
        return DaycareSummary;

      case "none":
      default:
        return null;
    }
  }, [activeTool, DigitalRx]);

  return { plugin, ToolBody };
}
