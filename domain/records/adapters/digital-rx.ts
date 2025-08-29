// /domain/records/adapters/digital-rx.ts
import type { CanonicalRecord } from "../types";

export type PreviewRecord = {
  id: string;
  type: CanonicalRecord["type"];
  dateISO: string; // dd-mm-yyyy
  hospital?: string;
  doctor?: { name?: string; regNo?: string; specialty?: string };
  data: Record<string, any>;
};

export function toPreviewRecord(rec: CanonicalRecord): PreviewRecord {
  const { type, dateISO, meta, canonical } = rec;

  if (type === "Prescription") {
    return {
      id: rec.id,
      type,
      dateISO,
      hospital: meta?.hospital,
      doctor: meta?.doctor,
      data: {
        vitals: canonical.vitals,
        medications: canonical.prescription,
        advice: canonical.plan?.advice,
        note: canonical.plan?.doctorNote,
      },
    };
  }

  if (type === "Vitals") {
    const v = canonical.vitals;
    return {
      id: rec.id,
      type,
      dateISO,
      hospital: meta?.hospital,
      doctor: meta?.doctor,
      data: {
        temperature: v.temperature,
        bp: v.bp ?? (v.bpSys && v.bpDia ? `${v.bpSys}/${v.bpDia}` : undefined),
        spo2: v.spo2,
        weight: v.weight,
        height: v.height,
        bmi: v.bmi,
        lifestyle: v.lifestyle,
        general: v.GeneralAssessment,
      },
    };
  }

  if (type === "Immunization") {
    return {
      id: rec.id,
      type,
      dateISO,
      hospital: meta?.hospital,
      doctor: meta?.doctor,
      data: meta?.immunization ?? {},
    };
  }

  if (type === "Lab") {
    return {
      id: rec.id,
      type,
      dateISO,
      hospital: meta?.hospital,
      doctor: meta?.doctor,
      data: meta?.labPanel ?? { note: canonical.plan?.investigationNote },
    };
  }

  // DischargeSummary or others
  return {
    id: rec.id,
    type,
    dateISO,
    hospital: meta?.hospital,
    doctor: meta?.doctor,
    data: {
      discharge: meta?.discharge,
      plan: canonical.plan,
      prescription: canonical.prescription,
    },
  };
}
