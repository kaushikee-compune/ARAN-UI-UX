// components/doctor/DigitalRxForm.tsx
"use client";

import React, { useMemo, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
/* ---------------------------------------------
   PUBLIC TYPES (extend gently for new UI fields)
----------------------------------------------*/
export type DigitalRxFormState = {
  // Vitals formstate
  vitals: {
    temperature?: string;
    bp?: string; // stays for backward compatibility (systolic/diastolic compose into this)
    bpSys?: string; // new: systolic
    bpDia?: string; // new: diastolic
    spo2?: string; // new: SpO2 %
    weight?: string; // kg
    height?: string; // cm
    bmi?: string; // auto
    lmpDate?: string;

    bodyMeasurement?: {
      waist?: string;
      hip?: string;
      neck?: string;
      chest?: string;
    };

    womensHealth?: {
      lmpDate?: string;
      cycleLengthDays?: string;
      cycleRegularity?: string;
      gravidity?: string;
      parity?: string;
      abortions?: string;
    };

    lifestyle?: {
      smokingStatus?: "Never" | "Former" | "Current";
      alcoholIntake?: "None" | "Occasional" | "Moderate" | "Heavy";
      dietType?: "Mixed" | "Vegetarian" | "Vegan" | "Keto" | "Other";
      sleepHours?: string;
      stressLevel?: "Low" | "Moderate" | "High";
    };

    physicalActivity?: {
      logs?: {
        activity?: string;
        durationMin?: string;
        intensity?: "Low" | "Moderate" | "High";
        frequencyPerWeek?: string;
      }[];
    };
    GeneralAssessment?: {
      painScore?: string; // 0-10
      temperatureSite?:
        | "Oral"
        | "Axillary"
        | "Tympanic"
        | "Rectal"
        | "Temporal";
      posture?: "Normal" | "Stooped" | "Bedridden";
      edema?: "None" | "Mild" | "Moderate" | "Severe";
      pallor?: "Absent" | "Mild" | "Moderate" | "Severe";
    };
    vitalsNotes?: string;
    vitalsUploads?: { name: string; size?: number }[];
  };
  // Clinical details formstate
  clinical: {
    chiefComplaints?: string;
    pastHistory?: string;
    familyHistory?: string; // keep this if you were using a single free-text field
    allergy?: string;

    currentMedications?: {
      medicine?: string;
      dosage?: string;
      since?: string;
    }[];
    familyHistoryRows?: { relation?: string; ailment?: string }[];
    proceduresDone?: { name?: string; date?: string }[];
    investigationsDone?: { name?: string; date?: string }[];
  };

  //Prescription Formstate
  prescription: {
    medicine: string;
    frequency: string;
    duration: string;
    dosage: string;
    instruction: string;
  }[];

  // Investigation & Advice
  plan: {
    investigations?: string;
    investigationInstructions?: string;
    advice?: string;
    doctorNote?: string;
    followUpInstructions?: string;
    followUpDate?: string;
    investigationNote?: string;
    patientNote?: string;
    attachments?: {
      files?: File[];
      note?: string;
    };
  };
};

const toUnion = <T extends string>(v: string) => v as T;

export type DigitalRxFormProps = {
  value: DigitalRxFormState;
  onChange: (next: DigitalRxFormState) => void;
  onSave?: () => void;
  onSubmit?: () => void;
  autoBMI?: boolean;
};

export default function DigitalRxForm({
  value,
  onChange,
  onSave,
  onSubmit,
  autoBMI = true,
}: DigitalRxFormProps) {
  /* --------------------- Derived + effects --------------------- */
  // Keep bp string in sync with sys/dia for backward compatibility
  useEffect(() => {
    const sys = (value.vitals.bpSys || "").trim();
    const dia = (value.vitals.bpDia || "").trim();
    const next =
      sys || dia ? `${sys || " "}/${dia || " "}`.replace(/\s+\/\s+/, "/") : "";
    if ((value.vitals.bp || "") !== next) {
      patch("vitals", { bp: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.vitals.bpSys, value.vitals.bpDia]);

  // Auto BMI
  useEffect(() => {
    if (!autoBMI) return;
    const h = Number(value.vitals.height || "");
    const w = Number(value.vitals.weight || "");
    const current = value.vitals.bmi || "";
    let nextBMI = "";
    if (h > 0 && w > 0) {
      const bmi = w / Math.pow(h / 100, 2);
      if (!isNaN(bmi)) nextBMI = bmi.toFixed(1);
    }
    if (current !== nextBMI) {
      patch("vitals", { bmi: nextBMI });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.vitals.height, value.vitals.weight, autoBMI]);

  /* --------------------- Vitals additional fields --------------------- */
  const setPhysicalActivityLogs = (
    next: NonNullable<DigitalRxFormState["vitals"]["physicalActivity"]>["logs"]
  ) =>
    patch("vitals", {
      physicalActivity: {
        ...(value.vitals.physicalActivity || {}),
        logs: next,
      },
    });

  const addPhysicalActivityRow = () =>
    setPhysicalActivityLogs([
      ...(value.vitals.physicalActivity?.logs || []),
      {
        activity: "",
        durationMin: "",
        intensity: "Moderate",
        frequencyPerWeek: "",
      },
    ]);

  const removePhysicalActivityRow = (i: number) =>
    setPhysicalActivityLogs(
      (value.vitals.physicalActivity?.logs || []).filter((_, idx) => idx !== i)
    );

  /* --------------------- Collapses --------------------- */
  const [openVitals, setOpenVitals] = useState(false);
  const [openVitalsMore, setOpenVitalsMore] = useState(false); // inner more for the 4 sub-cards

  const [openClinical, setOpenClinical] = useState(false);
  const [openClinicalMore, setOpenClinicalMore] = useState(false);

  const [openMeds, setOpenMeds] = useState(false);
  const [openInvestigations, setOpenInvestigations] = useState(false);

  const [openPlan, setOpenPlan] = useState(false);
  const [openPlanMore, setOpenPlanMore] = useState(false);

  /* --------------------- Helpers --------------------- */
  function patch<K extends keyof DigitalRxFormState>(
    key: K,
    partial: Partial<DigitalRxFormState[K]>
  ) {
    onChange({ ...value, [key]: { ...(value[key] as any), ...partial } });
  }

  function setCurrentMeds(
    next: DigitalRxFormState["clinical"]["currentMedications"]
  ) {
    patch("clinical", { currentMedications: next });
  }
  function setProcedures(
    next: DigitalRxFormState["clinical"]["proceduresDone"]
  ) {
    patch("clinical", { proceduresDone: next });
  }
  function setInvestigationsDone(
    next: DigitalRxFormState["clinical"]["investigationsDone"]
  ) {
    patch("clinical", { investigationsDone: next });
  }

  const addCurrentMed = () =>
    setCurrentMeds([
      ...(value.clinical.currentMedications || []),
      { medicine: "", dosage: "", since: "" },
    ]);
  const removeCurrentMed = (i: number) =>
    setCurrentMeds(
      (value.clinical.currentMedications || []).filter((_, idx) => idx !== i)
    );

  const addProcedure = () =>
    setProcedures([
      ...(value.clinical.proceduresDone || []),
      { name: "", date: "" },
    ]);
  const removeProcedure = (i: number) =>
    setProcedures(
      (value.clinical.proceduresDone || []).filter((_, idx) => idx !== i)
    );

  const addInvestigationDone = () =>
    setInvestigationsDone([
      ...(value.clinical.investigationsDone || []),
      { name: "", date: "" },
    ]);
  const removeInvestigationDone = (i: number) =>
    setInvestigationsDone(
      (value.clinical.investigationsDone || []).filter((_, idx) => idx !== i)
    );

  const addRxRow = () =>
    onChange({
      ...value,
      prescription: [
        ...value.prescription,
        {
          medicine: "",
          frequency: "",
          instruction: "",
          duration: "",
          dosage: "",
        },
      ],
    });
  const removeRxRow = (idx: number) =>
    onChange({
      ...value,
      prescription: value.prescription.filter((_, i) => i !== idx),
    });

  /* --------------------- UI --------------------- */
  return (
    <div className="ui-card p-4">
      {/* Header actions (unchanged contracts) */}
      {/* <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Digital Prescription Form</h3>
        <div className="flex items-center gap-2">
          <button type="button" className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50" onClick={onSave}>
            Save
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
            onClick={onSubmit}
          >
            Submit
          </button>
        </div>
      </div> */}

      <div className="mt-4 grid gap-3">
        {/* ====================== Section: Vitals ====================== */}
        <CardShell
          title="Vitals"
          moreLabel={openVitals ? "Less" : "More"}
          onMore={() => setOpenVitals((s) => !s)}
        >
          {openVitals && (
            <div className="grid gap-3">
              {/* First set of fields */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <LabeledInput
                  label="Temperature (°C)"
                  value={value.vitals.temperature || ""}
                  onChange={(v) => patch("vitals", { temperature: v })}
                />

                {/* BP with two compartments */}
                <div className="grid gap-1">
                  <label className="text-[11px] text-gray-600">
                    Blood Pressure (mmHg)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      className="ui-input w-full min-w-0 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      inputMode="numeric"
                      placeholder="Systolic"
                      value={value.vitals.bpSys || ""}
                      onChange={(e) =>
                        patch("vitals", { bpSys: e.target.value })
                      }
                    />
                    <span className="text-gray-500">/</span>
                    <input
                      className="ui-input w-full min-w-0 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      inputMode="numeric"
                      placeholder="Diastolic"
                      value={value.vitals.bpDia || ""}
                      onChange={(e) =>
                        patch("vitals", { bpDia: e.target.value })
                      }
                    />
                  </div>
                </div>

                <LabeledInput
                  label="SpO₂ (%)"
                  value={value.vitals.spo2 || ""}
                  onChange={(v) => patch("vitals", { spo2: v })}
                  placeholder="e.g., 98"
                />

                <LabeledInput
                  label="Height (cm)"
                  type="number"
                  value={value.vitals.height || ""}
                  onChange={(v) => patch("vitals", { height: v })}
                />
                <LabeledInput
                  label="Weight (kg)"
                  type="number"
                  value={value.vitals.weight || ""}
                  onChange={(v) => patch("vitals", { weight: v })}
                />
                <LabeledInput
                  label="BMI"
                  value={value.vitals.bmi || ""}
                  readOnly
                />
              </div>

              {/* Second More → show 4 sub-cards in 2 rows (2x2) */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-xs text-gray-700 hover:text-gray-900"
                  onClick={() => setOpenVitalsMore((s) => !s)}
                >
                  {openVitalsMore ? "Less" : "More"}
                </button>
              </div>

              {openVitalsMore && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <MiniCard title="Women Health">
                    {/* Placeholders; wire fields later as needed */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* LMP Date */}
                      <div className="grid gap-1">
                        <label className="text-[11px] text-gray-600">
                          LMP Date
                        </label>
                        <input
                          type="date"
                          className="ui-input w-full"
                          value={value.vitals.womensHealth?.lmpDate ?? ""}
                          onChange={(e) =>
                            patch("vitals", {
                              womensHealth: {
                                ...(value.vitals.womensHealth || {}),
                                lmpDate: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      {/* Cycle Length (days) — combo */}
                      <LabeledCombo
                        label="Cycle Length (days)"
                        value={value.vitals.womensHealth?.cycleLengthDays ?? ""}
                        options={["21", "24", "26", "28", "30", "32", "35"]}
                        placeholder="e.g., 28"
                        inputMode="numeric"
                        onChange={(v) =>
                          patch("vitals", {
                            womensHealth: {
                              ...(value.vitals.womensHealth || {}),
                              cycleLengthDays: v,
                            },
                          })
                        }
                      />

                      {/* Cycle Regularity — combo */}
                      <LabeledCombo
                        label="Cycle Regularity"
                        value={
                          value.vitals.womensHealth?.cycleRegularity ??
                          "Regular"
                        }
                        options={["Regular", "Irregular"]}
                        onChange={(v) =>
                          patch("vitals", {
                            womensHealth: {
                              ...(value.vitals.womensHealth || {}),
                              cycleRegularity: v,
                            },
                          })
                        }
                      />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      <LabeledCombo
                        label="Gravida (G)"
                        value={value.vitals.womensHealth?.gravidity ?? ""}
                        options={[
                          "0",
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                        ]}
                        inputMode="numeric"
                        onChange={(v) =>
                          patch("vitals", {
                            womensHealth: {
                              ...(value.vitals.womensHealth || {}),
                              gravidity: v,
                            },
                          })
                        }
                      />
                      <LabeledCombo
                        label="Para (P)"
                        value={value.vitals.womensHealth?.parity ?? ""}
                        options={[
                          "0",
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                        ]}
                        inputMode="numeric"
                        onChange={(v) =>
                          patch("vitals", {
                            womensHealth: {
                              ...(value.vitals.womensHealth || {}),
                              parity: v,
                            },
                          })
                        }
                      />
                      <LabeledCombo
                        label="Abortions (A)"
                        value={value.vitals.womensHealth?.abortions ?? ""}
                        options={["0", "1", "2", "3", "4", "5"]}
                        inputMode="numeric"
                        onChange={(v) =>
                          patch("vitals", {
                            womensHealth: {
                              ...(value.vitals.womensHealth || {}),
                              abortions: v,
                            },
                          })
                        }
                      />
                    </div>
                  </MiniCard>

                  <MiniCard title="Lifestyle">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Smoking Status — combo */}
                      <LabeledCombo
                        label="Smoking Status"
                        value={value.vitals.lifestyle?.smokingStatus ?? "Never"}
                        options={["Never", "Former", "Current"]}
                        onChange={(v) =>
                          patch("vitals", {
                            lifestyle: {
                              ...(value.vitals.lifestyle || {}),
                              smokingStatus: toUnion<
                                "Never" | "Former" | "Current"
                              >(v),
                            },
                          })
                        }
                      />

                      {/* Alcohol Intake — combo */}
                      <LabeledCombo
                        label="Alcohol Intake"
                        value={value.vitals.lifestyle?.alcoholIntake ?? "None"}
                        options={["None", "Occasional", "Moderate", "Heavy"]}
                        onChange={(v) =>
                          patch("vitals", {
                            lifestyle: {
                              ...(value.vitals.lifestyle || {}),
                              alcoholIntake: toUnion<
                                "None" | "Occasional" | "Moderate" | "Heavy"
                              >(v),
                            },
                          })
                        }
                      />

                      {/* Diet Type — combo */}
                      <LabeledCombo
                        label="Diet Type"
                        value={value.vitals.lifestyle?.dietType ?? "Mixed"}
                        options={[
                          "Mixed",
                          "Vegetarian",
                          "Vegan",
                          "Keto",
                          "Other",
                        ]}
                        onChange={(v) =>
                          patch("vitals", {
                            lifestyle: {
                              ...(value.vitals.lifestyle || {}),
                              dietType: toUnion<
                                | "Mixed"
                                | "Vegetarian"
                                | "Vegan"
                                | "Keto"
                                | "Other"
                              >(v),
                            },
                          })
                        }
                      />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {/* Sleep hours — combo (free text or pick) */}
                      <LabeledCombo
                        label="Sleep (hrs/night)"
                        value={value.vitals.lifestyle?.sleepHours ?? ""}
                        options={["4", "5", "6", "7", "8", "9", "10"]}
                        inputMode="numeric"
                        placeholder="e.g., 7"
                        onChange={(v) =>
                          patch("vitals", {
                            lifestyle: {
                              ...(value.vitals.lifestyle || {}),
                              sleepHours: v,
                            },
                          })
                        }
                      />

                      {/* Stress Level — combo */}
                      <LabeledCombo
                        label="Stress Level"
                        value={
                          value.vitals.lifestyle?.stressLevel ?? "Moderate"
                        }
                        options={["Low", "Moderate", "High"]}
                        onChange={(v) =>
                          patch("vitals", {
                            lifestyle: {
                              ...(value.vitals.lifestyle || {}),
                              stressLevel: toUnion<"Low" | "Moderate" | "High">(
                                v
                              ),
                            },
                          })
                        }
                      />
                    </div>
                  </MiniCard>
                  <MiniCard title="Body Measurement">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <LabeledInput
                        label="Waist (cm)"
                        value={value.vitals.bodyMeasurement?.waist || ""}
                        onChange={(v) =>
                          patch("vitals", {
                            bodyMeasurement: {
                              ...(value.vitals.bodyMeasurement || {}),
                              waist: v,
                            },
                          })
                        }
                      />
                      <LabeledInput
                        label="Hip (cm)"
                        value={value.vitals.bodyMeasurement?.hip || ""}
                        onChange={(v) =>
                          patch("vitals", {
                            bodyMeasurement: {
                              ...(value.vitals.bodyMeasurement || {}),
                              hip: v,
                            },
                          })
                        }
                      />
                      <LabeledInput
                        label="Neck (cm)"
                        value={value.vitals.bodyMeasurement?.neck || ""}
                        onChange={(v) =>
                          patch("vitals", {
                            bodyMeasurement: {
                              ...(value.vitals.bodyMeasurement || {}),
                              neck: v,
                            },
                          })
                        }
                      />
                      <LabeledInput
                        label="Chest (cm)"
                        value={value.vitals.bodyMeasurement?.chest || ""}
                        onChange={(v) =>
                          patch("vitals", {
                            bodyMeasurement: {
                              ...(value.vitals.bodyMeasurement || {}),
                              chest: v,
                            },
                          })
                        }
                      />
                    </div>
                  </MiniCard>

                  <MiniCard title="Physical Activity">
                    <LabeledTable
                      label="Weekly activity log"
                      columns={[
                        { key: "activity", header: "Activity" },
                        {
                          key: "durationMin",
                          header: "Duration (min)",
                          type: "number",
                          placeholder: "30",
                        },
                        {
                          key: "intensity",
                          header: "Intensity",
                          type: "select",
                          options: ["Low", "Moderate", "High"],
                        },
                        {
                          key: "frequencyPerWeek",
                          header: "Freq/wk",
                          type: "number",
                          placeholder: "3",
                        },
                      ]}
                      value={value.vitals.physicalActivity?.logs || []}
                      onChange={(rows) =>
                        patch("vitals", {
                          physicalActivity: {
                            ...(value.vitals.physicalActivity || {}),
                            logs: rows,
                          },
                        })
                      }
                      getDefaultRow={() => ({
                        activity: "",
                        durationMin: "",
                        intensity: "Moderate",
                        frequencyPerWeek: "",
                      })}
                      emptyText="No activity logged."
                    />
                  </MiniCard>
                </div>
              )}
            </div>
          )}
        </CardShell>

        {/* ================== Section: Clinical Details ================= */}
        <CardShell
          title="Clinical Details"
          moreLabel={openClinical ? "Less" : "More"}
          onMore={() => setOpenClinical((s) => !s)}
        >
          {openClinical && (
            <div className="grid gap-4">
              {/* Row 1 — Chief Complaints & Current Medications */}
              <div className="grid lg:grid-cols-2 gap-3">
                <LabeledTextarea
                  label="Chief Complaints"
                  value={value.clinical.chiefComplaints || ""}
                  onChange={(v) => patch("clinical", { chiefComplaints: v })}
                  placeholder="e.g., Fever since 3 days; cough worse at night…"
                />

                <div className="grid gap-1">
                  <LabeledTable
                    label="Current Medications"
                    columns={[
                      {
                        key: "medicine",
                        header: "Medicine",
                        placeholder: "e.g., Metformin 500 mg",
                      },
                      { key: "dosage", header: "Dosage", placeholder: "1-0-1" },
                      {
                        key: "since",
                        header: "Since When",
                        placeholder: "e.g., 2 months",
                      },
                    ]}
                    value={value.clinical.currentMedications ?? []}
                    onChange={(rows) =>
                      patch("clinical", { currentMedications: rows })
                    }
                    getDefaultRow={() => ({
                      medicine: "",
                      dosage: "",
                      since: "",
                    })}
                    emptyText="No current medications."
                  />
                </div>
              </div>

              {/* Show More / Less for mini-cards */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-xs text-gray-700 hover:text-gray-900"
                  onClick={() => setOpenClinicalMore((s) => !s)}
                >
                  {openClinicalMore ? "Less" : "More"}
                </button>
              </div>

              {openClinicalMore && (
                <div className="grid gap-3">
                  {/* Row A — Allergy + Family History */}
                  <div className="grid lg:grid-cols-2 gap-3">
                    {/* Allergy */}
                    <MiniCard title="Allergy">
                      <LabeledTextarea
                        label="Allergy"
                        value={value.clinical.allergy || ""}
                        onChange={(v) => patch("clinical", { allergy: v })}
                        placeholder="e.g., Penicillin / NSAIDs / Seafood…"
                      />
                    </MiniCard>

                    {/* Family History (Relation, Ailment) */}
                    <MiniCard title="Family History">
                      <LabeledTable
                        label="Family History"
                        columns={[
                          {
                            key: "relation",
                            header: "Relation",
                            placeholder: "Father / Mother / Sibling…",
                          },
                          {
                            key: "ailment",
                            header: "Ailment",
                            placeholder: "e.g., Type 2 Diabetes",
                          },
                        ]}
                        value={value.clinical.familyHistoryRows ?? []}
                        onChange={(rows) =>
                          patch("clinical", { familyHistoryRows: rows })
                        }
                        getDefaultRow={() => ({ relation: "", ailment: "" })}
                        emptyText="No family history recorded."
                      />
                    </MiniCard>
                  </div>

                  {/* Row B — Procedures Done + Investigations Done */}
                  <div className="grid lg:grid-cols-2 gap-3">
                    {/* Procedures Done (notes + table) */}
                    <MiniCard title="Procedures Done">
                      <div className="grid gap-2">
                        {/* <LabeledTextarea
                          label="Procedure Notes"
                          value={value.clinical.proceduresDone || ""}
                          onChange={(v) =>
                            patch("clinical", { proceduresDone: v })
                          }
                          placeholder="Summary / remarks…"
                        /> */}
                        <LabeledTable
                          label="Procedures"
                          columns={[
                            {
                              key: "name",
                              header: "Name",
                              placeholder: "e.g., Appendectomy",
                            },
                            { key: "date", header: "Date", type: "date" },
                          ]}
                          value={value.clinical.proceduresDone ?? []}
                          onChange={(rows) =>
                            patch("clinical", { proceduresDone: rows })
                          }
                          getDefaultRow={() => ({ name: "", date: "" })}
                          emptyText="No procedures added."
                        />
                      </div>
                    </MiniCard>

                    {/* Investigations Done (notes + table) */}
                    <MiniCard title="Investigations Done">
                      <div className="grid gap-2">
                        {/* <LabeledTextarea
                          label="Investigation Notes"
                          value={value.clinical.investigationsNote || ""}
                          onChange={(v) =>
                            patch("clinical", { investigationsNote: v })
                          }
                          placeholder="Summary / key results…"
                        /> */}
                        <LabeledTable
                          label="Investigations"
                          columns={[
                            {
                              key: "name",
                              header: "Name",
                              placeholder: "e.g., CBC",
                            },
                            { key: "date", header: "Date", type: "date" },
                          ]}
                          value={value.clinical.investigationsDone ?? []}
                          onChange={(rows) =>
                            patch("clinical", { investigationsDone: rows })
                          }
                          getDefaultRow={() => ({ name: "", date: "" })}
                          emptyText="No investigations recorded."
                        />
                      </div>
                    </MiniCard>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardShell>

        {/* ================== Section: Medications (Prescription) ================= */}
        <CardShell
          title="Medications"
          moreLabel={openMeds ? "Less" : "More"}
          onMore={() => setOpenMeds((s) => !s)}
        >
          {openMeds && (
            <div className="relative">
              {/* Sleek, borderless rows */}
              <div className="rounded-md divide-y overflow-hidden bg-white">
                {/* Header strip */}
                <div className="grid grid-cols-12 text-xs sm:text-sm bg-gray-50">
                  <CellHead className="col-span-3">Medicine</CellHead>
                  <CellHead className="col-span-2">Frequency</CellHead>
                  <CellHead className="col-span-2">Instruction</CellHead>
                  <CellHead className="col-span-2">Duration</CellHead>
                  <CellHead className="col-span-2">Dosage</CellHead>
                </div>

                <div className="max-h-[46vh] overflow-auto">
                  {value.prescription.map((row, idx) => {
                    const isLast = idx === value.prescription.length - 1;
                    return (
                      <div
                        key={idx}
                        className="relative grid grid-cols-12 items-start gap-2 px-3 py-2 rounded-md bg-white shadow-sm ring-1 ring-gray-200/70 hover:shadow md:hover:shadow-md hover:bg-gray-50/50 transition"
                      >
                        <div className="col-span-3 min-w-0">
                          <input
                            className="ui-input w-full"
                            value={row.medicine}
                            onChange={(e) =>
                              updateRx(idx, { medicine: e.target.value })
                            }
                            placeholder="e.g., Paracetamol 500 mg"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            className="ui-input w-full"
                            value={row.frequency}
                            onChange={(e) =>
                              updateRx(idx, { frequency: e.target.value })
                            }
                            placeholder="1-0-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            className="ui-input w-full"
                            value={row.instruction}
                            onChange={(e) =>
                              updateRx(idx, { instruction: e.target.value })
                            }
                            placeholder="After food"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            className="ui-input w-full"
                            value={row.duration}
                            onChange={(e) =>
                              updateRx(idx, { duration: e.target.value })
                            }
                            placeholder="5 days"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            className="ui-input w-full"
                            value={row.dosage}
                            onChange={(e) =>
                              updateRx(idx, { dosage: e.target.value })
                            }
                            placeholder="500 mg"
                          />
                        </div>

                        {/* Floating toggle at the end of EACH row:
                    - last row: "+"
                    - previous rows: "−" (delete that row) */}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2">
                          {isLast ? (
                            <button
                              type="button"
                              title="Add row"
                              onClick={addRxRow}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white shadow hover:bg-gray-50 text-gray-700"
                            >
                              +
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Delete row"
                              onClick={() => removeRxRow(idx)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white shadow hover:bg-gray-50 text-gray-700"
                            >
                              –
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty state with floating controls */}
                  {value.prescription.length === 0 && (
                    <div className="relative px-3 py-6 text-xs text-gray-500">
                      No medicines added yet.
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-2">
                        <button
                          type="button"
                          title="Add row"
                          onClick={addRxRow}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white shadow hover:bg-gray-50 text-gray-700"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          title="Remove last row"
                          disabled
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white shadow opacity-40 cursor-not-allowed text-gray-400"
                        >
                          –
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardShell>

        {/* ========== Section: Investigation & Uploads (collapsed card) ========== */}
        <CardShell
          title="Investigations & Advice"
          moreLabel={openPlan ? "Less" : "More"}
          onMore={() => setOpenPlan((s) => !s)}
        >
          {openPlan && (
            <div className="grid gap-4">
              {/* ================= Row 1 — Investigations + Instructions ================= */}
              <div className="grid lg:grid-cols-2 gap-3">
                <MiniCard title="Investigations">
                  <LabeledCombo
                    label="Investigation"
                    value={value.plan.investigations ?? ""}
                    options={[
                      "CBC",
                      "LFT",
                      "KFT",
                      "HbA1c",
                      "Lipid Profile",
                      "TSH",
                      "Urine Routine",
                      "X-Ray Chest",
                      "ECG",
                      "CRP",
                      "ESR",
                    ]}
                    placeholder="Pick or type a test"
                    onChange={(v) => patch("plan", { investigations: v })}
                  />
                </MiniCard>

                <MiniCard title="Instructions">
                  <LabeledTextarea
                    label="Instructions (for investigation)"
                    value={value.plan.investigationInstructions ?? ""}
                    onChange={(v) =>
                      patch("plan", { investigationInstructions: v })
                    }
                    placeholder="e.g., Fasting 8–10 hours; bring previous reports…"
                  />
                </MiniCard>
              </div>

              {/* Inner More / Less to reveal MiniCards */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-xs text-gray-700 hover:text-gray-900"
                  onClick={() => setOpenPlanMore((s) => !s)}
                >
                  {openPlanMore ? "Less" : "More"}
                </button>
              </div>

              {openPlanMore && (
                <div className="grid gap-3">
                  {/* ================= Row 2 — Advice + General Assessment ================= */}
                  <div className="grid lg:grid-cols-2 gap-3">
                    <MiniCard title="Advice">
                      <LabeledTextarea
                        label="Advice"
                        value={value.plan.advice ?? ""}
                        onChange={(v) => patch("plan", { advice: v })}
                        placeholder="Diet, activity, medicines, red-flag symptoms…"
                      />
                    </MiniCard>

                    <MiniCard title="General Assessment">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <LabeledTextarea
                          label="Patient Note"
                          value={value.plan.patientNote ?? ""}
                          onChange={(v) => patch("plan", { patientNote: v })}
                          placeholder="Patient’s concerns / expectations…"
                        />
                        <LabeledTextarea
                          label="Doctor Note"
                          value={value.plan.doctorNote ?? ""}
                          onChange={(v) => patch("plan", { doctorNote: v })}
                          placeholder="Differential, plan, watch-outs…"
                        />
                      </div>
                    </MiniCard>
                  </div>

                  {/* ============== Row 3 — Follow-Up Advice + Document Upload ============== */}
                  <div className="grid lg:grid-cols-2 gap-3">
                    <MiniCard title="Follow-Up Advice">
                      <div className="grid sm:grid-cols-2 gap-2">
                        {/* Date + Book */}
                        <div className="grid gap-1">
                          <label className="text-[11px] text-gray-600">
                            Follow-up Date
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              className="ui-input w-full"
                              value={value.plan.followUpDate ?? ""}
                              onChange={(e) =>
                                patch("plan", { followUpDate: e.target.value })
                              }
                            />
                            <button
                              type="button"
                              className="px-3 rounded-lg text-xs bg-white shadow-sm ring-1 ring-gray-200/70 hover:bg-gray-50"
                              onClick={() => {
                                // hook into your scheduler if/when available
                                console.log("Book appointment clicked");
                              }}
                            >
                              Book
                            </button>
                          </div>
                        </div>

                        {/* Instructions */}
                        <LabeledTextarea
                          label="Follow-up Instructions"
                          value={value.plan.followUpInstructions ?? ""}
                          onChange={(v) =>
                            patch("plan", { followUpInstructions: v })
                          }
                          placeholder="When to return, tests to bring, warning signs…"
                        />
                      </div>
                    </MiniCard>

                    {/* --------- Document Upload (files + note) --------- */}
                    <MiniCard title="Documents">
                      <div className="grid gap-2">
                        <div className="grid gap-1">
                          <label className="text-[11px] text-gray-600">
                            Upload files
                          </label>
                          <input
                            type="file"
                            multiple
                            className="ui-input w-full"
                            onChange={(e) => {
                              const picked = Array.from(
                                e.currentTarget.files ?? []
                              );
                              const prev = value.plan.attachments?.files ?? [];
                              patch("plan", {
                                attachments: {
                                  ...(value.plan.attachments || {}),
                                  files: [...prev, ...picked],
                                },
                              });
                              // clear input so same files can be re-picked if needed
                              e.currentTarget.value = "";
                            }}
                          />
                        </div>

                        {/* Show selected files as small chips with a remove */}
                        {(value.plan.attachments?.files ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {(value.plan.attachments?.files ?? []).map(
                              (f, i) => (
                                <div
                                  key={i}
                                  className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs bg-white shadow-sm ring-1 ring-gray-200/70"
                                >
                                  <span className="truncate max-w-[180px]">
                                    {f.name}
                                  </span>
                                  <button
                                    type="button"
                                    title="Remove file"
                                    className="leading-none text-gray-700 hover:text-gray-900"
                                    onClick={() => {
                                      const prev =
                                        value.plan.attachments?.files ?? [];
                                      const next = prev.filter(
                                        (_, idx) => idx !== i
                                      );
                                      patch("plan", {
                                        attachments: {
                                          ...(value.plan.attachments || {}),
                                          files: next,
                                        },
                                      });
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        <LabeledTextarea
                          label="Document Note"
                          value={value.plan.attachments?.note ?? ""}
                          onChange={(v) =>
                            patch("plan", {
                              attachments: {
                                ...(value.plan.attachments || {}),
                                note: v,
                              },
                            })
                          }
                          placeholder="Any remarks about the uploaded documents…"
                        />
                      </div>
                    </MiniCard>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardShell>
      </div>
    </div>
  );

  /* ---------- local helpers ---------- */
  function updateRx(
    idx: number,
    changes: Partial<DigitalRxFormState["prescription"][number]>
  ) {
    const next = value.prescription.slice();
    next[idx] = { ...next[idx], ...changes };
    onChange({ ...value, prescription: next });
  }
}

/* --------------------- Small UI primitives --------------------- */
function CardShell({
  title,
  children,
  moreLabel,
  borderless = false,
  onMore,
}: {
  title: string;
  children?: React.ReactNode;
  moreLabel: string;
  borderless?: boolean;
  onMore: () => void;
}) {
  return (
    <section className="bg-white shadow-md p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <button
          type="button"
          className="text-sm text-gray-700 hover:text-gray-900"
          onClick={onMore}
          // “More” renders like text; no border
          style={{ border: "none", background: "transparent", padding: 0 }}
        >
          {moreLabel}
        </button>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function MiniCard({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-300 p-3 bg-white">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex items-center justify-between w-full text-xs font-medium text-gray-700"
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function TinyHint({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-gray-500">{children}</div>;
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="grid gap-1 min-w-0">
      <label className="text-[11px] text-gray-600">{label}</label>
      <input
        className="ui-input w-full min-w-0 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1 min-w-0">
      <label className="text-[11px] text-gray-600">{label}</label>
      <textarea
        className="ui-input w-full min-h-[50px] shadow-md focus:shadow-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function CellHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-2 py-1.5 text-left text-gray-700 ${className}`}>
      {children}
    </div>
  );
}

/* A reusable “sleek, borderless” table.
   - headers: string[]
   - rows: { key: string; cells: ReactNode[] }[] */
function BorderlessTable({
  headers,
  rows,
  emptyText,
}: {
  headers: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
  emptyText: string;
}) {
  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${headers.length}, minmax(0,1fr))`,
        }}
      >
        {/* header row */}
        {headers.map((h, i) => (
          <div
            key={`h-${i}`}
            className="px-2 py-1.5 text-xs text-gray-600 bg-gray-50"
          >
            {h}
          </div>
        ))}
      </div>

      <div className="divide-y">
        {rows.length === 0 ? (
          <div className="px-3 py-3 text-xs text-gray-500">{emptyText}</div>
        ) : (
          rows.map((r) => (
            <div
              key={r.key}
              className="grid items-start gap-2 px-2 py-2"
              style={{
                gridTemplateColumns: `repeat(${headers.length}, minmax(0,1fr))`,
              }}
            >
              {r.cells.map((c, i) => (
                <div key={`${r.key}-c${i}`} className="min-w-0">
                  {c}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
/* A reusable “sleek, borderless” table-Style2.
   - headers: string[]
   - rows: { key: string; cells: ReactNode[] }[] */
type LTColumn =
  | {
      key: string;
      header: string;
      type?: "text" | "number" | "date";
      placeholder?: string;
      className?: string;
    }
  | {
      key: string;
      header: string;
      type: "select";
      options: string[];
      className?: string;
    };

//------------------- Tabeled Table starts --------------------//

// ---------------- Types ----------------

function isSelectColumn(col: LTColumn): col is SelectColumn {
  return (col as SelectColumn).type === "select";
}

// --------------- Component ---------------

// ---------------- Types ----------------
type TextColumn = {
  key: string;
  header: string;
  type?: "text" | "number" | "date";
  placeholder?: string;
  className?: string;
};

type SelectColumn = {
  key: string;
  header: string;
  type: "select";
  options: string[];
  className?: string;
};

// --------------- Component ---------------
function LabeledTable({
  label,
  columns,
  value,
  onChange,
  getDefaultRow,
  emptyText = "No rows.",
  /** @deprecated kept for backward-compat; ignored (no per-row × anymore) */
  showRowDelete = false,
  /** Single +/- toggle, visually outside the row (right edge) */
  showAddRemove = true,
}: {
  label: string;
  columns: LTColumn[];
  value: Record<string, string | undefined>[];
  onChange: (rows: Record<string, string | undefined>[]) => void;
  getDefaultRow?: () => Record<string, string | undefined>;
  emptyText?: string;
  showRowDelete?: boolean; // ignored
  showAddRemove?: boolean;
}) {
  // Optimistic rendering in case parent state updates are async/laggy
  const [optimisticRows, setOptimisticRows] = useState<
    Record<string, string | undefined>[] | null
  >(null);

  const rows = optimisticRows ?? value;

  // Sync back to controlled prop
  useEffect(() => {
    setOptimisticRows(null);
  }, [value]);

  // Ensure clean row (no undefined)
  const sanitizeRow = (
    row?: Record<string, string | undefined>
  ): Record<string, string> => {
    const base: Record<string, string> = {};
    columns.forEach((col) => {
      const v = row?.[col.key];
      base[col.key] = v ?? (isSelectColumn(col) ? col.options?.[0] ?? "" : "");
    });
    return base;
  };

  const makeDefaultRow = (): Record<string, string> =>
    sanitizeRow(getDefaultRow?.());

  // Default editable row when table is empty
  const [stagedRow, setStagedRow] = useState<Record<string, string>>(() =>
    makeDefaultRow()
  );

  // If columns change or rows cleared, rebuild staged row
  useEffect(() => {
    if (rows.length === 0) setStagedRow(makeDefaultRow());
  }, [columns, rows.length]);

  // Icon follows actual row count
  const addMode = rows.length === 0; // + when empty, − otherwise

  const addRow = (row?: Record<string, string>) => {
    const next = [...rows, row ?? makeDefaultRow()];
    setOptimisticRows(next);
    onChange(next);
  };

  const removeLast = () => {
    if (!rows.length) return;
    const next = rows.slice(0, -1);
    setOptimisticRows(next);
    onChange(next);
  };

  const handleToggle = () => {
    if (rows.length === 0) {
      addRow(stagedRow);
    } else {
      removeLast();
    }
  };

  const updateCell = (rowIndex: number, key: string, nextVal: string) => {
    const next = rows.slice();
    next[rowIndex] = { ...(next[rowIndex] || {}), [key]: nextVal };
    setOptimisticRows(next);
    onChange(next);
  };

  // Only data columns; no extra actions column or empty header cell
  const colCount = columns.length;

  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-gray-600">{label}</label>
      </div>

      <div className="rounded-md overflow-hidden bg-white">
        {/* Header (no actions column) */}
        <div
          className="grid bg-gray-200 text-xs text-gray-600"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0,1fr))` }}
        >
          {columns.map((col) => (
            <div key={`h-${col.key}`} className="px-2 py-1.5">
              {col.header}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y">
          {rows.length === 0 ? (
            // Default editable row with floating + toggle
            <div
              className="relative grid items-center gap-2 px-2 py-2"
              style={{
                gridTemplateColumns: `repeat(${colCount}, minmax(0,1fr))`,
              }}
            >
              {columns.map((col) => (
                <div key={`default-c-${col.key}`} className="min-w-0">
                  {isSelectColumn(col) ? (
                    <select
                      className="ui-input w-full"
                      value={stagedRow[col.key] ?? ""}
                      onChange={(e) =>
                        setStagedRow((s) => ({
                          ...s,
                          [col.key]: e.target.value,
                        }))
                      }
                    >
                      {col.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="ui-input w-full"
                      type={col.type || "text"}
                      placeholder={col.placeholder}
                      value={stagedRow[col.key] ?? ""}
                      onChange={(e) =>
                        setStagedRow((s) => ({
                          ...s,
                          [col.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}

              {/* Floating +/- toggle (inside container, at the right edge; not a grid cell) */}
              {showAddRemove && (
                <button
                  type="button"
                  onClick={handleToggle}
                  title={addMode ? "Add row" : "Remove last row"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 text-lg font-bold leading-none text-gray-700 hover:text-gray-900"
                  style={{ background: "transparent" }}
                  aria-label={addMode ? "Add row" : "Remove last row"}
                >
                  {addMode ? "+" : "–"}
                </button>
              )}
            </div>
          ) : (
            rows.map((row, rowIdx) => (
              <div
                key={`r-${rowIdx}`}
                className="relative grid items-center gap-2 px-2 py-2"
                style={{
                  gridTemplateColumns: `repeat(${colCount}, minmax(0,1fr))`,
                }}
              >
                {columns.map((col) => (
                  <div key={`r-${rowIdx}-c-${col.key}`} className="min-w-0">
                    {isSelectColumn(col) ? (
                      <select
                        className="ui-input w-full"
                        value={(row[col.key] as string) ?? ""}
                        onChange={(e) =>
                          updateCell(rowIdx, col.key, e.target.value)
                        }
                      >
                        {col.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="ui-input w-full"
                        type={col.type || "text"}
                        placeholder={col.placeholder}
                        value={(row[col.key] as string) ?? ""}
                        onChange={(e) =>
                          updateCell(rowIdx, col.key, e.target.value)
                        }
                      />
                    )}
                  </div>
                ))}

                {/* Floating +/- toggle only for the LAST row */}
                {showAddRemove && rowIdx === rows.length - 1 && (
                  <button
                    type="button"
                    onClick={handleToggle}
                    title={addMode ? "Add row" : "Remove last row"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 text-lg font-bold leading-none text-gray-700 hover:text-gray-900"
                    style={{ background: "transparent" }}
                    aria-label={addMode ? "Add row" : "Remove last row"}
                  >
                    {addMode ? "+" : "–"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

//------------- Labeled Table ends ---------------------//

//---------------Prescription Table -----------------//

export type RxRow = {
  medicine: string;
  frequency: string;
  instruction: string;
  duration: string;
  dosage: string;
};

export function PrescriptionTable({
  value,
  onChange,
  className = "",
  maxHeight = "max-h-[46vh]",
}: {
  value: RxRow[];
  onChange: (rows: RxRow[]) => void;
  className?: string;
  /** Tailwind max-height for the scroll area */
  maxHeight?: string;
}) {
  const addRow = () =>
    onChange([
      ...value,
      {
        medicine: "",
        frequency: "",
        instruction: "",
        duration: "",
        dosage: "",
      },
    ]);

  const removeRow = (idx: number) =>
    onChange(value.filter((_, i) => i !== idx));

  const updateRow = (idx: number, patch: Partial<RxRow>) => {
    const next = value.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="rounded-md divide-y overflow-hidden bg-white">
        {/* Header strip */}
        <div className="grid grid-cols-12 text-xs sm:text-sm bg-gray-50">
          <div className="col-span-3 px-2 py-1.5 font-medium text-gray-600">
            Medicine
          </div>
          <div className="col-span-2 px-2 py-1.5 font-medium text-gray-600">
            Frequency
          </div>
          <div className="col-span-2 px-2 py-1.5 font-medium text-gray-600">
            Instruction
          </div>
          <div className="col-span-2 px-2 py-1.5 font-medium text-gray-600">
            Duration
          </div>
          <div className="col-span-2 px-2 py-1.5 font-medium text-gray-600">
            Dosage
          </div>
        </div>

        <div className={`${maxHeight} overflow-auto`}>
          {value.map((row, idx) => {
            const isLast = idx === value.length - 1;
            return (
              <div
                key={idx}
                className="relative grid grid-cols-12 items-start gap-2 px-3 py-2 rounded-md bg-white shadow-sm ring-1 ring-gray-200/70 hover:shadow md:hover:shadow-md hover:bg-gray-50/50 transition"
              >
                <div className="col-span-3 min-w-0">
                  <input
                    className="ui-input w-full"
                    value={row.medicine}
                    onChange={(e) =>
                      updateRow(idx, { medicine: e.target.value })
                    }
                    placeholder="e.g., Paracetamol 500 mg"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="ui-input w-full"
                    value={row.frequency}
                    onChange={(e) =>
                      updateRow(idx, { frequency: e.target.value })
                    }
                    placeholder="1-0-1"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="ui-input w-full"
                    value={row.instruction}
                    onChange={(e) =>
                      updateRow(idx, { instruction: e.target.value })
                    }
                    placeholder="After food"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="ui-input w-full"
                    value={row.duration}
                    onChange={(e) =>
                      updateRow(idx, { duration: e.target.value })
                    }
                    placeholder="5 days"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="ui-input w-full"
                    value={row.dosage}
                    onChange={(e) => updateRow(idx, { dosage: e.target.value })}
                    placeholder="500 mg"
                  />
                </div>

                {/* Per-row toggle at end:
                    - last row: "+"
                    - previous rows: "−" (delete that row) */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  {isLast ? (
                    <button
                      type="button"
                      title="Add row"
                      onClick={addRow}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white shadow hover:bg-gray-50 text-gray-700"
                    >
                      +
                    </button>
                  ) : (
                    <button
                      type="button"
                      title="Delete row"
                      onClick={() => removeRow(idx)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white shadow hover:bg-gray-50 text-gray-700"
                    >
                      –
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state with floating controls */}
          {value.length === 0 && (
            <div className="relative px-3 py-6 text-xs text-gray-500">
              No medicines added yet.
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-2">
                <button
                  type="button"
                  title="Add row"
                  onClick={addRow}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white shadow hover:bg-gray-50 text-gray-700"
                >
                  +
                </button>
                <button
                  type="button"
                  title="Remove last row"
                  disabled
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white shadow opacity-40 cursor-not-allowed text-gray-400"
                >
                  –
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable: input + datalist (combobox-like)
import { useId } from "react";

function LabeledCombo({
  label,
  value,
  onChange,
  options,
  placeholder,
  inputMode,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  options: string[]; // suggestions for dropdown
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string; // "text" | "number" etc. (defaults to text)
}) {
  const listId = useId();
  return (
    <div className="grid gap-1 min-w-0">
      <label className="text-[11px] text-gray-600">{label}</label>
      <input
        className="ui-input w-full min-w-0 shadow-sm focus:shadow-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        list={listId}
        inputMode={inputMode}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

function RailMini({
  onAdd,
  onRemove,
  canRemove,
}: {
  onAdd: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={onAdd}
        title="Add"
        className="inline-flex items-center justify-center w-6 h-6 rounded-full border bg-white hover:bg-gray-50"
      >
        +
      </button>
      <button
        type="button"
        onClick={onRemove}
        title="Remove last"
        disabled={!canRemove}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full border bg-white ${
          canRemove ? "hover:bg-gray-50" : "opacity-40 cursor-not-allowed"
        }`}
      >
        –
      </button>
    </div>
  );
}
