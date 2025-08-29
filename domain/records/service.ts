import type { CanonicalRecord, PreviewRecord } from "./types";

/** Parse "dd-mm-yyyy" into a Date */
export function parseDDMMYYYY(s: string): Date {
  const [dd, mm, yyyy] = s.split("-").map((v) => parseInt(v, 10));
  return new Date(yyyy, (mm || 1) - 1, dd || 1);
}

/**
 * Load mock records from /public/data/mock-records.json
 * - Guarded to run ONLY on the client
 * - Throws a descriptive error if the file is missing/invalid
 */
export async function loadMockRecords(patientId?: string): Promise<CanonicalRecord[]> {
  if (typeof window === "undefined") {
    // Prevent accidental server-side execution in RSC prepass
    return [];
  }

  let res: Response;
  try {
    res = await fetch("/data/mock-records.json", { cache: "no-store" });
  } catch (e) {
    throw new Error("Failed to fetch /data/mock-records.json. Is the file under /public/data?");
  }

  if (!res.ok) {
    throw new Error(`Mock data not found: ${res.status} ${res.statusText} at /data/mock-records.json`);
  }

  let all: unknown;
  try {
    all = await res.json();
  } catch {
    throw new Error("Invalid JSON in /public/data/mock-records.json");
  }

  const list = all as CanonicalRecord[];
  return patientId ? list.filter((r) => r.patientId === patientId) : list;
}

/** Canonical → compact preview row for the console UI */
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

/** Group by dd-mm-yyyy (descending) for date tabs */
export function groupByDate<T extends { dateISO: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  rows.forEach((r) => {
    const k = r.dateISO;
    map.set(k, [...(map.get(k) || []), r]);
  });
  return Array.from(map.entries())
    .sort((a, b) => {
      const da = parseDDMMYYYY(a[0]).getTime();
      const db = parseDDMMYYYY(b[0]).getTime();
      return db - da; // desc
    })
    .map(([dateISO, items]) => ({ dateISO, items }));
}
