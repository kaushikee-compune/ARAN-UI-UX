"use client";

import React, { useState } from "react";

export default function DaycareSummary({
  pastVitals,
}: {
  pastVitals?: {
    temp?: number[];
    bpSys?: number[];
    bpDia?: number[];
    spo2?: number[];
    allergies?: string[];
    conditions?: string[];
  };
}) {
  const loggedInUser = "Dr. A. Banerjee";

  /* -------------------- Data States -------------------- */
  const [procedures, setProcedures] = useState([
    { name: "", datetime: "", performer: loggedInUser, notes: "" },
  ]);

  const [vitalsChart, setVitalsChart] = useState([
    { time: currentHour(), bpSys: "", bpDia: "", temp: "", spo2: "" },
  ]);

  const [medications, setMedications] = useState([
    { medicine: "", route: "", time: "", administeredBy: "" },
  ]);

  const [infusions, setInfusions] = useState([
    { name: "", start: "", stop: "", volume: "", remarks: "" },
  ]);

  const [nursingNotes, setNursingNotes] = useState([
    { time: "", symptom: "", comfort: "", diet: "", pain: "", remarks: "" },
  ]);

  const [doctorNote, setDoctorNote] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const [discharge, setDischarge] = useState({
    finalDiagnosis: "",
    proceduresDone: "",
    medicationsGiven: "",
    advice: "",
    followUp: "",
    dischargeTime: "",
    doctorSignature: "",
  });

  /* -------------------- Handlers -------------------- */
  const addRow = <T,>(arr: T[], setArr: (v: T[]) => void, emptyRow: T) =>
    setArr([...arr, emptyRow]);

  const deleteRow = <T,>(arr: T[], setArr: (v: T[]) => void, idx: number) =>
    setArr(arr.filter((_, i) => i !== idx));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments(Array.from(e.target.files));
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="space-y-8">
      {/* ---------- Smart Patient Snapshot ---------- */}
      {pastVitals && (
        <div className="flex justify-end">
          <VitalsButton pastVitals={pastVitals} />
        </div>
      )}

      {/* ================= Procedure & Medication Chart ================= */}
      <section className="ui-card p-4 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Procedure & Medication Chart
        </h2>

        {/* --- Procedure Table --- */}
        <SubSection title="Procedure Details">
          <ModernTable
            headers={[
              "Procedure Name",
              "Date",
              "Performer",
              "Notes",
              "Actions",
            ]}
          >
            {procedures.map((p, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                {/* Procedure name */}
                <Td>
                  <InputWithList
                    listId={`procedureList-${idx}`}
                    value={p.name}
                    onChange={(v) =>
                      update(procedures, setProcedures, idx, { name: v })
                    }
                    placeholder="Select or type procedure"
                    options={[
                      "IV Fluid Administration",
                      "Injection/IM/IV Medication",
                      "Wound Dressing / Dressing Change",
                      "Nebulization",
                      "Blood Transfusion (1 unit)",
                      "ECG & Monitoring",
                      "Minor Suturing",
                      "Fever Observation",
                      "Hydration Therapy",
                      "Antibiotic Infusion",
                      "Short Procedure under LA",
                      "Enema / Manual evacuation",
                      "Ultrasound-guided Injection",
                      "Urinary Catheterization",
                      "Ear/Nasal Pack Removal",
                    ]}
                  />
                </Td>

                {/* Date (defaults to today) */}
                <Td>
                  <input
                    type="date"
                    className="ui-input w-full"
                    value={p.datetime || new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      update(procedures, setProcedures, idx, {
                        datetime: e.target.value,
                      })
                    }
                  />
                </Td>

                {/* Performer (defaults to logged-in doctor) */}
                <Td>
                  <Input
                    value={p.performer || loggedInUser}
                    onChange={(v) =>
                      update(procedures, setProcedures, idx, { performer: v })
                    }
                    placeholder="Performer"
                  />
                </Td>

                {/* Notes */}
                <Td>
                  <Input
                    value={p.notes}
                    onChange={(v) =>
                      update(procedures, setProcedures, idx, { notes: v })
                    }
                    placeholder="Notes"
                  />
                </Td>

                <Td>
                  <DeleteBtn
                    onClick={() => deleteRow(procedures, setProcedures, idx)}
                  />
                </Td>
              </tr>
            ))}
          </ModernTable>
          <AddBtn
            onClick={() =>
              addRow(procedures, setProcedures, {
                name: "",
                datetime: "",
                performer: loggedInUser,
                notes: "",
              })
            }
          />
        </SubSection>

        {/* --- Hourly Vitals Chart --- */}
        <SubSection title="Hourly Vitals Chart">
          <ModernTable
            headers={[
              "Time",
              "BP (Sys/Dia)",
              "Temperature (°F)",
              "SpO₂ (%)",
              "Actions",
            ]}
          >
            {vitalsChart.map((v, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <Td>
                  <input
                    type="time"
                    className="ui-input w-full"
                    value={v.time}
                    onChange={(e) =>
                      update(vitalsChart, setVitalsChart, idx, {
                        time: e.target.value,
                      })
                    }
                  />
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <input
                      className="ui-input w-16"
                      placeholder="Sys"
                      value={v.bpSys}
                      onChange={(e) =>
                        update(vitalsChart, setVitalsChart, idx, {
                          bpSys: e.target.value,
                        })
                      }
                    />
                    <span className="text-gray-500">/</span>
                    <input
                      className="ui-input w-16"
                      placeholder="Dia"
                      value={v.bpDia}
                      onChange={(e) =>
                        update(vitalsChart, setVitalsChart, idx, {
                          bpDia: e.target.value,
                        })
                      }
                    />
                  </div>
                </Td>
                <Td>
                  <input
                    className="ui-input w-full"
                    placeholder="98.6"
                    value={v.temp}
                    onChange={(e) =>
                      update(vitalsChart, setVitalsChart, idx, {
                        temp: e.target.value,
                      })
                    }
                  />
                </Td>
                <Td>
                  <input
                    className="ui-input w-full"
                    placeholder="97"
                    value={v.spo2}
                    onChange={(e) =>
                      update(vitalsChart, setVitalsChart, idx, {
                        spo2: e.target.value,
                      })
                    }
                  />
                </Td>
                <Td>
                  <DeleteBtn
                    onClick={() => deleteRow(vitalsChart, setVitalsChart, idx)}
                  />
                </Td>
              </tr>
            ))}
          </ModernTable>

          <AddBtn
            onClick={() =>
              addRow(vitalsChart, setVitalsChart, {
                time: currentHour(),
                bpSys: "",
                bpDia: "",
                temp: "",
                spo2: "",
              })
            }
          />
        </SubSection>

        {/* --- Medication Administration Record --- */}
        <SubSection title="Medication Administration Record (MAR)">
          <ModernTable
            headers={[
              "Medicine",
              "Route",
              "Time",
              "Administered By",
              "Actions",
            ]}
          >
            {medications.map((m, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <Td>
                  <Input
                    value={m.medicine}
                    onChange={(v) =>
                      update(medications, setMedications, idx, { medicine: v })
                    }
                    placeholder="Medicine name"
                  />
                </Td>
                <Td>
                  <Input
                    value={m.route}
                    onChange={(v) =>
                      update(medications, setMedications, idx, { route: v })
                    }
                    placeholder="Oral/IV/IM"
                  />
                </Td>
                <Td>
                  <input
                    type="time"
                    className="ui-input w-full"
                    value={m.time}
                    onChange={(e) =>
                      update(medications, setMedications, idx, {
                        time: e.target.value,
                      })
                    }
                  />
                </Td>
                <Td>
                  <Input
                    value={m.administeredBy}
                    onChange={(v) =>
                      update(medications, setMedications, idx, {
                        administeredBy: v,
                      })
                    }
                    placeholder="Nurse name"
                  />
                </Td>
                <Td>
                  <DeleteBtn
                    onClick={() => deleteRow(medications, setMedications, idx)}
                  />
                </Td>
              </tr>
            ))}
          </ModernTable>
          <AddBtn
            onClick={() =>
              addRow(medications, setMedications, {
                medicine: "",
                route: "",
                time: "",
                administeredBy: "",
              })
            }
          />
        </SubSection>

        {/* --- Infusion/IV Log --- */}
        <SubSection title="Infusion / IV Log">
          <ModernTable
            headers={[
              "Name",
              "Start Time",
              "Stop Time",
              "Volume (ml)",
              "Remarks",
              "Actions",
            ]}
          >
            {infusions.map((i, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                {/* Infusion Name with datalist */}
                <Td>
                  <InputWithList
                    listId={`infusionList-${idx}`}
                    value={i.name}
                    onChange={(v) =>
                      update(infusions, setInfusions, idx, { name: v })
                    }
                    placeholder="Select or type infusion"
                    options={[
                      "Normal Saline (NS)",
                      "Ringer's Lactate (RL)",
                      "Dextrose 5% (D5)",
                      "DNS (Dextrose Normal Saline)",
                      "Ceftriaxone IV",
                      "Amoxiclav IV",
                      "Metronidazole IV",
                      "Vitamin B-Complex IV",
                      "Vitamin C IV",
                      "Iron Sucrose (Venofer)",
                      "Amino Acid Infusion",
                      "Hydration Therapy",
                    ]}
                  />
                </Td>

                <Td>
                  <input
                    type="time"
                    className="ui-input w-full"
                    value={i.start}
                    onChange={(e) =>
                      update(infusions, setInfusions, idx, {
                        start: e.target.value,
                      })
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="time"
                    className="ui-input w-full"
                    value={i.stop}
                    onChange={(e) =>
                      update(infusions, setInfusions, idx, {
                        stop: e.target.value,
                      })
                    }
                  />
                </Td>
                <Td>
                  <Input
                    value={i.volume}
                    onChange={(v) =>
                      update(infusions, setInfusions, idx, { volume: v })
                    }
                    placeholder="Volume"
                  />
                </Td>
                <Td>
                  <Input
                    value={i.remarks}
                    onChange={(v) =>
                      update(infusions, setInfusions, idx, { remarks: v })
                    }
                    placeholder="Remarks"
                  />
                </Td>
                <Td>
                  <DeleteBtn
                    onClick={() => deleteRow(infusions, setInfusions, idx)}
                  />
                </Td>
              </tr>
            ))}
          </ModernTable>
          <AddBtn
            onClick={() =>
              addRow(infusions, setInfusions, {
                name: "",
                start: "",
                stop: "",
                volume: "",
                remarks: "",
              })
            }
          />
        </SubSection>
      </section>

      {/* ================= Clinical Notes ================= */}
      <section className="ui-card p-4 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Clinical Notes</h2>

        <SubSection title="Doctor Progress Note">
          <textarea
            className="ui-textarea w-full min-h-[120px]"
            value={doctorNote}
            onChange={(e) => setDoctorNote(e.target.value)}
            placeholder="Doctor's progress notes before discharge..."
          />
        </SubSection>

        <SubSection title="Nursing Notes">
          <ModernTable
            headers={[
              "Time",
              "Symptoms",
              "Comfort",
              "Diet",
              "Pain Level",
              "Remarks",
              "Actions",
            ]}
          >
            {nursingNotes.map((n, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <Td>
                  <input
                    type="time"
                    className="ui-input w-full"
                    value={n.time}
                    onChange={(e) =>
                      update(nursingNotes, setNursingNotes, idx, {
                        time: e.target.value,
                      })
                    }
                  />
                </Td>
                <Td>
                  <Input
                    value={n.symptom}
                    onChange={(v) =>
                      update(nursingNotes, setNursingNotes, idx, { symptom: v })
                    }
                    placeholder="Symptoms"
                  />
                </Td>
                <Td>
                  <Input
                    value={n.comfort}
                    onChange={(v) =>
                      update(nursingNotes, setNursingNotes, idx, { comfort: v })
                    }
                    placeholder="Comfort level"
                  />
                </Td>
                <Td>
                  <Input
                    value={n.diet}
                    onChange={(v) =>
                      update(nursingNotes, setNursingNotes, idx, { diet: v })
                    }
                    placeholder="Diet"
                  />
                </Td>
                <Td>
                  <Input
                    value={n.pain}
                    onChange={(v) =>
                      update(nursingNotes, setNursingNotes, idx, { pain: v })
                    }
                    placeholder="Pain (1–10)"
                  />
                </Td>
                <Td>
                  <Input
                    value={n.remarks}
                    onChange={(v) =>
                      update(nursingNotes, setNursingNotes, idx, { remarks: v })
                    }
                    placeholder="Remarks"
                  />
                </Td>
                <Td>
                  <DeleteBtn
                    onClick={() =>
                      deleteRow(nursingNotes, setNursingNotes, idx)
                    }
                  />
                </Td>
              </tr>
            ))}
          </ModernTable>
          <AddBtn
            onClick={() =>
              addRow(nursingNotes, setNursingNotes, {
                time: "",
                symptom: "",
                comfort: "",
                diet: "",
                pain: "",
                remarks: "",
              })
            }
          />
        </SubSection>

        <SubSection title="Attach Test Results or Images">
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:bg-gray-50 hover:file:bg-gray-100"
          />
          {attachments.length > 0 && (
            <ul className="text-xs text-gray-600 mt-2 list-disc pl-5">
              {attachments.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}
        </SubSection>
      </section>

      {/* ================= Discharge Summary ================= */}
      <section className="ui-card p-4 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Discharge Summary
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <LabeledInput
            label="Final Diagnosis"
            value={discharge.finalDiagnosis}
            onChange={(v) => setDischarge({ ...discharge, finalDiagnosis: v })}
          />
          <LabeledInput
            label="Procedures Done"
            value={discharge.proceduresDone}
            onChange={(v) => setDischarge({ ...discharge, proceduresDone: v })}
          />
          <LabeledInput
            label="Medications Given"
            value={discharge.medicationsGiven}
            onChange={(v) =>
              setDischarge({ ...discharge, medicationsGiven: v })
            }
          />
          <LabeledInput
            label="Doctor Advice"
            value={discharge.advice}
            onChange={(v) => setDischarge({ ...discharge, advice: v })}
          />
          <LabeledInput
            label="Follow-up Instructions"
            value={discharge.followUp}
            onChange={(v) => setDischarge({ ...discharge, followUp: v })}
          />
          <div>
            <label className="text-[11px] text-gray-600">Discharge Time</label>
            <input
              type="datetime-local"
              className="ui-input w-full"
              value={discharge.dischargeTime}
              onChange={(e) =>
                setDischarge({ ...discharge, dischargeTime: e.target.value })
              }
            />
          </div>
          <LabeledInput
            label="Doctor Signature / Name"
            value={discharge.doctorSignature}
            onChange={(v) => setDischarge({ ...discharge, doctorSignature: v })}
          />
        </div>
      </section>
    </div>
  );
}

/* ------------------ Small Helpers ------------------ */
function update<T>(
  arr: T[],
  setArr: (v: T[]) => void,
  idx: number,
  patch: Partial<T>
) {
  const next = arr.slice();
  next[idx] = { ...next[idx], ...patch };
  setArr(next);
}

/* ------------------ Sub Components ------------------ */
function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      {children}
    </div>
  );
}

function ModernTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-1.5">{children}</td>;
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
    >
      + Add Row
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-gray-400 hover:text-red-600 transition"
      title="Delete row"
    >
      ✕
    </button>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="ui-input w-full min-w-0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

/* -------- Hybrid Dropdown + Free Text -------- */
function InputWithList({
  listId,
  value,
  onChange,
  placeholder,
  options,
}: {
  listId: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: string[];
}) {
  return (
    <>
      <input
        list={listId}
        className="ui-input w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  onChangeFile,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  onChangeFile?: (files: File[]) => void;
}) {
  return (
    <div className="flex items-center border-gray-300 pb-0.5 gap-2">
      <label className="text-sm text-gray-600 w-40 shrink-0">{label}</label>
      <input
        className="flex-1 max-w-[80px] bg-transparent  border-gray-300 outline-none px-1 py-0.5 text-[13px] text-gray-800 placeholder:text-gray-400 focus:border-blue-500"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          type === "file"
            ? onChangeFile?.(Array.from(e.target.files || []))
            : onChange?.(e.target.value)
        }
      />
    </div>
  );
}

function VitalsButton({
  pastVitals,
}: {
  pastVitals: {
    temp?: number[];
    bpSys?: number[];
    bpDia?: number[];
    spo2?: number[];
    allergies?: string[];
    conditions?: string[];
  };
}) {
  const [open, setOpen] = useState(false);
  const latestTemp = pastVitals.temp?.slice(-1)[0];
  const latestBP =
    pastVitals.bpSys && pastVitals.bpDia
      ? `${pastVitals.bpSys.slice(-1)[0]}/${pastVitals.bpDia.slice(-1)[0]}`
      : null;
  const latestSpO2 = pastVitals.spo2?.slice(-1)[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs flex items-center gap-2 bg-white border border-gray-300 rounded-full px-3 py-1 shadow-sm hover:bg-gray-50"
      >
        <span className="text-gray-700 font-medium">Vitals</span>
        {latestTemp && <span className="text-gray-600">🌡️ {latestTemp}°F</span>}
        {latestBP && <span className="text-gray-600">💓 {latestBP}</span>}
        {latestSpO2 && <span className="text-gray-600">🫁 {latestSpO2}%</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-200 p-3 text-xs text-gray-700 z-50">
          <h4 className="font-semibold text-sm mb-2">Past Vitals</h4>
          {pastVitals.temp && (
            <div className="flex justify-between">
              <span>🌡️ Temp</span>
              <span>{pastVitals.temp.join(" → ")} °F</span>
            </div>
          )}
          {pastVitals.bpSys && pastVitals.bpDia && (
            <div className="flex justify-between">
              <span>💓 BP</span>
              <span>
                {pastVitals.bpSys
                  .map((s, i) => `${s}/${pastVitals.bpDia?.[i] ?? ""}`)
                  .join(" → ")}{" "}
                mmHg
              </span>
            </div>
          )}
          {pastVitals.spo2 && (
            <div className="flex justify-between">
              <span>🫁 SpO₂</span>
              <span>{pastVitals.spo2.join(" → ")} %</span>
            </div>
          )}
          {pastVitals.allergies?.length ? (
            <div className="mt-2">
              <span className="font-medium">⚠️ Allergies: </span>
              {pastVitals.allergies.join(", ")}
            </div>
          ) : null}
          {pastVitals.conditions?.length ? (
            <div className="mt-1">
              <span className="font-medium">🩹 Conditions: </span>
              {pastVitals.conditions.join(", ")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
function currentHour() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString().slice(11, 16); // "HH:MM"
}
