"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Pencil,
  Upload,
  MessageSquare,
  Phone,
  CreditCard,
  FileSignature,
} from "lucide-react";
import PatientPastHealthRecord from "@/components/healthrecords/patientpasthealthrecord";

/* -------------------- Mock Patient -------------------- */
const MOCK_PATIENT = {
  patientId: "pat_001",
  name: "Shampa Goswami",
  mobile: "9972826000",
  dob: "1973-01-20",
  age: "52 yrs",
  gender: "Female",
  abhaNumber: "91-5510-2061-4469",
  abhaAddress: "shampa.go@sbx",
  address: "123, Park Street, Kolkata",
  emergencyContact: "R. Goswami • +91-9876543210",
  bloodGroup: "O+",
  allergy: "Penicillin",
  ailment: "Diabetes, Hypertension",
  medications: "Metformin, Amlodipine",
  insurancePolicy: "Star Health Family Floater",
  insuranceNumber: "POL1234567",
};

/* -------------------- Page -------------------- */
export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const patient = MOCK_PATIENT; // mock only; replace when wiring backend

  // which section is in edit mode
  const [editing, setEditing] = useState<null | "personal" | "address" | "health" | "insurance">(null);
  // form buffer (so Cancel can revert)
  const [formData, setFormData] = useState({ ...patient });
  const [showPastRecords, setShowPastRecords] = useState(false);

  // generic field change
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // commit current buffer only for the section being saved (here we just copy all; adapt to call API)
  const handleSave = () => {
    // in a real app you’d PATCH here then sync local state from server
    Object.assign(patient, formData);
    setEditing(null);
  };

  const handleCancel = () => {
    setFormData({ ...patient }); // discard changes
    setEditing(null);
  };

  // small helper
  const Input = ({
    value,
    onChange,
    placeholder,
    type = "text",
  }: {
    value: string | undefined;
    onChange: (v: string) => void;
    placeholder: string;
    type?: string;
  }) => (
    <input
      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
    />
  );

  const Section = ({
    title,
    sectionKey,
    children,
  }: {
    title: string;
    sectionKey: "personal" | "address" | "health" | "insurance";
    children: React.ReactNode;
  }) => (
    <div className="bg-white shadow rounded-lg border border-gray-300">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b">
        <h3 className="font-medium">{title}</h3>
        <button
          className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          disabled={showPastRecords}
          onClick={() => setEditing(editing === sectionKey ? null : sectionKey)}
          aria-label="Edit section"
          type="button"
        >
          <Pencil size={16} />
        </button>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {patient.name} <span className="text-gray-500 text-sm">({id})</span>
        </h2>
        <button
          className="px-3 py-1.5 rounded-md bg-[#66ad45] text-white text-sm"
          onClick={() => {
            setShowPastRecords((s) => !s);
            setEditing(null); // ensure edit forms close when switching view
          }}
          type="button"
        >
          {showPastRecords ? "Hide Health Records" : "View Past Records"}
        </button>
      </div>

      {/* Past Records OR Demography */}
      {showPastRecords ? (
        <PatientPastHealthRecord
          patientId={patient.patientId}
          patient={{
            patientId: patient.patientId,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            phone: patient.mobile,
            abhaNumber: patient.abhaNumber,
            abhaAddress: patient.abhaAddress,
          }}
          clinic={{
            doctorName: "Dr. A. Banerjee",
            specialty: "Internal Medicine",
            regNo: "KMC/2011/12345",
            clinicName: "Sushila Mathrutva Clinic",
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Section 1 - Personal Info */}
          <Section title="Personal Info" sectionKey="personal">
            {editing === "personal" ? (
              <div className="space-y-2 text-sm">
                <Input
                  value={formData.name}
                  onChange={(v) => handleChange("name", v)}
                  placeholder="Name"
                />
                <Input
                  value={formData.mobile}
                  onChange={(v) => handleChange("mobile", v)}
                  placeholder="Phone"
                />
                <Input
                  value={formData.dob}
                  onChange={(v) => handleChange("dob", v)}
                  placeholder="DOB (YYYY-MM-DD)"
                  type="date"
                />
                <Input
                  value={formData.age}
                  onChange={(v) => handleChange("age", v)}
                  placeholder="Age"
                />
                <Input
                  value={formData.gender}
                  onChange={(v) => handleChange("gender", v)}
                  placeholder="Gender"
                />
                <Input
                  value={formData.abhaAddress}
                  onChange={(v) => handleChange("abhaAddress", v)}
                  placeholder="ABHA Address"
                />
                <Input
                  value={formData.abhaNumber}
                  onChange={(v) => handleChange("abhaNumber", v)}
                  placeholder="ABHA Number"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                    onClick={handleSave}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 text-sm bg-gray-200 rounded"
                    onClick={handleCancel}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-1 text-sm">
                <div>
                  <b>Mobile:</b> {patient.mobile}
                </div>
                <div>
                  <b>DOB:</b> {patient.dob}
                </div>
                <div>
                  <b>Age:</b> {patient.age}
                </div>
                <div>
                  <b>Gender:</b> {patient.gender}
                </div>
                <div>
                  <b>ABHA No:</b> {patient.abhaNumber}
                </div>
                <div>
                  <b>ABHA Address:</b> {patient.abhaAddress}
                </div>
              </div>
            )}
          </Section>

          {/* Section 2 - Address */}
          <Section title="Address" sectionKey="address">
            {editing === "address" ? (
              <div className="space-y-2 text-sm">
                <Input
                  value={formData.address}
                  onChange={(v) => handleChange("address", v)}
                  placeholder="Address"
                />
                <Input
                  value={formData.emergencyContact}
                  onChange={(v) => handleChange("emergencyContact", v)}
                  placeholder="Emergency Contact"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                    onClick={handleSave}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 text-sm bg-gray-200 rounded"
                    onClick={handleCancel}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-1 text-sm">
                <div>
                  <b>Address:</b> {patient.address}
                </div>
                <div>
                  <b>Emergency Contact:</b> {patient.emergencyContact}
                </div>
              </div>
            )}
          </Section>

          {/* Section 3 - Health */}
          <Section title="Health" sectionKey="health">
            {editing === "health" ? (
              <div className="space-y-2 text-sm">
                <Input
                  value={formData.bloodGroup}
                  onChange={(v) => handleChange("bloodGroup", v)}
                  placeholder="Blood Group"
                />
                <Input
                  value={formData.allergy}
                  onChange={(v) => handleChange("allergy", v)}
                  placeholder="Allergy"
                />
                <Input
                  value={formData.ailment}
                  onChange={(v) => handleChange("ailment", v)}
                  placeholder="Ailments"
                />
                <Input
                  value={formData.medications}
                  onChange={(v) => handleChange("medications", v)}
                  placeholder="Medications"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                    onClick={handleSave}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 text-sm bg-gray-200 rounded"
                    onClick={handleCancel}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-1 text-sm">
                <div>
                  <b>Blood Group:</b> {patient.bloodGroup}
                </div>
                <div>
                  <b>Allergy:</b> {patient.allergy}
                </div>
                <div>
                  <b>Ailments:</b> {patient.ailment}
                </div>
                <div>
                  <b>Medications:</b> {patient.medications}
                </div>
              </div>
            )}
          </Section>

          {/* Section 4 - Insurance */}
          <Section title="Insurance" sectionKey="insurance">
            {editing === "insurance" ? (
              <div className="space-y-2 text-sm">
                <Input
                  value={formData.insurancePolicy}
                  onChange={(v) => handleChange("insurancePolicy", v)}
                  placeholder="Policy"
                />
                <Input
                  value={formData.insuranceNumber}
                  onChange={(v) => handleChange("insuranceNumber", v)}
                  placeholder="Insurance Number"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                    onClick={handleSave}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 text-sm bg-gray-200 rounded"
                    onClick={handleCancel}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-1 text-sm">
                <div>
                  <b>Policy:</b> {patient.insurancePolicy}
                </div>
                <div>
                  <b>Number:</b> {patient.insuranceNumber}
                </div>
              </div>
            )}
          </Section>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-400 text-sm" type="button">
          <Upload size={14} /> Upload
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-sky-300 text-sm" type="button">
          <MessageSquare size={14} /> Chat
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-pink-300 text-sm" type="button">
          <Phone size={14} /> Call
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-300 text-sm" type="button">
          <CreditCard size={14} /> Payment
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-purple-300 text-sm" type="button">
          <FileSignature size={14} /> Consent
        </button>
      </div>
    </div>
  );
}
