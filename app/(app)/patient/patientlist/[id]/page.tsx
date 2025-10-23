"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Upload,
  MessageSquare,
  Phone,
  CreditCard,
  FileSignature,
  Pencil,
  CheckCircle,
} from "lucide-react";
import OtpPopup from "@/components/common/OtpPopup";

/* -------------------------------------------------------------------------- */
/*                            Mock Patient Details                            */
/* -------------------------------------------------------------------------- */
const MOCK_PATIENT = {
  patientId: "pat_001",
  name: "Shampa Goswami",
  gender: "Female",
  age: "52 yrs",
  dob: "1973-01-20",
  mobile: "9972826000",
  email: "shampa@mail.com",
  abhaNumber: "91-5510-2061-4469",
  abhaAddress: "shampa.go@sbx",
  address: "123, Park Street, Kolkata",
  emergencyContact: "R. Goswami • +91-9876543210",
  allergy: "Penicillin",
  chronicIssues: "Diabetes, Hypertension",
  pastProcedures: "Hysterectomy (2015)",
  insurancePolicy: "Star Health Family Floater",
  insuranceNumber: "POL1234567",
};

/* -------------------------------------------------------------------------- */
/*                                  Page                                      */
/* -------------------------------------------------------------------------- */
export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [editing, setEditing] = useState<
    null | "personal" | "address" | "health" | "insurance"
  >(null);
  const [formData, setFormData] = useState({ ...MOCK_PATIENT });
  const [showPastRecords, setShowPastRecords] = useState(false);

  /* ---------------- OTP State ---------------- */
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpType, setOtpType] = useState<"email" | "mobile">("mobile");
  const [otpTarget, setOtpTarget] = useState("");
  const [verified, setVerified] = useState<{ email: boolean; mobile: boolean }>(
    {
      email: false,
      mobile: false,
    }
  );

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Reset verification if mobile or email changes
      if (field === "mobile" && value !== MOCK_PATIENT.mobile) {
        setVerified((v) => ({ ...v, mobile: false }));
      }
      if (field === "email" && value !== MOCK_PATIENT.email) {
        setVerified((v) => ({ ...v, email: false }));
      }
      return next;
    });
  };

  const handleSave = () => {
    // Block save if contact fields changed but not verified
    if (formData.mobile !== MOCK_PATIENT.mobile && !verified.mobile) {
      alert("Please verify the new mobile number before saving.");
      return;
    }
    if (formData.email !== MOCK_PATIENT.email && !verified.email) {
      alert("Please verify the new email before saving.");
      return;
    }

    Object.assign(MOCK_PATIENT, formData);
    setEditing(null);
  };

  const handleCancel = () => {
    setFormData({ ...MOCK_PATIENT });
    setEditing(null);
  };

  /* ---------------- OTP Handling ---------------- */
  const handleSendOtp = (type: "email" | "mobile") => {
    if (type === "email") {
      if (!formData.email || !formData.email.includes("@")) {
        alert("Please enter a valid email address");
        return;
      }
      setOtpTarget(formData.email);
    } else {
      if (!/^[0-9]{10}$/.test(formData.mobile)) {
        alert("Please enter a valid 10-digit mobile number");
        return;
      }
      setOtpTarget(formData.mobile);
    }
    setOtpType(type);
    setOtpOpen(true);
  };

  const handleVerifyOtp = (otp: string) => {
    if (otp === "123456") {
      setVerified((v) => ({ ...v, [otpType]: true }));
      setOtpOpen(false);
      alert(
        otpType === "email"
          ? "Email verified successfully!"
          : "Mobile verified successfully!"
      );
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* -------------------------- Header Row -------------------------- */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
            <img
              src="/icons/avatar-placeholder.png"
              alt="Patient"
              className="w-full h-full object-cover"
            />
            <button
              className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow"
              title="Change photo"
            >
              <Pencil size={12} className="text-gray-600" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold">{formData.name}</h2>
            <div className="text-sm text-gray-700">
              {formData.gender} • {formData.age}
            </div>
            <div className="text-xs text-gray-500">
              ABHA No: {formData.abhaNumber}
            </div>
            <div className="text-xs text-gray-500">
              ABHA Address: {formData.abhaAddress}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPastRecords((s) => !s)}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
          >
            {showPastRecords ? "Hide Past Records" : "View Past Records"}
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm border border-green-600 text-green-700 rounded-md hover:bg-green-50"
          >
            Publish
          </button>
        </div>
      </header>

      {/* -------------------------- Action Bar -------------------------- */}
      {!showPastRecords && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <ActionBtn label="Upload" icon={<Upload size={14} />} color="gray" />
          <ActionBtn
            label="Chat"
            icon={<MessageSquare size={14} />}
            color="sky"
          />
          <ActionBtn label="Call" icon={<Phone size={14} />} color="pink" />
          <ActionBtn
            label="Payment"
            icon={<CreditCard size={14} />}
            color="amber"
          />
          <ActionBtn
            label="Consent"
            icon={<FileSignature size={14} />}
            color="purple"
          />
        </div>
      )}

      {/* ------------------- Past Records or Editable Layout ------------- */}
      {showPastRecords ? (
        <PastRecordsPanel patientId={MOCK_PATIENT.patientId} />
      ) : (
        <div className="space-y-6">
          {/* -------------------- Personal -------------------- */}
          <InlineSection
            title="Personal Demographics"
            sectionKey="personal"
            editing={editing}
            setEditing={setEditing}
          >
            {editing === "personal" ? (
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <Input
                  value={formData.name}
                  onChange={(v: string) => handleChange("name", v)}
                  placeholder="Name"
                />
                <Input
                  value={formData.dob}
                  onChange={(v: string) => handleChange("dob", v)}
                  placeholder="DOB"
                  type="date"
                />
                <Input
                  value={formData.gender}
                  onChange={(v: string) => handleChange("gender", v)}
                  placeholder="Gender"
                />
                <Input
                  value={formData.age}
                  onChange={(v: string) => handleChange("age", v)}
                  placeholder="Age"
                />
                <div className="flex gap-2 pt-2">
                  <SaveCancel onSave={handleSave} onCancel={handleCancel} />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <KV k="Name" v={formData.name} />
                <KV k="DOB" v={formData.dob} />
                <KV k="Gender" v={formData.gender} />
                <KV k="Age" v={formData.age} />
              </div>
            )}
          </InlineSection>

          {/* -------------------- Address & Contact -------------------- */}
          <InlineSection
            title="Address & Contact"
            sectionKey="address"
            editing={editing}
            setEditing={setEditing}
          >
            {editing === "address" ? (
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <Input
                  value={formData.address}
                  onChange={(v: string) => handleChange("address", v)}
                  placeholder="Address"
                />
                {/* Email field with OTP */}
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.email}
                    onChange={(v: string) => handleChange("email", v)}
                    placeholder="Email"
                    type="email"
                  />
                  {verified.email ? (
                    <VerifiedTag />
                  ) : (
                    <button
                      onClick={() => handleSendOtp("email")}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Send OTP
                    </button>
                  )}
                </div>
                {/* Mobile field with OTP */}
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.mobile}
                    onChange={(v: string) => handleChange("mobile", v)}
                    placeholder="Mobile Number"
                    numeric
                    maxLength={10}
                  />

                  {verified.mobile ? (
                    <VerifiedTag />
                  ) : (
                    <button
                      onClick={() => handleSendOtp("mobile")}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Send OTP
                    </button>
                  )}
                </div>
                <Input
                  value={formData.emergencyContact}
                  onChange={(v: string) => handleChange("emergencyContact", v)}
                  placeholder="Emergency Contact"
                />
                <div className="flex gap-2 pt-2">
                  <SaveCancel onSave={handleSave} onCancel={handleCancel} />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <KV k="Address" v={formData.address} />
                <KV k="Email" v={formData.email} />
                <KV k="Mobile" v={formData.mobile} />
                <KV k="Emergency Contact" v={formData.emergencyContact} />
              </div>
            )}
          </InlineSection>

          {/* -------------------- Health Info -------------------- */}
          <InlineSection
            title="Health Information"
            sectionKey="health"
            editing={editing}
            setEditing={setEditing}
          >
            {editing === "health" ? (
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <Input
                  value={formData.allergy}
                  onChange={(v: string) => handleChange("allergy", v)}
                  placeholder="Allergy"
                />
                <Input
                  value={formData.chronicIssues}
                  onChange={(v: string) => handleChange("chronicIssues", v)}
                  placeholder="Chronic Health Issues"
                />
                <Input
                  value={formData.pastProcedures}
                  onChange={(v: string) => handleChange("pastProcedures", v)}
                  placeholder="Past Procedures"
                />
                <div className="flex gap-2 pt-2">
                  <SaveCancel onSave={handleSave} onCancel={handleCancel} />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <KV k="Allergy" v={formData.allergy} />
                <KV k="Chronic Health Issues" v={formData.chronicIssues} />
                <KV k="Past Procedures" v={formData.pastProcedures} />
              </div>
            )}
          </InlineSection>

          {/* -------------------- Insurance -------------------- */}
          <InlineSection
            title="Insurance Details"
            sectionKey="insurance"
            editing={editing}
            setEditing={setEditing}
          >
            {editing === "insurance" ? (
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <Input
                  value={formData.insurancePolicy}
                  onChange={(v: string) => handleChange("insurancePolicy", v)}
                  placeholder="Policy Name"
                />
                <Input
                  value={formData.insuranceNumber}
                  onChange={(v: string) => handleChange("insuranceNumber", v)}
                  placeholder="Policy Number"
                />
                <div className="flex gap-2 pt-2">
                  <SaveCancel onSave={handleSave} onCancel={handleCancel} />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <KV k="Policy" v={formData.insurancePolicy} />
                <KV k="Policy Number" v={formData.insuranceNumber} />
              </div>
            )}
          </InlineSection>
        </div>
      )}

      {/* -------------------- OTP Popup -------------------- */}
      <OtpPopup
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        onVerify={handleVerifyOtp}
        contact={otpTarget}
        type={otpType}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper small components (unchanged except for typing fixes)                */
