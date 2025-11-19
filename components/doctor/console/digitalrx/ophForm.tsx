"use client";
import SnomedSearchBox from "@/components/common/SnomedSearchBox";
import CollapsibleCard from "@/components/common/CollapsibleCard";

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
        {/* OPTHALMOOGY ONE CARD LAYOUT FOR PRE_CONSULTATION SCREENING  */}
        {/* ========================================================= */}

        {/* Heading */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src="/icons/eye.png"
            alt="Gynecology Icon"
            className="w-8 h-8 object-contain"
          />
          <h3 className="text-sm font-semibold">General Eye Screening </h3>
        </div>

        {/* 3 Column Layout */}
        {/* ----------------------- GENERAL MEDICINE VITALS ----------------------- */}
        <CollapsibleCard
          title="Ophthalmic Examination"
          subtitle=""
          defaultOpen={false}
          className="shadow-sm"
        >
          <div className="space-y-6 text-sm">
            {/* -------------------- VISUAL ACUITY -------------------- */}
            <div>
              <div className="font-semibold text-purple-700 mb-2">
                Visual Acuity (VA)
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left w-20">Side</th>
                      <th className="px-2 py-1.5 text-left">U/A</th>
                      <th className="px-2 py-1.5 text-left">Pinhole</th>
                      <th className="px-2 py-1.5 text-left">With Glass</th>
                      <th className="px-2 py-1.5 text-left">BCVA</th>
                    </tr>
                  </thead>

                  <tbody>
                    {["RE", "LE"].map((side) => {
                      // explicitly tell TypeScript these may be ANY object
                      const eyeExam: any =
                        safeValue.vitals.eyeExam &&
                        typeof safeValue.vitals.eyeExam === "object"
                          ? safeValue.vitals.eyeExam
                          : {};

                      const va: any =
                        eyeExam.va && typeof eyeExam.va === "object"
                          ? eyeExam.va
                          : {};

                      const sideObj: any =
                        va[side] && typeof va[side] === "object"
                          ? va[side]
                          : {};

                      return (
                        <tr key={side} className="border-t">
                          <td className="px-2 py-1.5 font-medium">{side}</td>

                          {["unaided", "pinhole", "withGlass", "bcva"].map(
                            (field) => (
                              <td key={field} className="px-2 py-1.5">
                                <input
                                  className="ui-input w-full"
                                  placeholder="6/9"
                                  value={sideObj[field] || ""}
                                  onChange={(e) =>
                                    patch("vitals", {
                                      ...safeValue.vitals,
                                      eyeExam: {
                                        ...eyeExam,
                                        va: {
                                          ...va,
                                          [side]: {
                                            ...sideObj,
                                            [field]: e.target.value,
                                          },
                                        },
                                      },
                                    })
                                  }
                                />
                              </td>
                            )
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* -------------------- REFRACTION -------------------- */}
            <div>
              <div className="font-semibold text-purple-700 mb-2">
                Refraction (Auto + Manual)
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 w-20">Eye</th>
                      <th className="px-2 py-1.5">Sphere</th>
                      <th className="px-2 py-1.5">Cylinder</th>
                      <th className="px-2 py-1.5">Axis</th>
                      <th className="px-2 py-1.5">Add</th>
                      <th className="px-2 py-1.5">Method</th>
                    </tr>
                  </thead>

                  <tbody>
                    {["RE", "LE"].map((side) => {
                      // Normalize eyeExam safely
                      const eyeExam: any =
                        safeValue.vitals.eyeExam &&
                        typeof safeValue.vitals.eyeExam === "object"
                          ? safeValue.vitals.eyeExam
                          : {};

                      const refraction: any =
                        eyeExam.refraction &&
                        typeof eyeExam.refraction === "object"
                          ? eyeExam.refraction
                          : {};

                      const sideObj: any =
                        refraction[side] && typeof refraction[side] === "object"
                          ? refraction[side]
                          : {};

                      return (
                        <tr key={side} className="border-t">
                          <td className="px-2 py-1.5 font-medium">{side}</td>

                          {["sphere", "cylinder", "axis", "add"].map(
                            (field) => (
                              <td key={field} className="px-2 py-1.5">
                                <input
                                  className="ui-input w-full"
                                  placeholder={
                                    field === "axis" ? "90°" : "-1.50"
                                  }
                                  value={sideObj[field] || ""}
                                  onChange={(e) =>
                                    patch("vitals", {
                                      ...safeValue.vitals,
                                      eyeExam: {
                                        ...eyeExam,
                                        refraction: {
                                          ...refraction,
                                          [side]: {
                                            ...sideObj,
                                            [field]: e.target.value,
                                          },
                                        },
                                      },
                                    })
                                  }
                                />
                              </td>
                            )
                          )}

                          {/* Refraction Method */}
                          <td className="px-2 py-1.5">
                            <select
                              className="ui-input w-full"
                              value={refraction.method || ""}
                              onChange={(e) =>
                                patch("vitals", {
                                  ...safeValue.vitals,
                                  eyeExam: {
                                    ...eyeExam,
                                    refraction: {
                                      ...refraction,
                                      method: e.target.value,
                                    },
                                  },
                                })
                              }
                            >
                              <option value="">Select</option>
                              <option>Auto</option>
                              <option>Manual</option>
                              <option>Auto + Subjective</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* -------------------- IOP -------------------- */}
            <div>
              <div className="font-semibold text-purple-700 mb-2">
                Intraocular Pressure (IOP)
              </div>

              {/* -------------------- IOP -------------------- */}
              <div>
                

                {(() => {
                  // ⭐ Normalize eyeExam and iop safely (TS-safe)
                  const eyeExam: any =
                    safeValue.vitals.eyeExam &&
                    typeof safeValue.vitals.eyeExam === "object"
                      ? safeValue.vitals.eyeExam
                      : {};

                  const iop: any =
                    eyeExam.iop && typeof eyeExam.iop === "object"
                      ? eyeExam.iop
                      : {};

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-[25%_25%_50%] gap-3">
                      {/* RE input */}
                      <input
                        className="ui-input"
                        placeholder="RE (mmHg)"
                        value={iop.right || ""}
                        onChange={(e) =>
                          patch("vitals", {
                            ...safeValue.vitals,
                            eyeExam: {
                              ...eyeExam,
                              iop: {
                                ...iop,
                                right: e.target.value,
                              },
                            },
                          })
                        }
                      />

                      {/* LE input */}
                      <input
                        className="ui-input"
                        placeholder="LE (mmHg)"
                        value={iop.left || ""}
                        onChange={(e) =>
                          patch("vitals", {
                            ...safeValue.vitals,
                            eyeExam: {
                              ...eyeExam,
                              iop: {
                                ...iop,
                                left: e.target.value,
                              },
                            },
                          })
                        }
                      />

                      {/* Method select */}
                      <select
                        className="ui-input"
                        value={iop.method || ""}
                        onChange={(e) =>
                          patch("vitals", {
                            ...safeValue.vitals,
                            eyeExam: {
                              ...eyeExam,
                              iop: {
                                ...iop,
                                method: e.target.value,
                              },
                            },
                          })
                        }
                      >
                        <option value="">Method</option>
                        <option>NCT</option>
                        <option>Goldmann Applanation</option>
                        <option>Tonopen</option>
                      </select>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* -------------------- SLIT LAMP -------------------- */}
            <div>
              <div className="font-semibold text-purple-700 mb-2">
                Slit Lamp – Anterior Segment
              </div>

              {/* -------------------- SLIT LAMP -------------------- */}
              <div>
                

                {(() => {
                  // ⭐ Normalize safely for TypeScript
                  const eyeExam: any =
                    safeValue.vitals.eyeExam &&
                    typeof safeValue.vitals.eyeExam === "object"
                      ? safeValue.vitals.eyeExam
                      : {};

                  const slitLamp: any =
                    eyeExam.slitLamp && typeof eyeExam.slitLamp === "object"
                      ? eyeExam.slitLamp
                      : {};

                  return (
                    <div className="grid md:grid-cols-3 gap-3">
                      {[
                        "lids",
                        "conjunctiva",
                        "cornea",
                        "anteriorChamber",
                        "iris",
                        "lens",
                      ].map((part) => (
                        <div key={part}>
                          <label className="text-[11px] text-gray-600 capitalize">
                            {part}
                          </label>

                          <textarea
                            className="ui-textarea w-full min-h-[60px]"
                            value={slitLamp[part] || ""}
                            onChange={(e) =>
                              patch("vitals", {
                                ...safeValue.vitals,
                                eyeExam: {
                                  ...eyeExam,
                                  slitLamp: {
                                    ...slitLamp,
                                    [part]: e.target.value,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* -------------------- COLOUR VISION -------------------- */}
            <div>
              <div className="font-semibold text-purple-700 mb-2">
                Colour Vision
              </div>

              {/* -------------------- COLOUR VISION -------------------- */}
              <div>
                

                {(() => {
                  // ⭐ Normalize safely
                  const eyeExam: any =
                    safeValue.vitals.eyeExam &&
                    typeof safeValue.vitals.eyeExam === "object"
                      ? safeValue.vitals.eyeExam
                      : {};

                  const colorVision: any =
                    typeof eyeExam.colorVision === "string"
                      ? eyeExam.colorVision
                      : "";

                  return (
                    <input
                      className="ui-input w-full max-w-sm"
                      placeholder="Ishihara – Normal / Defective"
                      value={colorVision}
                      onChange={(e) =>
                        patch("vitals", {
                          ...safeValue.vitals,
                          eyeExam: {
                            ...eyeExam,
                            colorVision: e.target.value,
                          },
                        })
                      }
                    />
                  );
                })()}
              </div>
            </div>

            {/* -------------------- GLAUCOMA SCREENING -------------------- */}
            <div>
              <div className="font-semibold text-purple-700 mb-2">
                Glaucoma Screening
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-gray-600">C/D Ratio</label>
                  {(() => {
                    // ⭐ Normalize safely
                    const eyeExam: any =
                      safeValue.vitals.eyeExam &&
                      typeof safeValue.vitals.eyeExam === "object"
                        ? safeValue.vitals.eyeExam
                        : {};

                    const glaucoma: any =
                      eyeExam.glaucoma && typeof eyeExam.glaucoma === "object"
                        ? eyeExam.glaucoma
                        : {};

                    return (
                      <input
                        className="ui-input w-full"
                        value={glaucoma.cdr || ""}
                        onChange={(e) =>
                          patch("vitals", {
                            ...safeValue.vitals,
                            eyeExam: {
                              ...eyeExam,
                              glaucoma: {
                                ...glaucoma,
                                cdr: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    );
                  })()}
                </div>

                <div>
                  <label className="text-[11px] text-gray-600">
                    RNFL / OCT
                  </label>
                  {(() => {
                    // ⭐ Normalize safely
                    const eyeExam: any =
                      safeValue.vitals.eyeExam &&
                      typeof safeValue.vitals.eyeExam === "object"
                        ? safeValue.vitals.eyeExam
                        : {};

                    const glaucoma: any =
                      eyeExam.glaucoma && typeof eyeExam.glaucoma === "object"
                        ? eyeExam.glaucoma
                        : {};

                    return (
                      <input
                        className="ui-input w-full"
                        value={glaucoma.oct || ""}
                        onChange={(e) =>
                          patch("vitals", {
                            ...safeValue.vitals,
                            eyeExam: {
                              ...eyeExam,
                              glaucoma: {
                                ...glaucoma,
                                oct: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    );
                  })()}
                </div>

                <div>
                  <label className="text-[11px] text-gray-600">
                    Field Test
                  </label>
                  {(() => {
                    // ⭐ Normalize safely
                    const eyeExam: any =
                      safeValue.vitals.eyeExam &&
                      typeof safeValue.vitals.eyeExam === "object"
                        ? safeValue.vitals.eyeExam
                        : {};

                    const glaucoma: any =
                      eyeExam.glaucoma && typeof eyeExam.glaucoma === "object"
                        ? eyeExam.glaucoma
                        : {};

                    return (
                      <input
                        className="ui-input w-full"
                        value={glaucoma.fields || ""}
                        onChange={(e) =>
                          patch("vitals", {
                            ...safeValue.vitals,
                            eyeExam: {
                              ...eyeExam,
                              glaucoma: {
                                ...glaucoma,
                                fields: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleCard>

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
