"use client";
import SnomedSearchBox from "@/components/common/SnomedSearchBox";

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";

/* ----------------------- TYPES ----------------------- */
export type InsertTarget =
  | "chiefComplaints"
  | "allergies"
  | "medicalHistory"
  | "investigationAdvice"
  | "procedure"
  | "followUp";

export type DigitalRxFormHandle = {
  insert: (target: InsertTarget, text: string) => void;
};

export type RxRow = {
  medicine: string;
  frequency: string;
  timing?: string;
  duration: string;
  dosage: string;
  instruction?: string;
  snomedCode?: string;
};

export type DigitalRxFormState = {
  vitals: Record<string, string | undefined>;
  chiefComplaintRows?: Array<{
    symptom: string;
    since?: string;
    severity?: string;
  }>;
  diagnosisRows?: Array<{
    diagnosis: string;
    type?: string;
    status?: string;
  }>;
  allergies?: string;
  medicalHistory?: string;
  investigationRows?: Array<{
    investigation: string;
    notes?: string;
    status?: string;
  }>;
  procedureRows?: Array<{ procedure: string; notes?: string; status?: string }>;
  followUpText?: string;
  followUpDate?: string;
  medications?: RxRow[];
};

export type DigitalRxFormProps = {
  value: DigitalRxFormState;
  onChange: (next: DigitalRxFormState) => void;
  bpHistory?: Array<{ date: string; sys: number; dia: number }>;
};