/* -------------------------------------------------------------------------- */
function InlineSection({
  title,
  sectionKey,
  editing,
  setEditing,
  children,
}: {
  title: string;
  sectionKey: "personal" | "address" | "health" | "insurance";
  editing: string | null;
  setEditing: (s: any) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gray-100 pt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs uppercase tracking-wide text-gray-500">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => setEditing(editing === sectionKey ? null : sectionKey)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Pencil size={14} />
        </button>
      </div>
      {children}
    </section>
  );
}

// function Input({
//   value,
//   onChange,
//   placeholder,
//   type = "text",
// }: {
//   value: string;
//   onChange: (v: string) => void;
//   placeholder: string;
//   type?: string;
// }) {
//   return (
//     <input
//       className="w-full border-b border-gray-300 focus:border-gray-600 focus:outline-none px-1 py-1 text-sm bg-transparent"
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       placeholder={placeholder}
//       type={type}
//     />
//   );
// }
function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  numeric = false,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  numeric?: boolean;
  maxLength?: number;
}) {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (numeric) {
      v = v.replace(/\D/g, ""); // strip non-digits
      if (maxLength) v = v.slice(0, maxLength);
    }
    onChange(v);
  };

  return (
    <input
      className="w-full border-b border-gray-300 focus:border-gray-600 focus:outline-none px-1 py-1 text-sm bg-transparent"
      value={value}
      onChange={handleInput}
      placeholder={placeholder}
      type={numeric ? "tel" : type}
      maxLength={maxLength}
    />
  );
}

