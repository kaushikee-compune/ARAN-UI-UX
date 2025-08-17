// components/icons/health.tsx
import * as React from "react";

/** Keep one consistent style across all icons */
const baseProps: React.SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export type RecordKindKey =
  | "Prescription"
  | "Vitals"
  | "ClinicalDetails"
  | "DiagnosticReport"
  | "LabRequest"
  | "Immunization"
  | "DischargeSummary"
  | "ConsentRequest";

/* ----------------------------- Individual Icons ----------------------------- */
// 1. Prescription: paper + pen
export function PrescriptionIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 3h9l3 3v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6M9 12h3" />
      <path d="M14.5 17.5 18 14l2 2-3.5 3.5a2 2 0 0 1-1.42.59H14v-1.08a2 2 0 0 1 .5-1.31Z" />
    </svg>
  );
}

// 2. Vitals: heart + ECG
export function VitalsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-.96-.96a5.5 5.5 0 0 0-7.78 7.78L12 21l8.74-8.5a5.5 5.5 0 0 0 .1-7.89Z" />
      <path d="M3.5 12h3l2-3 3 6 2-3h6" />
    </svg>
  );
}

// 3. Clinical Details: clipboard + text
export function ClinicalDetailsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3.5h6M10 7h4" />
      <path d="M8 11h8M8 15h6" />
    </svg>
  );
}

// 4. Diagnostic Reports: document + chart
export function DiagnosticReportIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 3h9l3 3v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M8 13l2 2 4-4M8 8h5" />
      <circle cx="16" cy="16" r="0.01" />
    </svg>
  );
}

// 5. Lab Request: test tube pair
export function LabRequestIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M7 3h6v2H7z" />
      <path d="M9 5v13a3 3 0 1 1-6 0V5" />
      <path d="M17 3h3v2h-3z" />
      <path d="M18.5 5v11a3 3 0 1 1-6 0V5" />
    </svg>
  );
}

// 6. Immunization Record: syringe
export function ImmunizationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m21 3-3 3" />
      <path d="m18 3 3 3" />
      <path d="M15 6 5 16l3 3L18 9" />
      <path d="M7 14l3 3" />
      <path d="M3 21l3-3" />
    </svg>
  );
}

// 7. Discharge Summary: document + exit arrow
export function DischargeSummaryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 3h9l3 3v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 9h5" />
      <path d="M9 13h3" />
      <path d="M12 17h6" />
      <path d="M16 15l2 2-2 2" />
    </svg>
  );
}

// 8. Consent Request: shield + check
export function ConsentRequestIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3l7 3v5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-3Z" />
      <path d="M9.5 12.5l2 2 3.5-3.5" />
    </svg>
  );
}

/* ----------------------------- Registry / Helper ---------------------------- */
export const HealthIcons = {
  Prescription: PrescriptionIcon,
  Vitals: VitalsIcon,
  ClinicalDetails: ClinicalDetailsIcon,
  DiagnosticReport: DiagnosticReportIcon,
  LabRequest: LabRequestIcon,
  Immunization: ImmunizationIcon,
  DischargeSummary: DischargeSummaryIcon,
  ConsentRequest: ConsentRequestIcon,
} satisfies Record<RecordKindKey, React.FC<React.SVGProps<SVGSVGElement>>>;

/** Pretty label helper (optional) */
export function prettyRecordKind(k: RecordKindKey) {
  switch (k) {
    case "DiagnosticReport":
      return "Diagnostic Report";
    case "LabRequest":
      return "Lab Request";
    case "Immunization":
      return "Immunization Record";
    case "DischargeSummary":
      return "Discharge Summary";
    case "ClinicalDetails":
      return "Clinical Details";
    case "ConsentRequest":
      return "Consent Request";
    default:
      return k;
  }
}

/** One-liner component to render by key */
export function RecordTypeIcon({
  kind,
  className,
}: {
  kind: RecordKindKey;
  className?: string;
}) {
  const Icon = HealthIcons[kind];
  return <Icon className={className ?? "w-4 h-4"} />;
}
export function recordKindColor(kind: RecordKindKey): string {
  switch (kind) {
    case "Prescription":      return "text-indigo-600";   // Rx
    case "Vitals":            return "text-rose-600";     // heart/ECG
    case "ClinicalDetails":   return "text-slate-700";    // clipboard/doc
    case "DiagnosticReport":  return "text-violet-600";   // report
    case "LabRequest":        return "text-sky-600";      // flasks
    case "Immunization":      return "text-emerald-600";  // vaccine
    case "DischargeSummary":  return "text-amber-600";    // exit/summary
    case "ConsentRequest":    return "text-fuchsia-600";  // shield
    default:                  return "text-slate-700";
  }
}