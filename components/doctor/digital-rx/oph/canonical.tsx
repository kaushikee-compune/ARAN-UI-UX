import type { DigitalRxFormState } from "@/components/doctor/DigitalRxForm";

export type OphCanonical = DigitalRxFormState & {
  eyeComplaintRows?: Array<{
    symptom: string;
    duration?: string;
    severity?: string;
  }>;
  ophInvestigationRows?: Array<{
    test: string;
    notes?: string;
    status?: string;
  }>;
};

/**
 * Important:
 * state.eyeComplaintRows does NOT exist in DigitalRxFormState,
 * but plugins add them dynamically.
 * So we must read them safely using (state as any).
 */
export function toOphCanonical(state: DigitalRxFormState): OphCanonical {
  const s: any = state; // plugin-safe

  return {
    ...state,

    // Plugin-only fields (safe-checked)
    eyeComplaintRows: Array.isArray(s.eyeComplaintRows)
      ? s.eyeComplaintRows
      : [],

    ophInvestigationRows: Array.isArray(s.ophInvestigationRows)
      ? s.ophInvestigationRows
      : [],
  };
}
