"use client";

// ARAN • Doctor → Consultations Page (Modern, Intuitive, One-Page Builder)
// ----------------------------------------------------------------------------
// Purpose
//  - Doctor's primary workspace to create ABDM health records:
//    WellnessRecord, OPConsultRecord, PrescriptionRecord, ImmunizationRecord, LabRecord
//  - Reuses Clinic-Admin UI tokens: ui-card, ui-input, btn-primary, btn-outline, CSS vars
//  - All components are defined inline to avoid external imports and ease copy-paste
//
// Top Bar (per your request)
//  - Removed search and ABHA linking inputs
//  - Shows Patient details: Name, Age, Gender, Contact, ABHA address, ABHA number
//  - Profile icon in secondary color
//  - Left corner: “Generate Summary” action
//  - Center: Last consultation date or “New Patient”
//
// UX Notes
//  - Left: sticky tab bar for record types
//  - Right: active record editor in a card
//  - Bottom: sticky action bar (Save Draft, Validate, Submit & Share)
//  - Keyboard shortcuts: Ctrl+S (Save Draft), Ctrl+Enter (Submit)
// ----------------------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from "react";

// ----------------------------- Types & Constants -----------------------------

type RecordKey =
  | "wellness"
  | "opconsult"
  | "prescription"
  | "immunization"
  | "lab";

const RECORD_TABS: { key: RecordKey; label: string; hint: string }[] = [
  { key: "opconsult", label: "OPConsult", hint: "Findings, Dx, Plan" },
  { key: "prescription", label: "Prescription", hint: "Medications" },
  { key: "immunization", label: "Immunization", hint: "Vaccines" },
  { key: "lab", label: "Lab Records", hint: "Labs & Reports" },
  { key: "wellness", label: "Wellness", hint: "Vitals & Lifestyle" },
];

type PatientInfo = {
  name: string;
  age: string; // years
  gender: "Male" | "Female" | "Other" | "";
  contact: string; // phone
  abhaAddress: string; // PHR address
  abhaNumber: string; // 14-digit ABHA number
};

type Med = {
  id: string;
  name: string;
  route: "PO" | "IV" | "IM" | "Topical" | "Inhale" | "SC";
  dose: string; // e.g., 500 mg
  frequency: string; // e.g., 1-0-1
  duration: string; // e.g., 5 days
  instructions: string;
};

// ----------------------------- Page Component -------------------------------

