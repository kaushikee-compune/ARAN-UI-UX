"use client";

import React from "react";
import { DigitalRxFormState } from "../digitalrx/defaultForm";

type Props = {
  value: DigitalRxFormState;
  onChange: (v: DigitalRxFormState) => void;
};

export default function GenForm({ value, onChange }: Props) {
  const v = value;

  const update = (field: string, newValue: any) => {
    onChange({
      ...value,
      vitals: { 
        ...(value.vitals || {}), 
        [field]: newValue 
      },
    });
  };

  return (
    <div className="space-y-6">

      {/* ---------------------------------------------------------------- */}
      {/* 🩺 GENERAL HEALTH PARAMETERS                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="ui-card p-4">
        <h3 className="text-sm font-semibold mb-4">General Health Parameters</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className="ui-label">Temperature</label>
            <input
              className="ui-input"
              placeholder="°C / °F"
              value={v.vitals.temperature || ""}
              onChange={(e) => update("temperature", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Blood Pressure (BP)</label>
            <input
              className="ui-input"
              placeholder="120/80"
              value={v.vitals.bp || ""}
              onChange={(e) => update("bp", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Heart Rate (Pulse)</label>
            <input
              className="ui-input"
              placeholder="bpm"
              value={v.vitals.pulse || ""}
              onChange={(e) => update("pulse", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Respiratory Rate</label>
            <input
              className="ui-input"
              placeholder="breaths/min"
              value={v.vitals.respiratoryRate || ""}
              onChange={(e) => update("respiratoryRate", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">SpO₂</label>
            <input
              className="ui-input"
              placeholder="%"
              value={v.vitals.spo2 || ""}
              onChange={(e) => update("spo2", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Height (cm)</label>
            <input
              className="ui-input"
              value={v.vitals.height || ""}
              onChange={(e) => update("height", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Weight (kg)</label>
            <input
              className="ui-input"
              value={v.vitals.weight || ""}
              onChange={(e) => update("weight", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">BMI</label>
            <input
              className="ui-input"
              value={v.vitals.bmi || ""}
              onChange={(e) => update("bmi", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Allergies</label>
            <textarea
              className="ui-input"
              value={v.vitals.allergies || ""}
              onChange={(e) => update("allergies", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Chronic Diseases</label>
            <textarea
              className="ui-input"
              placeholder="Diabetes, Hypertension, etc."
              value={v.vitals.chronicDiseases || ""}
              onChange={(e) => update("chronicDiseases", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Past Medical History</label>
            <textarea
              className="ui-input"
              value={v.vitals.medicalHistory || ""}
              onChange={(e) => update("medicalHistory", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Current Medications</label>
            <textarea
              className="ui-input"
              value={v.vitals.currentMedicines || ""}
              onChange={(e) => update("currentMedicines", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Family Medical History</label>
            <textarea
              className="ui-input"
              value={v.vitals.familyHistory || ""}
              onChange={(e) => update("familyHistory", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Lifestyle Factors</label>
            <textarea
              className="ui-input"
              placeholder="Smoking, Alcohol, Exercise, Diet"
              value={v.vitals.lifestyle || ""}
              onChange={(e) => update("lifestyle", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Pain Scale (0–10)</label>
            <input
              className="ui-input"
              type="number"
              min={0}
              max={10}
              value={v.vitals.painScale || ""}
              onChange={(e) => update("painScale", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 🦠 INFECTION SCREENING                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="ui-card p-4">
        <h3 className="text-sm font-semibold mb-4">Infection Screening</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className="ui-label">Recent Fever Episodes</label>
            <select
              className="ui-input"
              value={v.vitals.recentFever || ""}
              onChange={(e) => update("recentFever", e.target.value)}
            >
              <option value="">Select</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label className="ui-label">Respiratory Issues</label>
            <textarea
              className="ui-input"
              placeholder="SOB, Chest Pain, etc."
              value={v.vitals.respIssues || ""}
              onChange={(e) => update("respIssues", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Gastrointestinal Symptoms</label>
            <textarea
              className="ui-input"
              placeholder="Nausea, Vomiting, Diarrhea"
              value={v.vitals.giSymptoms || ""}
              onChange={(e) => update("giSymptoms", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Urinary Symptoms</label>
            <textarea
              className="ui-input"
              placeholder="Burning, Frequency"
              value={v.vitals.urinarySymptoms || ""}
              onChange={(e) => update("urinarySymptoms", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Skin Rashes / Lumps</label>
            <textarea
              className="ui-input"
              value={v.vitals.skinIssues || ""}
              onChange={(e) => update("skinIssues", e.target.value)}
            />
          </div>
        </div>
      </section>

    </div>
  );
}