/* ----------------------- COMPONENT ----------------------- */
const DigitalRxForm = forwardRef<DigitalRxFormHandle, DigitalRxFormProps>(
  ({ value, onChange, bpHistory }, ref) => {
    const chiefRef = useRef<HTMLTextAreaElement | null>(null);
    const [showVitalsConfig, setShowVitalsConfig] = useState(false);
    const [showBpTrend, setShowBpTrend] = useState(false);

    useEffect(() => {
      // Focus chief complaint SNOMED search box when form loads
      chiefSearchRef.current?.focus();
    }, []);

    useEffect(() => {
      if (
        !safeValue.chiefComplaintRows ||
        safeValue.chiefComplaintRows.length === 0
      ) {
        patch("chiefComplaintRows", [{ symptom: "", since: "", severity: "" }]);
      }
      if (!safeValue.diagnosisRows || safeValue.diagnosisRows.length === 0) {
        patch("diagnosisRows", [{ diagnosis: "", type: "", status: "" }]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const safeValue: DigitalRxFormState = {
      //vitals: value.vitals || {},
      ...value,
    };

    useImperativeHandle(ref, () => ({
      insert: (target, text) => {
        onChange({
          ...safeValue,
          [target]: (safeValue as any)[target] + "\n" + text,
        });
      },
    }));

    const chiefSearchRef = useRef<HTMLInputElement | null>(null);

    const patch = <K extends keyof DigitalRxFormState>(
      key: K,
      partial: DigitalRxFormState[K]
    ) => onChange({ ...safeValue, [key]: partial });

    const addRxRow = () =>
      patch("medications", [
        ...(safeValue.medications ?? []),
        { medicine: "", frequency: "", duration: "", dosage: "" },
      ]);

    const removeRxRow = (i: number) =>
      patch(
        "medications",
        (safeValue.medications ?? []).filter((_, idx) => idx !== i)
      );

    const updateRxRow = (i: number, row: Partial<RxRow>) => {
      const next = [...(safeValue.medications ?? [])];
      next[i] = { ...next[i], ...row };
      patch("medications", next);
    };

    const vitalOrder = [
      "temperature",
      "bp",
      "spo2",
      "pulse",
      "weight",
      "height",
    ];
    const nextFocus = (current: string) => {
      const idx = vitalOrder.indexOf(current);
      if (idx >= 0 && idx < vitalOrder.length - 1) {
        const nextId = `vital-${vitalOrder[idx + 1]}`;
        document.getElementById(nextId)?.focus();
      }
    };

    const [vitalConfig, setVitalConfig] = useState<Record<string, boolean>>({
      bmi: false,
      headCircumference: false,
      chest: false,
      waist: false,
      womensHealth_lmpDate: false,
      womensHealth_cycle: false,
      lifestyle_smoking: false,
      lifestyle_sleep: false,
    });

    const vitalOptions: Record<
      string,
      { label: string; placeholder?: string }
    > = {
      bmi: { label: "BMI", placeholder: "24.3" },
      headCircumference: {
        label: "Head Circumference (cm)",
        placeholder: "50",
      },
      chest: { label: "Chest (cm)", placeholder: "80" },
      waist: { label: "Waist (cm)", placeholder: "72" },
      womensHealth_lmpDate: { label: "LMP Date", placeholder: "dd-mm-yyyy" },
      womensHealth_cycle: { label: "Cycle Length (days)", placeholder: "28" },
      lifestyle_smoking: { label: "Smoking Status", placeholder: "Never" },
      lifestyle_sleep: { label: "Sleep Hours", placeholder: "7" },
    };

    const [editingField, setEditingField] = useState<string | null>(null);

    const [tempRelation, setTempRelation] = useState<string>("");
    const [tempCondition, setTempCondition] = useState<string>("");

    return (
      <div className="ui-card p-6 bg-white rounded-xl shadow-sm  space-y-6 print:shadow-none">
        {/* ========================================================= */}
        {/* GENERAL MEDICINE – THREE COLUMN CLINICAL LAYOUT   */}
        {/* ========================================================= */}

        {/* Heading */}
        <h3 className="text-xl font-bold tracking-wide mb-6 text-gray-800">
          Internal Medicine
        </h3>

        {/* 3 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[30%_30%_40%] gap-6 text-sm">
          {/* ------------------------------------------------------ */}
          {/* COLUMN 1 — General Health Parameters                         */}
          {/* ------------------------------------------------------ */}
          <div className="space-y-3">
            <h4 className="font-semibold text-purple-700 mb-1">Vitals</h4>

            {/* Body Temperature (°C) */}
            <div className="flex items-center gap-2">
              <span className="font-medium">Body Temperature (°C):</span>

              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="30"
                max="45"
                className="ui-input !w-[140px] !px-2 !py-1 text-sm"
                value={safeValue.vitals.temperature || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  // Allow only valid decimal numbers
                  if (/^\d*\.?\d*$/.test(v)) {
                    patch("vitals", {
                      ...safeValue.vitals,
                      temperature: v,
                    });
                  }
                }}
                placeholder="e.g., 36.8"
              />
            </div>

            {/* Blood Pressure (mmHg) */}
            <div className="flex items-center gap-2">
              <span className="font-medium">Blood Pressure (mmHg):</span>

              <input
                type="text"
                className="ui-input !w-[140px] !px-2 !py-1 text-sm"
                placeholder="120/80"
                value={safeValue.vitals.bp || ""}
                onChange={(e) => {
                  let v = e.target.value;

                  // Allow only digits and one slash
                  v = v.replace(/[^\d/]/g, "");

                  // Prevent more than one slash
                  const parts = v.split("/");
                  if (parts.length > 2) return;

                  // Limit digits before/after slash
                  if (parts[0].length > 3) return; // Max 3 digits for systolic
                  if (parts[1] && parts[1].length > 3) return; // Max 3 digits for diastolic

                  patch("vitals", {
                    ...safeValue.vitals,
                    bp: v,
                  });
                }}
              />
            </div>

            {/* Heart Rate (Pulse) */}
            <div className="flex items-center gap-2">
              <span className="font-medium">Heart Rate (bpm):</span>

              <input
                type="number"
                inputMode="numeric"
                min="30"
                max="200"
                className="ui-input !w-[140px] !px-2 !py-1 text-sm"
                placeholder="e.g., 82"
                value={safeValue.vitals.pulse || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*$/.test(v)) {
                    patch("vitals", {
                      ...safeValue.vitals,
                      pulse: v,
                    });
                  }
                }}
              />
            </div>

            {/* Height & Weight */}
            <div className="space-y-2">
              {/* Height */}
              <div className="flex items-center gap-2">
                <span className="font-medium">Height (cm):</span>

                <input
                  type="number"
                  inputMode="numeric"
                  className="ui-input !w-[140px] !px-2 !py-1 text-sm"
                  placeholder="e.g., 160"
                  value={safeValue.vitals.height || ""}
                  onChange={(e) => {
                    const height = e.target.value;
                    if (/^\d*$/.test(height)) {
                      const weight = safeValue.vitals.weight || "";
                      let bmi = "";
                      if (height && weight) {
                        bmi = (
                          Number(weight) / Math.pow(Number(height) / 100, 2)
                        ).toFixed(1);
                      }
                      patch("vitals", {
                        ...safeValue.vitals,
                        height,
                        bmi,
                      });
                    }
                  }}
                />
              </div>

              {/* Weight */}
              <div className="flex items-center gap-2">
                <span className="font-medium">Weight (kg):</span>

                <input
                  type="number"
                  inputMode="numeric"
                  className="ui-input !w-[140px] !px-2 !py-1 text-sm"
                  placeholder="e.g., 65"
                  value={safeValue.vitals.weight || ""}
                  onChange={(e) => {
                    const weight = e.target.value;
                    if (/^\d*$/.test(weight)) {
                      const height = safeValue.vitals.height || "";
                      let bmi = "";
                      if (height && weight) {
                        bmi = (
                          Number(weight) / Math.pow(Number(height) / 100, 2)
                        ).toFixed(1);
                      }
                      patch("vitals", {
                        ...safeValue.vitals,
                        weight,
                        bmi,
                      });
                    }
                  }}
                />
              </div>

              {/* BMI */}
              <div className="flex items-center gap-2">
                <span className="font-medium">BMI:</span>

                <input
                  type="text"
                  readOnly
                  className="ui-input !w-[140px] !px-2 !py-1 text-sm bg-gray-50"
                  value={safeValue.vitals.bmi || ""}
                  placeholder="Auto"
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------ */}
          {/* COLUMN 2 — Health History                         */}
          {/* ------------------------------------------------------ */}
          <div className="space-y-3">
            <h4 className="font-semibold text-purple-700 mb-1">
              Health History & Risk Profile
            </h4>

            {/* Allergies */}
            <div className="space-y-1">
              <span className="font-medium">
                Allergies (Drug, Food, Environmental):
              </span>

              <textarea
                rows={2}
                className="ui-textarea resize-none w-[80%] !py-1 !min-h-[32px] leading-tight"
                placeholder="e.g., Penicillin, Peanuts, Dust allergy"
                value={safeValue.vitals.allergies || ""}
                onChange={(e) =>
                  patch("vitals", {
                    ...safeValue.vitals,
                    allergies: e.target.value,
                  })
                }
              />
            </div>
            {/* Chronic Diseases */}
            <div className="space-y-1">
              <span className="font-medium">Chronic Diseases:</span>

              <textarea
                rows={2}
                className="ui-textarea resize-none w-[80%] !py-1 !min-h-[32px] leading-tight"
                placeholder="e.g., Diabetes, Hypertension, Hypothyroidism"
                value={safeValue.vitals.chronicDiseases || ""}
                onChange={(e) =>
                  patch("vitals", {
                    ...safeValue.vitals,
                    chronicDiseases: e.target.value,
                  })
                }
              />
            </div>
            {/* Past Medical History */}
            <div className="space-y-1">
              <span className="font-medium">
                Past Medical History (Surgeries, Major Illnesses):
              </span>

              <textarea
                rows={2}
                className="ui-textarea resize-none w-[80%] !py-1 !min-h-[32px] leading-tight"
                placeholder="e.g., Appendectomy (2014), Dengue (2017)"
                value={safeValue.vitals.pastMedicalHistory || ""}
                onChange={(e) =>
                  patch("vitals", {
                    ...safeValue.vitals,
                    pastMedicalHistory: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* ------------------------------------------------------ */}
          {/* COLUMN 3 — GENERAL FIELDS (ALLERGIES + MEDICAL HISTORY) */}
          {/* ------------------------------------------------------ */}
          <div className="space-y-3">
            <h4 className="font-semibold text-purple-700 mb-1">
              Medications & Lifestyle History
            </h4>

            {/* Current Medications */}
            <div className="space-y-1">
              <span className="font-medium">
                Current Medications (Including OTC & Supplements):
              </span>

              <textarea
                rows={1}
                className="ui-textarea resize-none !w-[240px] !py-1 !min-h-[32px] leading-tight"
                placeholder="Medicines"
                value={safeValue.vitals.currentMedications || ""}
                onChange={(e) =>
                  patch("vitals", {
                    ...safeValue.vitals,
                    currentMedications: e.target.value,
                  })
                }
              />
            </div>

            {/* Family Medical History */}
            <div className="space-y-2 w-[200px]">
              <span className="font-medium">Family Medical History:</span>

              <div className="flex items-center gap-2">
                <select
                  className="ui-input !w-[120px] !px-2 !py-1 text-sm"
                  value={tempRelation}
                  onChange={(e) => setTempRelation(e.target.value)}
                >
                  <option value="">Relation</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Child">Child</option>
                </select>

                <input
                  className="ui-input !w-[200px] !px-2 !py-1 text-sm"
                  placeholder="e.g., Diabetes, Hypertension"
                  value={tempCondition}
                  onChange={(e) => setTempCondition(e.target.value)}
                />

                <button
                  className="px-2 py-1 text-xs rounded bg-gray-900 text-white"
                  onClick={() => {
                    if (!tempRelation || !tempCondition) return;

                    const entry = `${tempRelation}: ${tempCondition}`;

                    setTempRelation("");
                    setTempCondition("");
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Lifestyle Factors */}
            <div className="space-y-2">
              <span className="font-medium">Lifestyle Factors:</span>

              {/* Smoking */}
              <div className="flex items-center gap-2">
                <span className="w-28 text-gray-600 text-sm">Smoking:</span>
                <select
                  className="ui-input !w-[140px] !px-2 !py-1 text-sm"
                  value={safeValue.vitals.lifestyleSmoking || ""}
                  onChange={(e) =>
                    patch("vitals", {
                      ...safeValue.vitals,
                      lifestyleSmoking: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>
                  <option value="Non-Smoker">Non-Smoker</option>
                  <option value="Occasional">Occasional</option>
                  <option value="Daily Smoker">Daily Smoker</option>
                  <option value="Former Smoker">Former Smoker</option>
                </select>
              </div>

              {/* Alcohol */}
              <div className="flex items-center gap-2">
                <span className="w-28 text-gray-600 text-sm">Alcohol:</span>
                <select
                  className="ui-input !w-[140px] !px-2 !py-1 text-sm"
                  value={safeValue.vitals.lifestyleAlcohol || ""}
                  onChange={(e) =>
                    patch("vitals", {
                      ...safeValue.vitals,
                      lifestyleAlcohol: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>
                  <option value="None">None</option>
                  <option value="Occasional">Occasional</option>
                  <option value="Regular">Regular</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>

              {/* Exercise */}
              <div className="flex items-center gap-2">
                <span className="w-28 text-gray-600 text-sm">Exercise:</span>
                <input
                  type="text"
                  className="ui-input !w-[140px] !px-2 !py-1 text-sm"
                  placeholder="e.g., 3x/week"
                  value={safeValue.vitals.lifestyleExercise || ""}
                  onChange={(e) =>
                    patch("vitals", {
                      ...safeValue.vitals,
                      lifestyleExercise: e.target.value,
                    })
                  }
                />
              </div>

              {/* Diet */}
              <div className="flex items-center gap-2">
                <span className="w-28 text-gray-600 text-sm">Diet:</span>
                <input
                  type="text"
                  className="ui-input !w-[140px] !px-2 !py-1 text-sm"
                  placeholder="e.g., Vegetarian"
                  value={safeValue.vitals.lifestyleDiet || ""}
                  onChange={(e) =>
                    patch("vitals", {
                      ...safeValue.vitals,
                      lifestyleDiet: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chief Complaints (with SNOMED Search) */}
        {/* Chief Complaints */}

        <Section title="Chief Complaints" icon="/icons/symptoms.png">
          {/* SNOMED SearchBox → adds a row */}
          <SnomedSearchBox
            ref={chiefSearchRef}
            semantictag="finding"
            placeholder="Search symptoms (e.g., chest pain)"
            onSelect={({ term }) => {
              const current = safeValue.chiefComplaintRows ?? [];
              const already = current.find((r) => r.symptom === term);
              if (!already)
                patch("chiefComplaintRows", [
                  ...current,
                  { symptom: term, since: "", severity: "" },
                ]);
            }}
          />
          <p>
            <br></br>
          </p>
          <ComplaintTable
            rows={safeValue.chiefComplaintRows ?? []}
            onChange={(next) => patch("chiefComplaintRows", next)}
          />
        </Section>

        <Section title="Diagnosis" icon="/icons/stethoscope.png">
          <DiagnosisTable
            rows={safeValue.diagnosisRows ?? []}
            onChange={(next) => patch("diagnosisRows", next)}
          />
        </Section>

        {/* ----------- Medications ----------- */}
        <Section title="Medications" icon="/icons/medicine.png">
          <MedicationTable
            rows={safeValue.medications ?? []}
            onChange={(rows) => patch("medications", rows)}
            addRxRow={addRxRow}
            removeRxRow={removeRxRow}
            updateRxRow={updateRxRow}
          />
        </Section>

        {/* ----------- Investigation Advice ----------- */}
        <Section title="Investigations" icon="/icons/investigation.png">
          <InvestigationTable
            rows={safeValue.investigationRows ?? []}
            onChange={(next) => patch("investigationRows", next)}
          />
        </Section>

        {/* ----------- Procedure ----------- */}
        <Section title="Procedures" icon="/icons/medical-procedure.png">
          <ProcedureTable
            rows={safeValue.procedureRows ?? []}
            onChange={(next) => patch("procedureRows", next)}
          />
        </Section>

        {/* ----------- Follow-up ----------- */}
        <Section title="Follow-Up" icon="/icons/consent.png">
          <div className="grid md:grid-cols-2 gap-3">
            <LabeledTextarea
              label="Follow-Up Instructions"
              value={safeValue.followUpText || ""}
              onChange={(v) => patch("followUpText", v)}
              placeholder="When to revisit, any special instructions..."
            />
            <LabeledInput
              label="Follow-Up Date"
              type="date"
              value={safeValue.followUpDate || ""}
              onChange={(v) => patch("followUpDate", v)}
            />
          </div>
        </Section>

        {/* ----------- Footer ----------- */}
        <div className="mt-10 text-center py-3 rounded-md text-white text-sm bg-gradient-to-r from-blue-700 to-blue-500">
          <p className="font-semibold">Sushila Mathrutva Clinic</p>
          <p>Near XYZ Landmark, Jayanagar, Bengaluru – 560041</p>
          <p>Phone: +91 98765 43210 | Email: info@sushilaclinic.in</p>
        </div>
      </div>
    );
  }
);

export default DigitalRxForm;

/* ----------------------- Sub Components ----------------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        {icon && <Image src={icon} alt="" width={18} height={18} />}
        <h3 className="text-sm font-semibold ">{title}</h3>
      </div>
      <div className="text-sm">{children}</div>
    </section>
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
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <textarea
        className="w-full bg-transparent outline-none border-b border-gray-300 text-[14px] text-gray-800 placeholder:text-gray-400 focus:border-blue-500 min-h-[80px]"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none border-b border-gray-300 text-[14px] text-gray-800 focus:border-blue-500"
      />
    </div>
  );
}

function VitalInput({
  id,
  label,
  value,
  onChange,
  onEnter,
  maxLength,
  placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-0.5">
      <label htmlFor={id} className="text-sm text-gray-600 w-40 shrink-0">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        inputMode="numeric"
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500"
      />
    </div>
  );
}

function CompactVitalInput({
  id,
  label,
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="text-[12px] text-gray-600 font-medium mb-0.5 truncate"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="bg-transparent border-b border-gray-200 outline-none text-sm text-green-800 placeholder:text-gray-400 focus:border-blue-500 py-0.5"
      />
    </div>
  );
}

/* --------------------- Medication Table (Add + Delete) --------------------- */
function MedicationTable({
  rows,
  onChange,
  addRxRow,
  removeRxRow,
  updateRxRow,
}: {
  rows: RxRow[];
  onChange: (r: RxRow[]) => void;
  addRxRow: () => void;
  removeRxRow: (i: number) => void;
  updateRxRow: (i: number, patch: Partial<RxRow>) => void;
}) {
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    field: keyof RxRow
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const isLastRow = rowIndex === rows.length - 1;
      const fieldOrder: (keyof RxRow)[] = [
        "medicine",
        "frequency",
        "timing",
        "duration",
        "dosage",
        "instruction",
      ];
      const isLastField = field === fieldOrder[fieldOrder.length - 1];
      if (isLastRow && isLastField) {
        e.preventDefault();
        addRxRow();
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md bg-white shadow-sm overflow-visible">
      {/* Header */}
      <div className="grid grid-cols-12 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
        <div className="col-span-3 px-2 py-1.5">
          Medicine (SNOMED Clinical Drug)
        </div>
        <div className="col-span-2 px-2 py-1.5">Frequency</div>
        <div className="col-span-2 px-2 py-1.5">Timings</div>
        <div className="col-span-1 px-2 py-1.5">Duration</div>
        <div className="col-span-1 px-2 py-1.5">Dosage</div>
        <div className="col-span-2 px-2 py-1.5">Instructions</div>
        <div className="col-span-1 px-2 py-1.5 text-center"></div>
      </div>

      {/* Rows */}
      {rows.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 items-center text-[13px]"
            >
              {/* Medicine with SNOMED search */}
              <div className="col-span-3 border-r border-gray-200 px-2 py-1 relative z-50">
                <SnomedSearchBox
                  semantictag="clinical drug"
                  placeholder={row.medicine || "Search medicine"}
                  onSelect={({ term, conceptId }) => {
                    // Extract dosage like "500mg" or "875 milligram"
                    const dosageMatch =
                      term.match(
                        /(\d+\s?(?:mg|ml|mcg|g|milligram|microgram|gram))/i
                      ) || term.match(/(\d+\s?(?:unit|IU|%)?)/i);

                    const parsedDosage = dosageMatch
                      ? dosageMatch[1].replace(/milligram/i, "mg")
                      : "";

                    updateRxRow(idx, {
                      medicine: term,
                      dosage: parsedDosage,
                      snomedCode: conceptId,
                    });
                  }}
                />
              </div>

              {/* Frequency */}
              <div className="col-span-2 border-r border-gray-200 px-1">
                <select
                  className="w-full bg-transparent outline-none text-sm"
                  value={row.frequency ?? ""}
                  onChange={(e) =>
                    updateRxRow(idx, { frequency: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, idx, "frequency")}
                >
                  <option value="">Select</option>
                  <option value="1-0-0">1-0-0</option>
                  <option value="0-1-0">0-1-0</option>
                  <option value="0-0-1">0-0-1</option>
                  <option value="1-0-1">1-0-1</option>
                  <option value="1-1-1">1-1-1</option>
                  <option value="SOS">SOS</option>
                </select>
              </div>

              {/* Timing */}
              <div className="col-span-2 border-r border-gray-200 px-1">
                <select
                  className="w-full bg-transparent outline-none text-sm"
                  value={row.timing ?? ""}
                  onChange={(e) => updateRxRow(idx, { timing: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, "timing")}
                >
                  <option value="">Select</option>
                  <option value="Before Meal">Before Meal</option>
                  <option value="After Meal">After Meal</option>
                  <option value="With Meal">With Meal</option>
                  <option value="Empty Stomach">Empty Stomach</option>
                </select>
              </div>

              {/* Duration */}
              <div className="col-span-1 border-r border-gray-200 px-1">
                <input
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="5 days"
                  value={row.duration ?? ""}
                  onChange={(e) =>
                    updateRxRow(idx, { duration: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, idx, "duration")}
                />
              </div>

              {/* Dosage */}
              <div className="col-span-1 border-r border-gray-200 px-1">
                <input
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="500 mg"
                  value={row.dosage ?? ""}
                  onChange={(e) => updateRxRow(idx, { dosage: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, "dosage")}
                />
              </div>

              {/* Instructions */}
              <div className="col-span-2 border-r border-gray-200 px-1">
                <input
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Take with water"
                  value={row.instruction ?? ""}
                  onChange={(e) =>
                    updateRxRow(idx, { instruction: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, idx, "instruction")}
                />
              </div>

              {/* Delete */}
              <div className="col-span-1 flex items-center justify-center">
                <button
                  type="button"
                  title="Delete row"
                  onClick={() => removeRxRow(idx)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-xs text-gray-500 py-4">
          No medicines added yet.
        </div>
      )}

      {/* Add Row */}
      <div className="p-2 text-right">
        <button
          type="button"
          onClick={addRxRow}
          className="inline-flex items-center gap-1 text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}

function CellHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-2 py-1.5 border-gray-200 ${className || ""}`}>
      {children}
    </div>
  );
}

function CellInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`${className} border-t border-gray-200`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none px-2 py-1 text-sm text-gray-800"
      />
    </div>
  );
}

function ComplaintTable({
  rows,
  onChange,
}: {
  rows: Array<{ symptom: string; since?: string; severity?: string }>;
  onChange: (
    next: Array<{ symptom: string; since?: string; severity?: string }>
  ) => void;
}) {
  const addRow = (symptom = "") =>
    onChange([...rows, { symptom, since: "", severity: "" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (
    i: number,
    patch: Partial<{ symptom: string; since?: string; severity?: string }>
  ) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: "symptom" | "since" | "severity"
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const last = rowIndex === rows.length - 1 && field === "severity";
      if (last) {
        e.preventDefault();
        addRow();
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
      <div className="grid grid-cols-12 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
        <div className="col-span-5 px-2 py-1.5">Symptom</div>
        <div className="col-span-3 px-2 py-1.5">Since</div>
        <div className="col-span-3 px-2 py-1.5">Severity</div>
        <div className="col-span-1 px-2 py-1.5 text-center"> </div>
      </div>

      {rows.length > 0 ? (
        rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 text-[13px]">
            <div className="col-span-5 border-r border-gray-200">
              <input
                className="w-full px-2 py-1 outline-none bg-transparent"
                value={r.symptom}
                placeholder="e.g., Chest pain"
                onChange={(e) => updateRow(i, { symptom: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "symptom")}
              />
            </div>
            <div className="col-span-3 border-r border-gray-200">
              <input
                className="w-full px-2 py-1 outline-none bg-transparent"
                value={r.since}
                placeholder="2 days"
                onChange={(e) => updateRow(i, { since: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "since")}
              />
            </div>
            <div className="col-span-3 border-r border-gray-200">
              <input
                className="w-full px-2 py-1 outline-none bg-transparent"
                value={r.severity}
                placeholder="Mild / Severe"
                onChange={(e) => updateRow(i, { severity: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "severity")}
              />
            </div>
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-xs text-gray-500 py-3">
          No complaints added.
        </div>
      )}
      <div className="p-2 text-right">
        <button
          type="button"
          onClick={() => addRow()}
          className="text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}

function DiagnosisTable({
  rows,
  onChange,
}: {
  rows: Array<{ diagnosis: string; type?: string; status?: string }>;
  onChange: (
    next: Array<{ diagnosis: string; type?: string; status?: string }>
  ) => void;
}) {
  const addRow = (diagnosis = "") =>
    onChange([...rows, { diagnosis, type: "", status: "" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (
    i: number,
    patch: Partial<{ diagnosis: string; type?: string; status?: string }>
  ) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    field: "diagnosis" | "type" | "status"
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const isLastRow = rowIndex === rows.length - 1;
      const isLastField = field === "status";
      if (isLastRow && isLastField) {
        e.preventDefault();
        addRow();
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md  bg-white shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-12 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
        <div className="col-span-6 px-2 py-1.5">Diagnosis</div>
        <div className="col-span-3 px-2 py-1.5">Type</div>
        <div className="col-span-2 px-2 py-1.5">Status</div>
        <div className="col-span-1 px-2 py-1.5 text-center"></div>
      </div>

      {/* Rows */}
      {rows.length > 0 ? (
        rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 text-[13px] items-center">
            {/* Diagnosis cell with SNOMED search */}
            <div className="col-span-6 border-r border-gray-200 px-2 py-1">
              <SnomedSearchBox
                semantictag="disorder"
                placeholder={r.diagnosis || "Search diagnosis"}
                onSelect={({ term }) => {
                  updateRow(i, { diagnosis: term });
                }}
              />
            </div>

            {/* Type dropdown */}
            <div className="col-span-3 border-r border-gray-200 px-1 py-1">
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={r.type || ""}
                onChange={(e) => updateRow(i, { type: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "type")}
              >
                <option value="">Select</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>

            {/* Status dropdown */}
            <div className="col-span-2 border-r border-gray-200 px-1 py-1">
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={r.status || ""}
                onChange={(e) => updateRow(i, { status: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "status")}
              >
                <option value="">Select</option>
                <option value="Active">Active</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Delete */}
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-xs text-gray-500 py-3">
          No diagnosis added.
        </div>
      )}

      {/* Add Row */}
      <div className="p-2 text-right">
        <button
          type="button"
          onClick={() => addRow()}
          className="text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}

function InvestigationTable({
  rows,
  onChange,
}: {
  rows: Array<{ investigation: string; notes?: string; status?: string }>;
  onChange: (
    next: Array<{ investigation: string; notes?: string; status?: string }>
  ) => void;
}) {
  const addRow = (investigation = "") =>
    onChange([...rows, { investigation, notes: "", status: "" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (
    i: number,
    patch: Partial<{ investigation: string; notes?: string; status?: string }>
  ) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    field: "investigation" | "notes" | "status"
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const isLastRow = rowIndex === rows.length - 1;
      const isLastField = field === "status";
      if (isLastRow && isLastField) {
        e.preventDefault();
        addRow();
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md  bg-white shadow-sm">
      <div className="grid grid-cols-12 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
        <div className="col-span-5 px-2 py-1.5">Investigation</div>
        <div className="col-span-5 px-2 py-1.5">Notes</div>
        <div className="col-span-1 px-2 py-1.5">Status</div>
        <div className="col-span-1 px-2 py-1.5 text-center"></div>
      </div>

      {rows.length > 0 ? (
        rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 text-[13px] items-center">
            {/* SNOMED search for Investigation (specimen) */}
            <div className="col-span-5 px-2 py-1">
              <SnomedSearchBox
                semantictag="specimen"
                placeholder={r.investigation || "Search  specimen"}
                onSelect={({ term }) => updateRow(i, { investigation: term })}
              />
            </div>

            {/* Notes */}
            <div className="col-span-5 border-r border-gray-200 px-2 py-1">
              <input
                className="w-full outline-none bg-transparent text-sm"
                placeholder="Add notes or details"
                value={r.notes || ""}
                onChange={(e) => updateRow(i, { notes: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "notes")}
              />
            </div>

            {/* Status dropdown */}
            <div className="col-span-1 border-r border-gray-200 px-1 py-1">
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={r.status || ""}
                onChange={(e) => updateRow(i, { status: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "status")}
              >
                <option value="">Select</option>
                <option value="Ordered">Ordered</option>
                <option value="Received">Received</option>
              </select>
            </div>

            {/* Delete */}
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-xs text-gray-500 py-3">
          No investigations added.
        </div>
      )}

      <div className="p-2 text-right">
        <button
          type="button"
          onClick={() => addRow()}
          className="text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}

function ProcedureTable({
  rows,
  onChange,
}: {
  rows: Array<{ procedure: string; notes?: string; status?: string }>;
  onChange: (
    next: Array<{ procedure: string; notes?: string; status?: string }>
  ) => void;
}) {
  const addRow = (procedure = "") =>
    onChange([...rows, { procedure, notes: "", status: "" }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateRow = (
    i: number,
    patch: Partial<{ procedure: string; notes?: string; status?: string }>
  ) => {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    field: "procedure" | "notes" | "status"
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const isLastRow = rowIndex === rows.length - 1;
      const isLastField = field === "status";
      if (isLastRow && isLastField) {
        e.preventDefault();
        addRow();
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-md  bg-white shadow-sm">
      <div className="grid grid-cols-12 bg-gray-100 text-xs font-semibold text-gray-700 border-b border-gray-200">
        <div className="col-span-5 px-2 py-1.5">Procedure</div>
        <div className="col-span-5 px-2 py-1.5">Notes</div>
        <div className="col-span-1 px-2 py-1.5">Status</div>
        <div className="col-span-1 px-2 py-1.5 text-center"></div>
      </div>

      {rows.length > 0 ? (
        rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 text-[13px] items-center">
            {/* SNOMED search for Procedure */}
            <div className="col-span-5 border-r border-gray-200 px-2 py-1">
              <SnomedSearchBox
                semantictag="procedure"
                placeholder={r.procedure || "Search  procedure"}
                onSelect={({ term }) => updateRow(i, { procedure: term })}
              />
            </div>

            {/* Notes */}
            <div className="col-span-5 border-r border-gray-200 px-2 py-1">
              <input
                className="w-full outline-none bg-transparent text-sm"
                placeholder="Add notes or details"
                value={r.notes || ""}
                onChange={(e) => updateRow(i, { notes: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "notes")}
              />
            </div>

            {/* Status dropdown */}
            <div className="col-span-1 border-r border-gray-200 px-1 py-1">
              <select
                className="w-full bg-transparent outline-none text-sm"
                value={r.status || ""}
                onChange={(e) => updateRow(i, { status: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, i, "status")}
              >
                <option value="">Select</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Delete */}
            <div className="col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-xs text-gray-500 py-3">
          No procedures added.
        </div>
      )}

      <div className="p-2 text-right">
        <button
          type="button"
          onClick={() => addRow()}
          className="text-sm text-[--secondary] hover:underline"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}