function SaveCancel({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <button
        onClick={onSave}
        className="px-3 py-1 text-sm bg-green-600 text-white rounded"
      >
        Save
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1 text-sm bg-gray-200 rounded"
      >
        Cancel
      </button>
    </>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="text-gray-500">{k}: </span>
      <span className="text-gray-800">{v || "—"}</span>
    </div>
  );
}

function VerifiedTag() {
  return (
    <span className="inline-flex items-center text-green-700 text-xs">
      <CheckCircle size={12} className="mr-1" /> Verified
    </span>
  );
}

function ActionBtn({
  label,
  icon,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  color: "gray" | "sky" | "pink" | "amber" | "purple";
}) {
  const colors: Record<string, string> = {
    gray: "bg-gray-200 text-gray-800",
    sky: "bg-sky-200 text-sky-800",
    pink: "bg-pink-200 text-pink-800",
    amber: "bg-amber-200 text-amber-800",
    purple: "bg-purple-200 text-purple-800",
  };
  return (
    <button
      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${colors[color]}`}
    >
      {icon} {label}
    </button>
  );
}

/* -------------------- PastRecordsPanel (unchanged) -------------------- */
type CanonicalRecord = {
  id: string;
  patientId: string;
  dateISO: string;
  type: "Prescription" | "Vitals" | "Immunization" | "Lab" | "DischargeSummary";
  source: "digital-rx";
  canonical: any;
};
async function loadMockRecords(patientId?: string): Promise<CanonicalRecord[]> {
  if (typeof window === "undefined") return [];
  const res = await fetch("/data/mock-records.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Mock JSON not found");
  const all = (await res.json()) as CanonicalRecord[];
  return patientId ? all.filter((r) => r.patientId === patientId) : all;
}
function nonEmpty(v: any) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}
const safe = (v: any) => (nonEmpty(v) ? String(v) : "—");

export function PastRecordsPanel({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState<CanonicalRecord[]>([]);
  useEffect(() => {
    loadMockRecords(patientId)
      .then(setRecords)
      .catch((err) => console.error(err));
  }, [patientId]);

  if (!records.length)
    return (
      <div className="text-center text-sm text-gray-500 py-10">
        No past records found
      </div>
    );

  const grouped: Record<string, CanonicalRecord[]> = {};
  for (const r of records) {
    if (!grouped[r.dateISO]) grouped[r.dateISO] = [];
    grouped[r.dateISO].push(r);
  }
  const dates = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div className="space-y-8">
      {dates.map((date) => (
        <div key={date} className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 border-b pb-1">
            Records • {date}
          </h2>
          {grouped[date].map((rec) => (
            <RecordBlock key={rec.id} record={rec} />
          ))}
        </div>
      ))}
    </div>
  );
}
function RecordBlock({ record }: { record: CanonicalRecord }) {
  const payload = record.canonical || {};
  const {
    vitals = {},
    chiefComplaints = "",
    allergies = "",
    medicalHistory = "",
    investigationAdvice = "",
    procedure = "",
    followUpText = "",
    followUpDate = "",
    medications = [],
    uploads = { files: [], note: "" },
  } = payload;

  const showVitals =
    nonEmpty(vitals.temperature) ||
    nonEmpty(vitals.bp) ||
    (nonEmpty(vitals.bpSys) && nonEmpty(vitals.bpDia)) ||
    nonEmpty(vitals.spo2) ||
    nonEmpty(vitals.pulse);

  const showClinical =
    nonEmpty(chiefComplaints) ||
    nonEmpty(allergies) ||
    nonEmpty(medicalHistory) ||
    nonEmpty(investigationAdvice) ||
    nonEmpty(procedure);

  const showRx = medications.length > 0;

  return (
    <div className="space-y-4">
      {showVitals && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Vitals</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {nonEmpty(vitals.temperature) && (
              <KV k="Temperature" v={`${safe(vitals.temperature)} °C`} />
            )}
            {(nonEmpty(vitals.bp) ||
              (nonEmpty(vitals.bpSys) && nonEmpty(vitals.bpDia))) && (
              <KV
                k="Blood Pressure"
                v={
                  nonEmpty(vitals.bp)
                    ? `${safe(vitals.bp)} mmHg`
                    : `${safe(vitals.bpSys)}/${safe(vitals.bpDia)} mmHg`
                }
              />
            )}
            {nonEmpty(vitals.spo2) && (
              <KV k="SpO₂" v={`${safe(vitals.spo2)} %`} />
            )}
            {nonEmpty(vitals.pulse) && (
              <KV k="Pulse" v={`${safe(vitals.pulse)} bpm`} />
            )}
          </div>
        </section>
      )}
      {showClinical && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Clinical Summary</h3>
          <div className="space-y-2 text-sm">
            {nonEmpty(chiefComplaints) && (
              <Block k="Chief Complaints" v={safe(chiefComplaints)} />
            )}
            {nonEmpty(allergies) && <Block k="Allergies" v={safe(allergies)} />}
            {nonEmpty(medicalHistory) && (
              <Block k="Medical History" v={safe(medicalHistory)} />
            )}
            {nonEmpty(investigationAdvice) && (
              <Block k="Investigation Advice" v={safe(investigationAdvice)} />
            )}
            {nonEmpty(procedure) && <Block k="Procedure" v={safe(procedure)} />}
          </div>
        </section>
      )}
      {showRx && (
        <section className="ui-card p-4">
          <h3 className="text-sm font-semibold mb-3">Medications</h3>
          <div className="overflow-auto rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-2 py-1.5 text-left font-medium">
                    Medicine
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Frequency
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Duration
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">Dosage</th>
                  <th className="px-2 py-1.5 text-left font-medium">
                    Instructions
                  </th>
                </tr>
              </thead>
              <tbody>
                {medications.map((m: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1.5 font-medium">
                      {safe(m.medicine)}
                    </td>
                    <td className="px-2 py-1.5">{safe(m.frequency)}</td>
                    <td className="px-2 py-1.5">{safe(m.duration)}</td>
                    <td className="px-2 py-1.5">{safe(m.dosage)}</td>
                    <td className="px-2 py-1.5">{safe(m.instruction)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="ui-card p-4">
        <h3 className="text-sm font-semibold mb-3">Follow-Up & Advice</h3>
        <div className="space-y-3 text-sm">
          {nonEmpty(followUpText) && (
            <Block k="Doctor’s Note / Advice" v={safe(followUpText)} />
          )}
          {nonEmpty(followUpDate) && (
            <KV k="Next Follow-Up Date" v={safe(followUpDate)} />
          )}
          {(uploads?.files?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">
                Attachments
              </h4>
              <ul className="list-disc ml-5 space-y-1">
                {(uploads?.files ?? []).map((f: any, i: number) => (
                  <li key={i}>{f.name ?? "File"}</li>
                ))}
              </ul>
            </div>
          )}
          {nonEmpty(uploads?.note) && (
            <Block k="Attachment Note" v={safe(uploads?.note)} />
          )}
        </div>
      </section>
    </div>
  );
}
function Block({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="font-medium text-gray-700">{k}: </span>
      <span className="text-gray-800">{v}</span>
    </div>
  );
}
