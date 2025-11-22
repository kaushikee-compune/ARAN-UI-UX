"use client";

import { useEffect, useMemo, useState } from "react";
import { useBranch } from "@/context/BranchContext";

// Vitals Forms
import GeneralVitalsForm from "@/components/vitals/forms/general-vitals-form";
import GynVitalsForm from "@/components/vitals/forms/gyn-vitals-form";
import EyeVitalsForm from "@/components/vitals/forms/eye-vitals-form";

/* -------------------------------------------------------
   Types
------------------------------------------------------- */
type DepartmentMap = Record<string, string>;

type StaffDoctor = {
  id: string;
  name: string;
  roles: string[];
  departments: string[];
  branches: string[];
  status: string;
};

type Slot = {
  slotStart: string;
  slotEnd: string;
  tokenNum?: string;
  status: string; // waiting | inconsult | ...
  patient: null | {
    name: string;
    phone: string;
    abha?: string;
    gender: string;
  };
};

type Session = {
  branchId: string;
  doctorId: string;
  doctor: string;
  activeQ: boolean;
  slots: Slot[];
};

type QueueData = {
  date: string;
  sessions: Session[];
};

type QueuePatient = {
  id: string; // slot index key
  token: string; // formatted token
  name: string;
  gender: string;
  doctorId: string;
  doctorName: string;
  departmentCode: string;
  departmentFullName: string;
  status: string;
};