export default function DoctorConsultationsPage() {
  // ---- Patient context (DISPLAY-ONLY here; wire from your selector or route) ----
  const [patient, setPatient] = useState<PatientInfo>({
    name: "",
    age: "",
    gender: "",
    contact: "",
    abhaAddress: "",
    abhaNumber: "",
  });

  // null => first-time patient (show "New Patient"). Otherwise store ISO date
  const [lastConsultDate, setLastConsultDate] = useState<string | null>(null);

  const lastConsultText = lastConsultDate
    ? formatDate(lastConsultDate)
    : "New Patient";

  // ---- Active tab ----
  const [active, setActive] = useState<RecordKey>("opconsult");

  // ---- OPConsult state (text first; map to FHIR later) ----
  const [opChiefComplaints, setOpChiefComplaints] = useState("");
  const [opExamination, setOpExamination] = useState("");
  const [opDiagnosis, setOpDiagnosis] = useState("");
  const [opPlan, setOpPlan] = useState("");
  const [opAdvice, setOpAdvice] = useState("");

  // ---- Prescription state (dynamic meds) ----
  const [meds, setMeds] = useState<Med[]>([
    {
      id: uid(),
      name: "",
      route: "PO",
      dose: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ]);

  // ---- Immunization state ----
  const [immVaccine, setImmVaccine] = useState("");
  const [immBatch, setImmBatch] = useState("");
  const [immManufacturer, setImmManufacturer] = useState("");
  const [immDoseNum, setImmDoseNum] = useState("");
  const [immDate, setImmDate] = useState("");
  const [immNextDue, setImmNextDue] = useState("");
  const [immSite, setImmSite] = useState("");
  const [immRoute, setImmRoute] = useState("IM");

  // ---- Lab state ----
  const [labTestName, setLabTestName] = useState("");
  const [labSampleDate, setLabSampleDate] = useState("");
  const [labResult, setLabResult] = useState("");

  // ---- Wellness state ----
  const [wlBpSys, setWlBpSys] = useState("");
  const [wlBpDia, setWlBpDia] = useState("");
  const [wlPulse, setWlPulse] = useState("");
  const [wlTemp, setWlTemp] = useState("");
  const [wlSpo2, setWlSpo2] = useState("");
  const [wlHeight, setWlHeight] = useState(""); // cm
  const [wlWeight, setWlWeight] = useState(""); // kg
  const [wlLifestyle, setWlLifestyle] = useState("");
  const [wlFollowUp, setWlFollowUp] = useState("");

  // ---- Toast / status ----
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // ---- Auto BMI ----
  const bmi = useMemo(() => {
    const h = parseFloat(wlHeight);
    const w = parseFloat(wlWeight);
    if (!h || !w) return "";
    const m = h / 100;
    const v = w / (m * m);
    return Number.isFinite(v) ? v.toFixed(1) : "";
  }, [wlHeight, wlWeight]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveDraft();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- Actions (wire to API later) ----
  const validate = useCallback(() => {
    if (!patient.name.trim()) {
      setToast({
        type: "error",
        message: "Please select a patient before proceeding.",
      });
      return false;
    }
    // Example minimal validations per tab
    if (active === "opconsult" && !opChiefComplaints.trim()) {
      setToast({
        type: "error",
        message: "Chief complaints are required for OPConsult.",
      });
      return false;
    }
    if (active === "prescription" && meds.some((m) => !m.name.trim())) {
      setToast({
        type: "error",
        message: "Please enter at least one medication name.",
      });
      return false;
    }
    if (active === "immunization" && !immVaccine.trim()) {
      setToast({
        type: "error",
        message: "Vaccine name is required for Immunization record.",
      });
      return false;
    }
    if (active === "lab" && !labTestName.trim()) {
      setToast({
        type: "error",
        message: "Test name is required for Lab record.",
      });
      return false;
    }
    if (active === "wellness" && (!wlHeight || !wlWeight)) {
      setToast({
        type: "error",
        message: "Height and Weight are needed to compute BMI.",
      });
      return false;
    }
    return true;
  }, [
    active,
    patient.name,
    opChiefComplaints,
    meds,
    immVaccine,
    labTestName,
    wlHeight,
    wlWeight,
  ]);

  const handleSaveDraft = useCallback(() => {
    // Business: Save a local draft or send to your backend as DRAFT
    setToast({ type: "info", message: `Draft saved for ${labelFor(active)}.` });
  }, [active]);

  const handleValidate = useCallback(() => {
    if (!validate()) return;
    // Business: transform to FHIR JSON here and run schema checks (server preferred)
    setToast({
      type: "success",
      message: `Validation passed for ${labelFor(active)}.`,
    });
  }, [validate, active]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    // Business: submit FHIR to your API; on success, optionally share (SMS/ABDM link)
    setToast({
      type: "success",
      message: `${labelFor(active)} submitted successfully.`,
    });
  }, [validate, active]);

  const copyOpToPrescription = useCallback(() => {
    // Business: helpful for doctors — copy OP notes into Rx instructions scaffold
    if (!opPlan && !opAdvice && !opDiagnosis) return;
    setMeds((curr) => {
      const text = [
        opDiagnosis && `Dx: ${opDiagnosis}`,
        opPlan && `Plan: ${opPlan}`,
        opAdvice && `Advice: ${opAdvice}`,
      ]
        .filter(Boolean)
        .join(" | ");
      return curr.map((m, i) =>
        i === 0 && !m.instructions ? { ...m, instructions: text } : m
      );
    });
    setToast({
      type: "info",
      message: "OPConsult notes copied to prescription instructions.",
    });
  }, [opPlan, opAdvice, opDiagnosis]);

  const handleGenerateSummary = useCallback(() => {
    // TODO: hook to your summary/PDF generator
    setToast({ type: "info", message: "Generating consultation summary…" });
  }, []);

  // ------------------------------- Render -----------------------------------

  return (
    <div className="space-y-4">
     
      {/* Patient Context Bar (Top) — sleek */}
      <div className="ui-card p-3">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_170px_160px] items-center gap-3">
          {/* Left: Patient Details */}
          <div className="order-1">
            <div className="flex items-start gap-3">
              {/* Profile icon */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "var(--secondary)",
                  color: "var(--on-secondary)",
                }}
                aria-label="Patient"
                title="Patient"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <circle cx="12" cy="8" r="3" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              </div>

              {/* Details: Row 1 (Name | Age | Gender), Row 2 (ABHA Number | ABHA Address) */}
              <div className="flex-1">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Info label="Patient Name" value={patient.name} />
                  <Info label="Age" value={patient.age} />
                  <Info label="Gender" value={patient.gender} />
                </div>
                {/* Row 2 */}
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Info label="ABHA Number" value={patient.abhaNumber} />
                  <Info label="ABHA Address" value={patient.abhaAddress} />
                </div>
              </div>
            </div>
          </div>

          {/* Center: Last Consultation */}
          <div className="order-2 md:order-2 text-center">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">
              Last Consultation
            </div>
            <div className="text-sm font-medium">{lastConsultText}</div>
          </div>

          {/* Right: Generate Summary (corner button) */}
          <div className="order-3 md:order-3 text-right">
            <button
              className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-2"
              onClick={handleGenerateSummary}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                <path d="M14 3v6h6" />
              </svg>
              Generate Summary
            </button>
          </div>
        </div>
      </div>

      {/* Main Shell: Left tabs + Right editor */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
        {/* Left: Sticky tabs */}
        <aside className="ui-card p-3 h-max sticky top-24">
          <div className="text-xs font-semibold text-gray-600 mb-2">
            Record Types
          </div>
          <nav className="space-y-1">
            {RECORD_TABS.map((t) => {
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={[
                    "w-full text-left px-3 py-2 rounded-lg transition",
                    isActive ? "bg-gray-900 text-white" : "hover:bg-gray-100",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-[11px] text-gray-500">{t.hint}</div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right: Active Editor */}
        <section className="space-y-4">
          {/* Context widgets */}
          <div className="ui-card p-4">
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <Field label="Visit Type">
                <select className="ui-input">
                  <option>OPD</option>
                  <option>Follow-up</option>
                  <option>Daycare</option>
                </select>
              </Field>
              <Field label="Consultation Date">
                <input
                  type="date"
                  className="ui-input"
                  defaultValue={today()}
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  className="ui-input"
                  defaultValue={nowTime()}
                />
              </Field>
              <Field label="Care Context (auto)">
                <input
                  className="ui-input"
                  placeholder="Generated on Submit"
                  disabled
                />
              </Field>
            </div>
          </div>

          {/* Editor card per tab */}
          {active === "opconsult" && (
            <div className="ui-card p-4">
              <HeaderRow
                title="OPConsult Record"
                subtitle="Findings, Diagnoses and Plan"
              />
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Chief Complaints*">
                  <Textarea
                    value={opChiefComplaints}
                    onChange={(e) => setOpChiefComplaints(e.target.value)}
                    placeholder="e.g., Fever, cough for 3 days"
                  />
                </Field>
                <Field label="Examination">
                  <Textarea
                    value={opExamination}
                    onChange={(e) => setOpExamination(e.target.value)}
                    placeholder="Vitals, systemic exams"
                  />
                </Field>
                <Field label="Diagnosis">
                  <Textarea
                    value={opDiagnosis}
                    onChange={(e) => setOpDiagnosis(e.target.value)}
                    placeholder="Primary/secondary Dx"
                  />
                </Field>
                <Field label="Plan">
                  <Textarea
                    value={opPlan}
                    onChange={(e) => setOpPlan(e.target.value)}
                    placeholder="Investigations, follow-up, lifestyle"
                  />
                </Field>
                <Field className="md:col-span-2" label="Advice / Notes">
                  <Textarea
                    value={opAdvice}
                    onChange={(e) => setOpAdvice(e.target.value)}
                    placeholder="Any additional instructions"
                  />
                </Field>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-outline" onClick={copyOpToPrescription}>
                  Copy notes to Prescription
                </button>
                <button className="btn-outline">Attach Documents</button>
              </div>
            </div>
          )}

          {active === "prescription" && (
            <div className="ui-card p-4">
              <HeaderRow
                title="Prescription"
                subtitle="Add medications and instructions"
              />
              <div className="space-y-3">
                {meds.map((m, idx) => (
                  <div
                    key={m.id}
                    className="grid md:grid-cols-6 gap-3 items-start"
                  >
                    <Field label={`Medicine ${idx + 1}*`}>
                      <input
                        className="ui-input"
                        value={m.name}
                        onChange={(e) =>
                          updateMed(m.id, { name: e.target.value })
                        }
                        placeholder="e.g., Paracetamol 500mg"
                      />
                    </Field>
                    <Field label="Route">
                      <select
                        className="ui-input"
                        value={m.route}
                        onChange={(e) =>
                          updateMed(m.id, {
                            route: e.target.value as Med["route"],
                          })
                        }
                      >
                        <option>PO</option>
                        <option>IV</option>
                        <option>IM</option>
                        <option>Topical</option>
                        <option>Inhale</option>
                        <option>SC</option>
                      </select>
                    </Field>
                    <Field label="Dose">
                      <input
                        className="ui-input"
                        value={m.dose}
                        onChange={(e) =>
                          updateMed(m.id, { dose: e.target.value })
                        }
                        placeholder="e.g., 500 mg"
                      />
                    </Field>
                    <Field label="Frequency">
                      <input
                        className="ui-input"
                        value={m.frequency}
                        onChange={(e) =>
                          updateMed(m.id, { frequency: e.target.value })
                        }
                        placeholder="e.g., 1-0-1"
                      />
                    </Field>
                    <Field label="Duration">
                      <input
                        className="ui-input"
                        value={m.duration}
                        onChange={(e) =>
                          updateMed(m.id, { duration: e.target.value })
                        }
                        placeholder="e.g., 5 days"
                      />
                    </Field>
                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => removeMed(m.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <Field className="md:col-span-6" label="Instructions">
                      <Textarea
                        value={m.instructions}
                        onChange={(e) =>
                          updateMed(m.id, { instructions: e.target.value })
                        }
                        placeholder="e.g., After food, increase fluids"
                      />
                    </Field>
                  </div>
                ))}
                <div>
                  <button className="btn-primary" onClick={() => addMed()}>
                    + Add Medicine
                  </button>
                </div>
              </div>
            </div>
          )}

          {active === "immunization" && (
            <div className="ui-card p-4">
              <HeaderRow
                title="Immunization Record"
                subtitle="Capture vaccine details"
              />
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Vaccine*">
                  <input
                    className="ui-input"
                    value={immVaccine}
                    onChange={(e) => setImmVaccine(e.target.value)}
                    placeholder="e.g., Tdap"
                  />
                </Field>
                <Field label="Batch">
                  <input
                    className="ui-input"
                    value={immBatch}
                    onChange={(e) => setImmBatch(e.target.value)}
                  />
                </Field>
                <Field label="Manufacturer">
                  <input
                    className="ui-input"
                    value={immManufacturer}
                    onChange={(e) => setImmManufacturer(e.target.value)}
                  />
                </Field>
                <Field label="Dose #">
                  <input
                    className="ui-input"
                    value={immDoseNum}
                    onChange={(e) => setImmDoseNum(e.target.value)}
                    placeholder="e.g., 1"
                  />
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    className="ui-input"
                    value={immDate}
                    onChange={(e) => setImmDate(e.target.value)}
                  />
                </Field>
                <Field label="Next Due">
                  <input
                    type="date"
                    className="ui-input"
                    value={immNextDue}
                    onChange={(e) => setImmNextDue(e.target.value)}
                  />
                </Field>
                <Field label="Site">
                  <input
                    className="ui-input"
                    value={immSite}
                    onChange={(e) => setImmSite(e.target.value)}
                    placeholder="e.g., Left deltoid"
                  />
                </Field>
                <Field label="Route">
                  <input
                    className="ui-input"
                    value={immRoute}
                    onChange={(e) => setImmRoute(e.target.value)}
                    placeholder="e.g., IM"
                  />
                </Field>
              </div>
            </div>
          )}

          {active === "lab" && (
            <div className="ui-card p-4">
              <HeaderRow
                title="Lab Record"
                subtitle="Add new lab test or results"
              />
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Test Name*">
                  <input
                    className="ui-input"
                    value={labTestName}
                    onChange={(e) => setLabTestName(e.target.value)}
                    placeholder="e.g., CBC"
                  />
                </Field>
                <Field label="Sample Date">
                  <input
                    type="date"
                    className="ui-input"
                    value={labSampleDate}
                    onChange={(e) => setLabSampleDate(e.target.value)}
                  />
                </Field>
                <Field label="Result">
                  <input
                    className="ui-input"
                    value={labResult}
                    onChange={(e) => setLabResult(e.target.value)}
                    placeholder="e.g., Within normal limits"
                  />
                </Field>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-outline">Attach PDF/Images</button>
                <button className="btn-outline">Browse Past Labs</button>
              </div>
            </div>
          )}

          {active === "wellness" && (
            <div className="ui-card p-4">
              <HeaderRow
                title="Wellness Record"
                subtitle="Vitals and lifestyle assessment"
              />
              <div className="grid md:grid-cols-4 gap-3">
                <Field label="BP Systolic (mmHg)">
                  <input
                    className="ui-input"
                    value={wlBpSys}
                    onChange={(e) => setWlBpSys(e.target.value)}
                  />
                </Field>
                <Field label="BP Diastolic (mmHg)">
                  <input
                    className="ui-input"
                    value={wlBpDia}
                    onChange={(e) => setWlBpDia(e.target.value)}
                  />
                </Field>
                <Field label="Pulse (bpm)">
                  <input
                    className="ui-input"
                    value={wlPulse}
                    onChange={(e) => setWlPulse(e.target.value)}
                  />
                </Field>
                <Field label="Temp (°C)">
                  <input
                    className="ui-input"
                    value={wlTemp}
                    onChange={(e) => setWlTemp(e.target.value)}
                  />
                </Field>
                <Field label="SpO₂ (%)">
                  <input
                    className="ui-input"
                    value={wlSpo2}
                    onChange={(e) => setWlSpo2(e.target.value)}
                  />
                </Field>
                <Field label="Height (cm)">
                  <input
                    className="ui-input"
                    value={wlHeight}
                    onChange={(e) => setWlHeight(e.target.value)}
                  />
                </Field>
                <Field label="Weight (kg)">
                  <input
                    className="ui-input"
                    value={wlWeight}
                    onChange={(e) => setWlWeight(e.target.value)}
                  />
                </Field>
                <Field label="BMI (auto)">
                  <input
                    className="ui-input"
                    value={bmi}
                    readOnly
                    placeholder="Auto"
                  />
                </Field>
                <Field className="md:col-span-4" label="Lifestyle Notes">
                  <Textarea
                    value={wlLifestyle}
                    onChange={(e) => setWlLifestyle(e.target.value)}
                    placeholder="Diet, exercise, sleep"
                  />
                </Field>
                <Field label="Follow-up">
                  <input
                    type="date"
                    className="ui-input"
                    value={wlFollowUp}
                    onChange={(e) => setWlFollowUp(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-4">
        <div className="ui-card p-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Patient:</span> {patient.name || "—"}
            <span className="mx-2">•</span>
            <span className="font-medium">Record:</span> {labelFor(active)}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" onClick={handleSaveDraft}>
              Save Draft (Ctrl+S)
            </button>
            <button className="btn-outline" onClick={handleValidate}>
              Validate & Preview
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              Submit & Share (Ctrl+Enter)
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} onClose={() => setToast(null)}>
          {toast.message}
        </Toast>
      )}
    </div>
  );

  // ------------------------- Local helpers & UI atoms ------------------------

  function updateMed(id: string, patch: Partial<Med>) {
    setMeds((curr) => curr.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function removeMed(id: string) {
    setMeds((curr) =>
      curr.length === 1 ? curr : curr.filter((m) => m.id !== id)
    );
  }
  function addMed() {
    setMeds((curr) => [
      ...curr,
      {
        id: uid(),
        name: "",
        route: "PO",
        dose: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  }
}

// Label mapper for buttons/toasts
function labelFor(key: RecordKey) {
  switch (key) {
    case "opconsult":
      return "OPConsult Record";
    case "prescription":
      return "Prescription";
    case "immunization":
      return "Immunization Record";
    case "lab":
      return "Lab Record";
    case "wellness":
      return "Wellness Record";
  }
}

// UID helper (no external libs)
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36).slice(2);
}

// Date helpers
function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Small read-only info cell
function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-medium">
        {value && value.trim() ? value : "—"}
      </div>
    </div>
  );
}

// Simple label+children wrapper (keeps markup consistent)
function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={["block", className].join(" ")}>
      <span className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className="ui-input min-h-[96px]"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

function HeaderRow({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="text-lg font-semibold">{title}</div>
      {subtitle && <div className="text-[11px] text-gray-500">{subtitle}</div>}
    </div>
  );
}

function Toast({
  type,
  children,
  onClose,
}: {
  type: "success" | "error" | "info";
  children: React.ReactNode;
  onClose: () => void;
}) {
  const color =
    type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#2563eb";
  useEffect(() => {
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div
        className="rounded-lg shadow-lg border bg-white px-4 py-3 text-sm"
        style={{ borderColor: color }}
      >
        <div className="flex items-start gap-2">
          <div className="mt-[2px]" style={{ color }}>
            {type === "success" ? "✔" : type === "error" ? "⚠" : "ℹ"}
          </div>
          <div className="text-gray-800">{children}</div>
          <button
            onClick={onClose}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
