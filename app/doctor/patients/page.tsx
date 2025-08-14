"use client";

/**
 * ARAN • Doctor → Patients (Consultation v2 Panel)
 * - NO auto-collapse on mount
 * - Sidebar toggle button in header (top-right)
 * - Three-pane: OPD Queue | Editor | Live Preview
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";

// ----------------------------- Types -----------------------------
type QueueItem = {
  id: string;
  ticket: string;
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other";
  reason: string;
  scheduledAt: string;
};

type Medication = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  notes: string;
};

type PatientContext = {
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other" | "";
  abhaNumber?: string;
  abhaAddress?: string;
};

// --------------------------- Page Component ---------------------------
export default function PatientsConsultationV2Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sidebar toggle (sync with localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem("aran:sidebarCollapsed") === "1");
    } catch {}
  }, []);
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem("aran:sidebarCollapsed", next ? "1" : "0");
      window.dispatchEvent(new Event("aran:sidebar"));
    } catch {}
  };

  // Patient context (frozen header data)
  const [patient] = useState<PatientContext>({
    name: "Ms Shampa Goswami",
    age: "52 yrs",
    gender: "Female",
    abhaNumber: "91-5510-2061-4469",
    abhaAddress: "shampa.go@sbx",
  });

  // OPD queue panel state
  const [queueOpen, setQueueOpen] = useState(true);
  const queue = useMemo<QueueItem[]>(
    () => [
      {
        id: uid(),
        ticket: "Q-1021",
        name: "Ms Shampa Goswami",
        age: "52",
        gender: "Female",
        reason: "Fever & Cough",
        scheduledAt: isoWithHM(0, 0),
      },
      {
        id: uid(),
        ticket: "Q-1022",
        name: "Mr Ritesh Mehta",
        age: "38",
        gender: "Male",
        reason: "Back pain",
        scheduledAt: isoWithHM(0, 30),
      },
      {
        id: uid(),
        ticket: "Q-1023",
        name: "Baby Anvi",
        age: "3",
        gender: "Female",
        reason: "Immunization",
        scheduledAt: isoWithHM(1, 0),
      },
    ],
    []
  );

  // Consultation editor state (v2)
  const [chiefComplaints, setChiefComplaints] = useState("");
  const [examination, setExamination] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [advice, setAdvice] = useState("");

  // Dynamic prescriptions
  const [meds, setMeds] = useState<Medication[]>([
    { id: uid(), name: "", dose: "", frequency: "", duration: "", route: "", notes: "" },
  ]);

  // Local toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Keyboard shortcuts
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------- Actions --------------------------
  const handleSaveDraft = useCallback(() => {
    setToast({ type: "info", message: "Draft saved for Consultation (v2)." });
  }, []);

  const validate = useCallback(() => {
    if (!patient.name.trim()) {
      setToast({ type: "error", message: "Select a patient before proceeding." });
      return false;
    }
    if (!chiefComplaints.trim()) {
      setToast({ type: "error", message: "Chief Complaints are required." });
      return false;
    }
    if (meds.some((m) => hasAnyValue(m) && !m.name.trim())) {
      setToast({ type: "error", message: "Provide medicine name for filled rows." });
      return false;
    }
    return true;
  }, [patient.name, chiefComplaints, meds]);

  const handleValidate = useCallback(() => {
    if (!validate()) return;
    setToast({ type: "success", message: "Validation passed." });
  }, [validate]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    const payload = {
      patient,
      consultation: { chiefComplaints, examination, diagnosis, plan, advice },
      prescriptions: meds.filter((m) => m.name.trim()),
      submittedAt: new Date().toISOString(),
    };
    console.log("Submit payload (v2)", payload);
    setToast({ type: "success", message: "Consultation (v2) submitted." });
  }, [validate, patient, chiefComplaints, examination, diagnosis, plan, advice, meds]);

  const assignFromQueue = (q: QueueItem) =>
    setToast({ type: "info", message: `Loaded ${q.ticket} • ${q.name} into editor.` });

  const addMed = () =>
    setMeds((curr) => [...curr, { id: uid(), name: "", dose: "", frequency: "", duration: "", route: "", notes: "" }]);
  const removeMed = (id: string) =>
    setMeds((curr) => (curr.length === 1 ? curr : curr.filter((m) => m.id !== id)));
  const patchMed = (id: string, patch: Partial<Medication>) =>
    setMeds((curr) => curr.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  // -------------------------- Render --------------------------
  return (
    <div className="relative space-y-4">
      {/* Patient Context Bar (with Sidebar toggle at top-right) */}
      <div className="ui-card p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--secondary)", color: "var(--on-secondary)" }}
              aria-label="Patient"
              title="Patient"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <circle cx="12" cy="8" r="3" />
                <path d="M4 20a8 8 0 0 1 16 0" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Info label="Patient Name" value={patient.name} />
                <Info label="Age" value={patient.age} />
                <Info label="Gender" value={patient.gender} />
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Info label="ABHA Number" value={patient.abhaNumber || "—"} />
                <Info label="ABHA Address" value={patient.abhaAddress || "—"} />
                <Info label="Last Consultation" value={"New Patient"} />
              </div>
            </div>
          </div>

          {/* Right: header actions */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <button
              className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-2"
              onClick={() => setToast({ type: "info", message: "Generating summary…" })}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                <path d="M14 3v6h6" />
              </svg>
              Summary
            </button>

            {/* Sidebar toggle */}
            <button
              className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-2"
              onClick={toggleSidebar}
              aria-pressed={sidebarCollapsed}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
                style={{ color: "var(--secondary)" }}
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              {sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            </button>
          </div>
        </div>
      </div>

      {/* Workspace: Queue (L) • Editor (M) • Preview (R) */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `${queueOpen ? "280px" : "0px"} minmax(0,1fr) minmax(320px, 420px)`,
        }}
      >
        {/* OPD Queue */}
        <aside
          className={[
            "ui-card overflow-hidden transition-all duration-200",
            queueOpen ? "p-3" : "p-0 w-0 border-0",
          ].join(" ")}
          aria-hidden={!queueOpen}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">OPD Queue</div>
            <button
              className="btn-outline text-xs px-2 py-1"
              onClick={() => setQueueOpen((s) => !s)}
              aria-expanded={queueOpen}
              title={queueOpen ? "Hide queue" : "Show queue"}
            >
              {queueOpen ? "Hide" : "Show"}
            </button>
          </div>

          <ul className="space-y-2">
            {queue.map((q) => (
              <li
                key={q.id}
                className="rounded-lg border p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => assignFromQueue(q)}
                title="Load into editor"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">
                      {q.ticket} • {q.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {q.gender}, {q.age}y • {q.reason}
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500">{formatHM(q.scheduledAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Editor */}
        <section className="ui-card p-4 space-y-4">
          <Header title="Consultation (v2)" subtitle="Form • Diagnosis • Plan • Rx" />

          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Chief Complaints*">
              <Textarea
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                placeholder="e.g., Fever and cough for 3 days"
              />
            </Field>
            <Field label="Examination">
              <Textarea
                value={examination}
                onChange={(e) => setExamination(e.target.value)}
                placeholder="Vitals, systemic exams"
              />
            </Field>
            <Field label="Diagnosis">
              <Textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Primary/secondary diagnoses"
              />
            </Field>
            <Field label="Plan">
              <Textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Investigations, follow-up, lifestyle"
              />
            </Field>
            <Field className="md:col-span-2" label="Advice / Notes">
              <Textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="Any additional instructions"
              />
            </Field>
          </div>

          {/* Prescriptions */}
          <div>
            <div className="mb-2 text-sm font-semibold">Prescriptions</div>
            <div className="space-y-3">
              {meds.map((m, idx) => (
                <div key={m.id} className="grid md:grid-cols-6 gap-2 items-start">
                  <Field label={`Medicine ${idx + 1}`}>
                    <input
                      className="ui-input"
                      value={m.name}
                      onChange={(e) => patchMed(m.id, { name: e.target.value })}
                      placeholder="e.g., Paracetamol 500 mg"
                    />
                  </Field>
                  <Field label="Dose">
                    <input
                      className="ui-input"
                      value={m.dose}
                      onChange={(e) => patchMed(m.id, { dose: e.target.value })}
                      placeholder="e.g., 500 mg"
                    />
                  </Field>
                  <Field label="Frequency">
                    <input
                      className="ui-input"
                      value={m.frequency}
                      onChange={(e) => patchMed(m.id, { frequency: e.target.value })}
                      placeholder="e.g., 1-0-1"
                    />
                  </Field>
                  <Field label="Duration">
                    <input
                      className="ui-input"
                      value={m.duration}
                      onChange={(e) => patchMed(m.id, { duration: e.target.value })}
                      placeholder="e.g., 5 days"
                    />
                  </Field>
                  <Field label="Route">
                    <input
                      className="ui-input"
                      value={m.route}
                      onChange={(e) => patchMed(m.id, { route: e.target.value })}
                      placeholder="e.g., PO / IM"
                    />
                  </Field>
                  <Field label="Notes">
                    <input
                      className="ui-input"
                      value={m.notes}
                      onChange={(e) => patchMed(m.id, { notes: e.target.value })}
                      placeholder="Optional instruction"
                    />
                  </Field>

                  <div className="md:col-span-6 flex justify-between">
                    <button type="button" className="btn-outline" onClick={addMed}>
                      + Add Medicine
                    </button>
                    <button type="button" className="btn-outline" onClick={() => removeMed(m.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Preview */}
        <aside className="ui-card p-4 overflow-auto">
          <Header title="Preview" subtitle="Print-friendly view (auto-updates)" />

          <div className="rounded-lg border p-3 space-y-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{patient.name}</div>
                <div className="text-xs text-gray-600">
                  {patient.gender} • {patient.age}
                </div>
                <div className="text-xs text-gray-600">
                  ABHA: {patient.abhaNumber || "—"} • {patient.abhaAddress || "—"}
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                {mounted ? new Date().toLocaleString() : "—"}
              </div>
            </div>

            <PreviewBlock title="Chief Complaints" body={chiefComplaints} />
            <PreviewBlock title="Examination" body={examination} />
            <PreviewBlock title="Diagnosis" body={diagnosis} />
            <PreviewBlock title="Plan" body={plan} />
            <PreviewBlock title="Advice / Notes" body={advice} />

            <div>
              <div className="font-semibold mb-1">Prescriptions</div>
              {meds.filter((m) => m.name.trim()).length === 0 ? (
                <div className="text-gray-500 text-xs">No medicines added.</div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 pr-2">Medicine</th>
                      <th className="text-left py-1 pr-2">Dose</th>
                      <th className="text-left py-1 pr-2">Frequency</th>
                      <th className="text-left py-1 pr-2">Duration</th>
                      <th className="text-left py-1 pr-2">Route</th>
                      <th className="text-left py-1">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meds
                      .filter((m) => m.name.trim())
                      .map((m) => (
                        <tr key={m.id} className="border-b">
                          <td className="py-1 pr-2">{m.name}</td>
                          <td className="py-1 pr-2">{m.dose || "—"}</td>
                          <td className="py-1 pr-2">{m.frequency || "—"}</td>
                          <td className="py-1 pr-2">{m.duration || "—"}</td>
                          <td className="py-1 pr-2">{m.route || "—"}</td>
                          <td className="py-1">{m.notes || "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-4">
        <div className="ui-card p-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Patient:</span> {patient.name}
            <span className="mx-2">•</span>
            <span className="font-medium">Record:</span> Consultation (v2)
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
}

// ------------------------ Local UI helpers ------------------------
function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="text-lg font-semibold">{title}</div>
      {subtitle && <div className="text-[11px] text-gray-500">{subtitle}</div>}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-medium">{value && value.trim() ? value : "—"}</div>
    </div>
  );
}

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
      <span className="block text-xs font-medium text-gray-700 mb-1">{label}</span>
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
    <textarea className="ui-input min-h-[96px]" value={value} onChange={onChange} placeholder={placeholder} />
  );
}

function PreviewBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="font-semibold">{title}</div>
      <div className="text-gray-800 whitespace-pre-wrap text-xs mt-1">
        {body.trim() ? body : "—"}
      </div>
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
  const color = type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#2563eb";

  useEffect(() => {
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className="rounded-lg shadow-lg border bg-white px-4 py-3 text-sm" style={{ borderColor: color }}>
        <div className="flex items-start gap-2">
          <div className="mt-[2px]" style={{ color }}>
            {type === "success" ? "✔" : type === "error" ? "⚠" : "ℹ"}
          </div>
          <div className="text-gray-800">{children}</div>
          <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------ Utilities ------------------------
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36).slice(2);
}
function isoWithHM(plusHours = 0, plusMinutes = 0) {
  const d = new Date();
  d.setHours(d.getHours() + plusHours, d.getMinutes() + plusMinutes, 0, 0);
  return d.toISOString();
}
function formatHM(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}
function hasAnyValue(m: Medication) {
  return m.name.trim() || m.dose.trim() || m.frequency.trim() || m.duration.trim() || m.route.trim() || m.notes.trim();
}