/* -------------------------------------------------------
   Component
------------------------------------------------------- */
export default function StaffConsolePage() {
  const { selectedBranch } = useBranch();

  const [departmentsMap, setDepartmentsMap] = useState<DepartmentMap>({});
  const [staff, setStaff] = useState<StaffDoctor[]>([]);
  const [queue, setQueue] = useState<QueuePatient[]>([]);

  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [doctorFilter, setDoctorFilter] = useState("All");

  const [selectedPatient, setSelectedPatient] = useState<QueuePatient | null>(
    null
  );

  /* -------------------------------------------------------
     Load JSON data
  ------------------------------------------------------- */
  useEffect(() => {
    async function loadData() {
      const deptRes = await fetch("/data/department-mapper.json");
      const deptJson = await deptRes.json();

      const staffRes = await fetch("/data/staff.json");
      const staffJson = await staffRes.json();

      const queueRes = await fetch("/data/queue.json");
      const queueJson = await queueRes.json();

      setDepartmentsMap(deptJson);
      setStaff(staffJson);

      const parsed = buildQueueList(queueJson, staffJson, deptJson, selectedBranch);
      setQueue(parsed);
    }

    if (selectedBranch) loadData();
  }, [selectedBranch]);

  /* -------------------------------------------------------
     Build Queue from queue.json + staff.json
  ------------------------------------------------------- */
  function buildQueueList(
    queueJson: QueueData,
    staffList: StaffDoctor[],
    deptMap: DepartmentMap,
    branch: string
  ): QueuePatient[] {
    const sessions = queueJson.sessions || [];

    const activeSessions = sessions.filter(
      (s) => s.branchId === branch && s.activeQ === true
    );

    const rows: QueuePatient[] = [];

    activeSessions.forEach((session) => {
      const doctorInfo = staffList.find((d) => d.id === session.doctorId);
      if (!doctorInfo) return;

      const primaryDept = doctorInfo.departments?.[0] || "gen";
      const departmentFull = deptMap[primaryDept] || "General Medicine";

      session.slots.forEach((slot, idx) => {
        if (!slot.patient) return;
        if (!["waiting", "inconsult"].includes(slot.status)) return;

        // token fallback
        const token =
          slot.tokenNum && slot.tokenNum.trim() !== ""
            ? slot.tokenNum
            : String(idx + 1).padStart(3, "0");

        rows.push({
          id: `${session.doctorId}-${idx}`,
          token,
          name: slot.patient.name,
          gender: slot.patient.gender,
          doctorId: session.doctorId,
          doctorName: session.doctor,
          departmentCode: primaryDept,
          departmentFullName: departmentFull,
          status: slot.status,
        });
      });
    });

    return rows;
  }

  /* -------------------------------------------------------
     Doctor Dropdown (unique by active sessions)
  ------------------------------------------------------- */
  const doctorList = useMemo(() => {
    const docs = new Map<string, string>();
    queue.forEach((p) => {
      if (!docs.has(p.doctorId)) docs.set(p.doctorId, p.doctorName);
    });
    return Array.from(docs.entries()).map(([id, name]) => ({ id, name }));
  }, [queue]);

  /* -------------------------------------------------------
     Filter queue
  ------------------------------------------------------- */
  const filteredQueue = useMemo(() => {
    return queue.filter((p) => {
      const byDept =
        departmentFilter === "All" || p.departmentCode === departmentFilter;
      const byDoc = doctorFilter === "All" || p.doctorId === doctorFilter;
      return byDept && byDoc;
    });
  }, [queue, departmentFilter, doctorFilter]);

  /* -------------------------------------------------------
     Vitals Submit Handler
  ------------------------------------------------------- */
  function handleVitalsSubmit(vitals: any) {
    console.log("Vitals Submitted →", {
      branchId: selectedBranch,
      patient: selectedPatient,
      vitals,
    });

    if (selectedPatient) {
      const updated = queue.map((q) =>
        q.id === selectedPatient.id ? { ...q, status: "done" } : q
      );
      setQueue(updated);
      setSelectedPatient(null);
    }
  }

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <div className="space-y-4">
      {/* ---------------- TOP FILTERS ---------------- */}
      <div className="ui-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Department Dropdown */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Department
            </label>
            <select
              className="ui-input w-48"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="All">All</option>
              {Object.entries(departmentsMap).map(([code, fullLabel]) => (
                <option key={code} value={code}>
                  {fullLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Dropdown */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">Doctor</label>
            <select
              className="ui-input w-48"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="All">All</option>
              {doctorList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-xs text-gray-500">
            Branch: <span className="font-semibold">{selectedBranch}</span>
          </div>
        </div>
      </div>

      {/* ---------------- QUEUE + VITALS PANEL ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4">
        {/* QUEUE PANEL */}
        <div className="ui-card p-3 h-[calc(100vh-180px)] overflow-auto">
          <h3 className="text-sm font-semibold mb-2">Today's Queue</h3>

          <div className="space-y-2">
            {filteredQueue.map((p) => {
              const isSelected = selectedPatient?.id === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? "bg-[#450693] text-white border-gray-900"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      #{p.token} — {p.name}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="text-xs text-white mt-1">
                    {p.gender} • {p.doctorName} • {p.departmentFullName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VITALS PANEL */}
        <div className="ui-card p-4 min-h-[600px]">
          {!selectedPatient ? (
            <div className="text-gray-400 text-center mt-20">
              Select a patient from the queue →
            </div>
          ) : (
            <VitalsFormContainer
              patient={selectedPatient}
              onSubmit={handleVitalsSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Small Badge Component
------------------------------------------------------- */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    waiting: "bg-yellow-400",
    inconsult: "bg-blue-500",
    done: "bg-green-600",
  };

  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${
        colors[status] || "bg-gray-300"
      }`}
    ></span>
  );
}

/* -------------------------------------------------------
   Department-Aware Vitals Form
------------------------------------------------------- */
function VitalsFormContainer({
  patient,
  onSubmit,
}: {
  patient: QueuePatient;
  onSubmit: (v: any) => void;
}) {
  const code = patient.departmentCode;

  return (
    <div>
      <div className="mb-4 border-b pb-3">
        <div className="text-sm font-semibold">{patient.name}</div>
        <div className="text-xs text-gray-600">
          Token #{patient.token} • {patient.gender} •{" "}
          {patient.departmentFullName}
        </div>
      </div>

      {code === "gen" && <GeneralVitalsForm onSubmit={onSubmit} />}
      {code === "gyn" && <GynVitalsForm onSubmit={onSubmit} />}
      {code === "oph" && <EyeVitalsForm onSubmit={onSubmit} />}

      {!["gen", "gyn", "oph"].includes(code) && (
        <div className="text-red-500 text-sm">
          No vitals form configured for department: {patient.departmentFullName}
        </div>
      )}
    </div>
  );
}
