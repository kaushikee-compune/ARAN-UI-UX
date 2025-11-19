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
        {/* CARDIOLOGY – THREE COLUMN CLINICAL LAYOUT   */}
        {/* ========================================================= */}

         {/* Heading */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src="/icons/healthcare.png"
            alt="Gynecology Icon"
            className="w-8 h-8 object-contain"
          />
          <h3 className="text-sm font-semibold">Cardiac Risk Assessment</h3>
        </div>
        {/* 3 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* ========================================================= */}
            {/* CARDIOLOGY – VITALS SECTION (REPLACES OLD VITALS BLOCK)   */}
            {/* ========================================================= */}

            <CardioSection title="Vitals (Cardiology)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Systolic BP */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="50"
                    max="300"
                    placeholder="e.g., 120"
                    className="ui-input text-sm"
                    value={safeValue.vitals.bpSystolic || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        bpSystolic: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Diastolic BP */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="30"
                    max="200"
                    placeholder="e.g., 80"
                    className="ui-input text-sm"
                    value={safeValue.vitals.bpDiastolic || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        bpDiastolic: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Resting Heart Rate */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    Resting Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="30"
                    max="200"
                    placeholder="e.g., 72"
                    className="ui-input text-sm"
                    value={safeValue.vitals.heartRateResting || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        heartRateResting: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Active Heart Rate */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    Active Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="40"
                    max="220"
                    placeholder="e.g., 120"
                    className="ui-input text-sm"
                    value={safeValue.vitals.heartRateActive || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        heartRateActive: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardioSection>

            {/* ========================================================= */}
            {/* CARDIOLOGY – RISK ASSESSMENT & HISTORY                    */}
            {/* ========================================================= */}

            <CardioSection title="Risk Assessment & History">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cardiac Risk Assessment */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Cardiac Risk Assessment
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    placeholder="e.g., Diabetes, Hypertension, Dyslipidemia"
                    rows={2}
                    value={safeValue.vitals.cardiacRiskAssessment || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        cardiacRiskAssessment: e.target.value,
                      })
                    }
                  />
                </div>

                {/* History of Heart Attack / Stroke */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    History of Heart Attack / Stroke
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={2}
                    placeholder="e.g., MI in 2018, Stroke in 2021"
                    value={safeValue.vitals.cardiacEventHistory || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        cardiacEventHistory: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Previous Surgeries (Bypass, Stents, Angioplasty) */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Previous Cardiac Surgeries
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={2}
                    placeholder="e.g., Angioplasty (2019), Stent x1, CABG (2020)"
                    value={safeValue.vitals.pastSurgeries || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        pastSurgeries: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Pacemaker / ICD */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Pacemaker / ICD Details
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={2}
                    placeholder="e.g., ICD implanted 2022, Medtronic dual-chamber"
                    value={safeValue.vitals.deviceImplantDetails || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        deviceImplantDetails: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Blood Clotting Risk */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Blood Clotting Risk (DVT / PE History)
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={2}
                    placeholder="e.g., DVT (2021), PE (2019)"
                    value={safeValue.vitals.clottingRisk || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        clottingRisk: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Family History */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Family History of Heart Disease
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={2}
                    placeholder="e.g., Father: MI at 55"
                    value={safeValue.vitals.familyHeartHistory || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        familyHeartHistory: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Smoking History */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Smoking History
                  </label>
                  <select
                    className="ui-input text-sm"
                    value={safeValue.vitals.smokingHistory || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        smokingHistory: e.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Non-Smoker">Non-Smoker</option>
                    <option value="Former Smoker">Former Smoker</option>
                    <option value="Occasional">Occasional</option>
                    <option value="Daily Smoker">Daily Smoker</option>
                  </select>
                </div>

                {/* Alcohol History */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Alcohol Consumption
                  </label>
                  <select
                    className="ui-input text-sm"
                    value={safeValue.vitals.alcoholHistory || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        alcoholHistory: e.target.value,
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

                {/* Dietary Restrictions */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Dietary Restrictions
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={2}
                    placeholder="e.g., Low salt, fluid restriction"
                    value={safeValue.vitals.dietaryRestrictions || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        dietaryRestrictions: e.target.value,
                      })
                    }
                  />
                </div>

                    {/* Physical Activity Level */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    Physical Activity Level
                  </label>
                  <select
                    className="ui-input text-sm"
                    value={safeValue.vitals.activityLevel || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        activityLevel: e.target.value,
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Sedentary">Sedentary</option>
                    <option value="Light Activity">Light Activity</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Intense / Athlete">Intense / Athlete</option>
                  </select>
                </div>

                {/* Exercise Schedule */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    Exercise Routine
                  </label>
                  <input
                    className="ui-input text-sm"
                    placeholder="e.g., 30 mins, 4 days/week"
                    value={safeValue.vitals.exerciseRoutine || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        exerciseRoutine: e.target.value,
                      })
                    }
                  />
                </div>

                

                {/* Sleep Duration */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    Sleep (hours/night)
                  </label>
                  <input
                    type="number"
                    className="ui-input text-sm"
                    placeholder="e.g., 7"
                    value={safeValue.vitals.sleepHours || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        sleepHours: e.target.value,
                      })
                    }
                  />
                </div>

              </div>
            </CardioSection>

            {/* ========================================================= */}
            {/* CARDIOLOGY – METABOLIC PROFILE                             */}
            {/* ========================================================= */}

            <CardioSection title="Metabolic Profile">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LDL */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    LDL (mg/dL)
                  </label>
                  <input
                    type="number"
                    className="ui-input text-sm"
                    placeholder="e.g., 130"
                    value={safeValue.vitals.ldl || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        ldl: e.target.value,
                      })
                    }
                  />
                </div>

                {/* HDL */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    HDL (mg/dL)
                  </label>
                  <input
                    type="number"
                    className="ui-input text-sm"
                    placeholder="e.g., 45"
                    value={safeValue.vitals.hdl || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        hdl: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Triglycerides */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    Triglycerides (mg/dL)
                  </label>
                  <input
                    type="number"
                    className="ui-input text-sm"
                    placeholder="e.g., 180"
                    value={safeValue.vitals.triglycerides || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        triglycerides: e.target.value,
                      })
                    }
                  />
                </div>

                {/* FBS */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    Blood Sugar – Fasting (FBS)
                  </label>
                  <input
                    type="number"
                    className="ui-input text-sm"
                    placeholder="e.g., 95"
                    value={safeValue.vitals.fbs || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        fbs: e.target.value,
                      })
                    }
                  />
                </div>

                {/* HbA1c */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-xs text-gray-600 font-medium mb-1">
                    HbA1c (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="ui-input text-sm"
                    placeholder="e.g., 5.8"
                    value={safeValue.vitals.hba1c || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        hba1c: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardioSection>
          </div>

          <div className="space-y-6">
            {/* ========================================================= */}
            {/* CARDIOLOGY – SYMPTOMS                                      */}
            {/* ========================================================= */}

            <CardioSection title="Symptoms">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Angina Symptoms */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Angina Symptoms (Chest Pain / Tightness)
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    placeholder="Describe onset, duration, radiation, triggers..."
                    rows={2}
                    value={safeValue.vitals.anginaSymptoms || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        anginaSymptoms: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Shortness of Breath */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Shortness of Breath on Exertion
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    placeholder="NYHA class, severity, triggers..."
                    rows={2}
                    value={safeValue.vitals.shortnessOfBreath || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        shortnessOfBreath: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Palpitations / Irregular Heartbeats */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Palpitations / Irregular Heartbeats
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    placeholder="Frequency, duration, associated symptoms..."
                    rows={2}
                    value={safeValue.vitals.palpitations || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        palpitations: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Edema (Leg Swelling) */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Edema (Leg / Foot Swelling)
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    placeholder="Pitting grade, duration, laterality..."
                    rows={2}
                    value={safeValue.vitals.edema || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        edema: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardioSection>

            {/* ========================================================= */}
            {/* CARDIOLOGY – CARDIAC TESTS                                 */}
            {/* ========================================================= */}

            <CardioSection title="Cardiac Tests & Investigations">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ECG Findings */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Electrocardiogram (ECG) Findings
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    placeholder="e.g., ST depression in V5–V6, LVH, Arrhythmia..."
                    rows={3}
                    value={safeValue.vitals.ecgFindings || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        ecgFindings: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Echocardiography Results */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Echocardiography (ECHO) Results
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    placeholder="e.g., EF 55%, mild MR, RVSP 28mmHg..."
                    rows={3}
                    value={safeValue.vitals.echoFindings || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        echoFindings: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Stress Test Results */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Exercise Stress Test Results
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    placeholder="e.g., Positive for ischemia after 6 minutes, HR 145 bpm..."
                    rows={3}
                    value={safeValue.vitals.stressTestResults || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        stressTestResults: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardioSection>

            {/* ========================================================= */}
            {/* CARDIOLOGY – MEDICATION & TREATMENT HISTORY                */}
            {/* ========================================================= */}

            <CardioSection title="Medication & Treatment History">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Heart Medications */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Current Heart Medications
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={3}
                    placeholder="e.g., Metoprolol 25mg, Atorvastatin 20mg, Aspirin 75mg..."
                    value={safeValue.vitals.currentHeartMedications || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        currentHeartMedications: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Previous Cardiac Medications */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Previous Cardiac Medications
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={3}
                    placeholder="e.g., Previously on Clopidogrel, stopped in 2022"
                    value={safeValue.vitals.pastCardiacMedications || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        pastCardiacMedications: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Anticoagulation / Blood Thinner History */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Anticoagulation / Blood Thinner History
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={2}
                    placeholder="e.g., On Warfarin since 2020, INR maintained 2.5"
                    value={safeValue.vitals.anticoagulationHistory || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        anticoagulationHistory: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Prior Treatments */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">
                    Prior Treatment History
                  </label>
                  <textarea
                    className="ui-textarea text-sm resize-none"
                    rows={2}
                    placeholder="e.g., Completed cardiac rehab phase 1, long-term statin therapy..."
                    value={safeValue.vitals.treatmentHistory || ""}
                    onChange={(e) =>
                      patch("vitals", {
                        ...safeValue.vitals,
                        treatmentHistory: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardioSection>

            
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

/* ========================================================= */
/* CARDIOLOGY COLLAPSIBLE SECTION                            */
/* ========================================================= */
function CardioSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false); // << DEFAULT COLLAPSED

  return (
    <div className="ui-card rounded-xl shadow-sm border border-gray-200 bg-white">

      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          {/* Caret icon (Option A) */}
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${
              open ? "rotate-90" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M7 5l6 5-6 5V5z" />
          </svg>

          <span className="text-sm font-semibold text-gray-600">{title}</span>
        </div>
      </button>

      {/* Content */}
      <div className={`${open ? "block" : "hidden"} px-3 pb-3`}>
        {children}
      </div>

    </div>
  );
}

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
