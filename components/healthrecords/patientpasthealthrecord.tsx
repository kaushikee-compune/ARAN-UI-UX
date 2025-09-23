"use client";

import React, { useEffect, useState } from "react";

/* Types */
type DigitalRxFormState = {
  vitals?: any;
  clinical?: any;
  prescription?: any[];
  plan?: any;
};

type CanonicalRecord = {
  id: string;
  patientId: string;
  dateISO: string;
  type: "Prescription" | "Vitals" | "Immunization" | "Lab" | "DischargeSummary";
  source: "digital-rx";
  canonical: DigitalRxFormState;
  meta?: {
    hospital?: string;
    doctor?: { name: string; regNo?: string; specialty?: string };
  };
};

type DayRecords = { dateISO: string; items: CanonicalRecord[] };

export type PatientInfo = {
  patientId: string;
  name: string;
  age: string;
  gender: string;
  phone?: string;
  abhaNumber?: string;
  abhaAddress?: string;
};

export type ClinicInfo = {
  doctorName: string;
  specialty?: string;
  regNo?: string;
  clinicName?: string;
};

interface Props {
  patientId: string;
  patient: PatientInfo;
  clinic: ClinicInfo;
}

/* Helpers */
function parseDDMMYYYY(s: string) {
  const [dd, mm, yyyy] = s.split("-").map(Number);
  return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
}
function groupByDate(records: CanonicalRecord[]): DayRecords[] {
  const map = new Map<string, CanonicalRecord[]>();
  records.forEach((r) => {
    map.set(r.dateISO, [...(map.get(r.dateISO) || []), r]);
  });
  return Array.from(map.entries())
    .sort((a, b) => parseDDMMYYYY(b[0]) - parseDDMMYYYY(a[0]))
    .map(([dateISO, items]) => ({ dateISO, items }));
}

/* Component */
export default function PatientPastHealthRecord({
  patientId,
  patient,
  clinic,
}: Props) {
  const [records, setRecords] = useState<DayRecords[]>([]);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    fetch("/data/mock-records.json")
      .then((res) => res.json())
      .then((all: CanonicalRecord[]) => {
        const filtered = all.filter((r) => r.patientId === patientId);
        setRecords(groupByDate(filtered));
      });
  }, [patientId]);

  if (records.length === 0) {
    return (
      <div className="ui-card p-4 text-sm text-gray-500">
        No past records available.
      </div>
    );
  }

  const selectedDay = records[tabIndex];

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start mb-3">
        <div className="text-sm">
          <div className="font-semibold">{patient.name}</div>
          <div className="text-gray-600 text-xs">
            {patient.gender} • {patient.age}
          </div>
          <div className="text-xs text-gray-600">{patient.abhaAddress}</div>
        </div>
        <div />
        <div className="text-xs text-right text-gray-600">
          <div className="font-medium">{clinic.doctorName}</div>
          {clinic.clinicName && <div>{clinic.clinicName}</div>}
        </div>
      </div>

      {/* Date Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {records.map((day, i) => (
          <button
            key={day.dateISO}
            onClick={() => setTabIndex(i)}
            className={`px-3 py-1 rounded border text-sm ${
              tabIndex === i ? "bg-gray-900 text-white" : "hover:bg-gray-50"
            }`}
          >
            {day.dateISO}
          </button>
        ))}
      </div>

      {/* Records */}
      <div className="space-y-4">
        {selectedDay.items.map((rec) => (
          <RecordCard key={rec.id} record={rec} />
        ))}
      </div>
    </div>
  );
}

/* Record Renderer */
function RecordCard({ record }: { record: CanonicalRecord }) {
  const { vitals = {}, clinical = {}, prescription = [], plan = {} } =
    record.canonical;

  return (
    <div className="ui-card p-4 space-y-3">
      <div className="font-semibold text-sm">
        {record.type} • {record.meta?.hospital} • {record.meta?.doctor?.name}
      </div>

      {/* Vitals */}
      {vitals.temperature && (
        <div className="text-sm">Temp: {vitals.temperature} °C</div>
      )}
      {vitals.bpSys && (
        <div className="text-sm">BP: {vitals.bpSys} /</div>
      )}
      

      {/* Clinical */}
      {clinical.chiefComplaints && (
        <div className="text-sm">
          <b>Complaints:</b> {clinical.chiefComplaints}
        </div>
      )}

      {/* Prescription */}
      {prescription.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-1">Prescription</h4>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-1 text-left">Medicine</th>
                <th className="px-2 py-1">Freq</th>
                <th className="px-2 py-1">Dosage</th>
                <th className="px-2 py-1">Duration</th>
              </tr>
            </thead>
            <tbody>
              {prescription.map((m, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1">{m.medicine}</td>
                  <td className="px-2 py-1">{m.frequency}</td>
                  <td className="px-2 py-1">{m.dosage}</td>
                  <td className="px-2 py-1">{m.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Plan */}
      {plan.advice && (
        <div className="text-sm">
          <b>Advice:</b> {plan.advice}
        </div>
      )}
    </div>
  );
}
