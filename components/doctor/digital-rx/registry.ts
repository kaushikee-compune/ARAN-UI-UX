import type { DigitalRxModule } from "./types";

// Import plugin modules
import * as DefaultModule from "./default";
import * as OphModule from "./oph";
import * as GynModule from "./gyn";
import * as GenModule from "./gen";

// Map plugin IDs to modules
export const DigitalRxRegistry: Record<string, DigitalRxModule> = {
  default: DefaultModule,
  oph: OphModule,
  gyn: GynModule,
  gen: GenModule
};

// Loader: returns DigitalRxModule for a departmentId or pluginId
export function loadDigitalRxModule(pluginId?: string | null): DigitalRxModule {
  if (!pluginId) return DigitalRxRegistry.default;
  return DigitalRxRegistry[pluginId] || DigitalRxRegistry.default;
}
