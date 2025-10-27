"use client";

import React, { useState } from "react";
import BedCard from "./BedCard";
import AdmissionModal from "./AdmissionModal";
import PatientDrawer from "./PatientDrawer";
import type { Bed, DaycarePatient } from "./types";

export default function DaycarePanel() {
  const [beds, setBeds] = useState<Bed[]>([
    { bedId: "B1", label: "Bed 1", status: "vacant" },
    { bedId: "B2", label: "Bed 2", status: "vacant" },
    { bedId: "B3", label: "Bed 3", status: "vacant" },
  ]);

  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [showAdmit, setShowAdmit] = useState(false);

  const admitPatient = (bedId: string, data: DaycarePatient) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.bedId === bedId ? { ...b, status: "occupied", patient: data } : b
      )
    );
    setShowAdmit(false);
  };

  const dischargePatient = (bedId: string) => {
    setBeds((prev) =>
      prev.map((b) =>
        b.bedId === bedId ? { ...b, status: "discharged", patient: undefined } : b
      )
    );
  };

  return (
    <div className="ui-card p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daycare Management</h2>
        <button
          className="px-3 py-1.5 text-sm rounded bg-[--secondary] text-black
           hover:opacity-90"
          onClick={() => setShowAdmit(true)}
        >
          + Admit Patient
        </button>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {beds.map((bed) => (
          <BedCard
            key={bed.bedId}
            bed={bed}
            onClick={() => setSelectedBed(bed)}
          />
        ))}
      </div>

      {showAdmit && (
        <AdmissionModal
          beds={beds.filter((b) => b.status === "vacant")}
          onAdmit={admitPatient}
          onClose={() => setShowAdmit(false)}
        />
      )}

      {selectedBed && (
        <PatientDrawer
          bed={selectedBed}
          onClose={() => setSelectedBed(null)}
          onDischarge={dischargePatient}
        />
      )}
    </div>
  );
}
