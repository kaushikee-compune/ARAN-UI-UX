"use client";

import { useState, useEffect } from "react";

export type CanonicalRecord = {
  id: string;
  patientId: string;
  dateISO: string;
  type: string;
  source: string;
  canonical: any;
};

export type DayRecords = {
  dateISO: string;
  items: CanonicalRecord[];
};

function parseDDMMYYYY(s: string) {
  const [dd, mm, yyyy] = s.split("-").map((n) => parseInt(n, 10));
  return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
}

function groupByDate(rows: CanonicalRecord[]): DayRecords[] {
  const map = new Map<string, CanonicalRecord[]>();

  rows.forEach((r) => {
    map.set(r.dateISO, [...(map.get(r.dateISO) || []), r]);
  });

  return Array.from(map.entries())
    .sort((a, b) => parseDDMMYYYY(b[0]) - parseDDMMYYYY(a[0]))
    .map(([dateISO, items]) => ({ dateISO, items }));
}

export function usePastRecords(patientId: string) {
  const [pastDays, setPastDays] = useState<DayRecords[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [errorPast, setErrorPast] = useState<string | null>(null);
  const [bpTrend, setBpTrend] = useState<Array<{ date: string; sys: number; dia: number }>>([]);

  useEffect(() => {
    let alive = true;
    setLoadingPast(true);

    fetch("/data/mock-records.json", { cache: "no-store" })
      .then((res) => res.json())
      .then((records: CanonicalRecord[]) => {
        if (!alive) return;

        const filtered = records.filter((r) => r.patientId === patientId);
        const grouped = groupByDate(filtered);
        setPastDays(grouped);

        const bpData = filtered
          .map((r) => {
            const v = r.canonical?.vitals || {};
            const sys = parseFloat(v.bpSys || "");
            const dia = parseFloat(v.bpDia || "");
            if (!isNaN(sys) && !isNaN(dia)) return { date: r.dateISO, sys, dia };
            return null;
          })
          .filter(Boolean) as Array<{ date: string; sys: number; dia: number }>;

        setBpTrend(bpData);
        setErrorPast(null);
      })
      .catch((err) => {
        if (alive) setErrorPast(err?.message ?? "Failed to load records");
      })
      .finally(() => alive && setLoadingPast(false));

    return () => {
      alive = false;
    };
  }, [patientId]);

  return {
    pastDays,
    loadingPast,
    errorPast,
    bpTrend,
    setPastDays,
  };
}
