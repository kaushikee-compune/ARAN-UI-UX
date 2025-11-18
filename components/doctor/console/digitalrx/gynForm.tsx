"use client";

import React from "react";
import { DigitalRxFormState } from "./defaultForm";

type Props = {
  value: DigitalRxFormState;
  onChange: (v: DigitalRxFormState) => void;
};

export default function GynForm({ value, onChange }: Props) {
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
      {/* 🩺 GYNECOLOGY — VITALS + MENSTRUAL DETAILS                        */}
      {/* ---------------------------------------------------------------- */}
      <section className="ui-card p-4">
        <h3 className="text-sm font-semibold mb-4">Gynecology — Menstrual Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className="ui-label">Last Menstrual Period (LMP)</label>
            <input
              type="date"
              className="ui-input"
              value={v.vitals.lmp || ""}
              onChange={(e) => update("lmp", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Cycle Regularity</label>
            <select
              className="ui-input"
              value={v.vitals.cycleRegularity || ""}
              onChange={(e) => update("cycleRegularity", e.target.value)}
            >
              <option value="">Select</option>
              <option value="Regular">Regular</option>
              <option value="Irregular">Irregular</option>
            </select>
          </div>

          <div>
            <label className="ui-label">Menstrual Flow</label>
            <select
              className="ui-input"
              value={v.vitals.flowType || ""}
              onChange={(e) => update("flowType", e.target.value)}
            >
              <option value="">Select</option>
              <option value="Light">Light</option>
              <option value="Normal">Normal</option>
              <option value="Heavy">Heavy</option>
            </select>
          </div>

          <div>
            <label className="ui-label">Dysmenorrhea (Painful Periods)</label>
            <select
              className="ui-input"
              value={v.vitals.dysmenorrhea || ""}
              onChange={(e) => update("dysmenorrhea", e.target.value)}
            >
              <option value="">Select</option>
              <option value="None">No</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
            </select>
          </div>

          <div>
            <label className="ui-label">Gravida (Pregnancies)</label>
            <input
              className="ui-input"
              type="number"
              value={v.vitals.gravida || ""}
              onChange={(e) => update("gravida", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Parity (Live Births)</label>
            <input
              className="ui-input"
              type="number"
              value={v.vitals.parity || ""}
              onChange={(e) => update("parity", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Abortions/Miscarriages</label>
            <input
              className="ui-input"
              type="number"
              value={v.vitals.abortionCount || ""}
              onChange={(e) => update("abortionCount", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 🤰 OBSTETRIC DETAILS                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="ui-card p-4">
        <h3 className="text-sm font-semibold mb-4">
          Pregnancy & Obstetric Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className="ui-label">Estimated Due Date (EDD)</label>
            <input
              type="date"
              className="ui-input"
              value={v.vitals.edd || ""}
              onChange={(e) => update("edd", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Trimester</label>
            <select
              className="ui-input"
              value={v.vitals.trimester || ""}
              onChange={(e) => update("trimester", e.target.value)}
            >
              <option value="">Select</option>
              <option value="First">First Trimester</option>
              <option value="Second">Second Trimester</option>
              <option value="Third">Third Trimester</option>
            </select>
          </div>

          <div>
            <label className="ui-label">Previous Pregnancy Complications</label>
            <textarea
              className="ui-input"
              value={v.vitals.prvComplications || ""}
              onChange={(e) => update("prvComplications", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Previous Delivery Mode</label>
            <select
              className="ui-input"
              value={v.vitals.prevDeliveryMode || ""}
              onChange={(e) => update("prevDeliveryMode", e.target.value)}
            >
              <option value="">Select</option>
              <option value="Normal">Normal</option>
              <option value="C-section">C-section</option>
              <option value="Instrumental">Instrumental</option>
            </select>
          </div>

          <div>
            <label className="ui-label">Fetal Movements</label>
            <input
              type="text"
              className="ui-input"
              placeholder="Normal / Decreased"
              value={v.vitals.fetalMovements || ""}
              onChange={(e) => update("fetalMovements", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Fetal Heart Rate (FHR)</label>
            <input
              className="ui-input"
              type="number"
              placeholder="bpm"
              value={v.vitals.fhr || ""}
              onChange={(e) => update("fhr", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Antenatal Ultrasound Details</label>
            <textarea
              className="ui-input"
              value={v.vitals.usgDetails || ""}
              onChange={(e) => update("usgDetails", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Blood Group & Rh</label>
            <input
              className="ui-input"
              value={v.vitals.bloodGroupRh || ""}
              onChange={(e) => update("bloodGroupRh", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Gestational Diabetes Screening</label>
            <input
              className="ui-input"
              placeholder="GTT / OGTT results"
              value={v.vitals.gdmScreen || ""}
              onChange={(e) => update("gdmScreen", e.target.value)}
            />
          </div>

          <div>
            <label className="ui-label">Prenatal Supplements Prescribed</label>
            <textarea
              className="ui-input"
              value={v.vitals.prenatalSupplements || ""}
              onChange={(e) => update("prenatalSupplements", e.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
