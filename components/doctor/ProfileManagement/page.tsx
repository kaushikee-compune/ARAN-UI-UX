"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import VisitingHours, { VisitingSlot } from "./VisitingHours"; // single source of truth for the type

/**
 * Doctor Profile Management (component)
 * Web-like surface: Hero → Photo/About → Qualifications → VisitingHours → CTAs
 */
export default function ProfileManagement() {
  // --- Mock/base state (replace with server data later) ---
  const [name, setName] = useState("Dr. Kavya Deshpande");
  const [specialty, setSpecialty] = useState("Consultant Gynecologist & Fetal Medicine");
  const [tagline, setTagline] = useState(
    "Compassionate women’s health, evidence-based care, and precise fetal diagnostics."
  );
  const [about, setAbout] = useState(
    "Dr. Kavya Deshpande is a board-certified gynecologist with 20+ years of experience in obstetrics, fetal medicine, and minimally invasive gynecologic procedures. Her approach blends clinical precision with empathetic care, focusing on patient education and shared decision-making."
  );

  const [qualifications, setQualifications] = useState<string[]>([
    "MBBS, MD (OBGYN)",
    "Fellowship in Fetal Medicine",
    "Advanced Ultrasound & High-Risk Pregnancy Management",
  ]);
  const [experienceYears, setExperienceYears] = useState(20);
  const [highlights, setHighlights] = useState<string[]>([
    "Special interest: High-risk pregnancy and fetal anomalies",
    "Proficient in 3D/4D ultrasound and screening protocols",
    "Minimally invasive gynecologic procedures",
  ]);

  // Visiting hours — keep in this component state (controlled)
  const [schedule, setSchedule] = useState<VisitingSlot[]>([
    { id: "seed-1", days: ["Mon", "Wed"], start: "10:00", end: "12:00", label: "OPD", location: "Main Clinic" },
    { id: "seed-2", days: ["Tue", "Thu"], start: "17:00", end: "20:00", label: "Evening OPD", location: "Branch A" },
  ]);

  // --- Edit toggles ---
  const [editAbout, setEditAbout] = useState(false);
  const [editQuals, setEditQuals] = useState(false);

  // for edits (staging)
  const [draftAbout, setDraftAbout] = useState(about);
  const [draftQualifications, setDraftQualifications] = useState<string[]>(qualifications);
  const [draftExperienceYears, setDraftExperienceYears] = useState<number>(experienceYears);
  const [draftHighlights, setDraftHighlights] = useState<string[]>(highlights);

  // --- Actions (stub) ---
  const onSaveAbout = () => {
    setAbout(draftAbout.trim());
    setEditAbout(false);
  };
  const onCancelAbout = () => {
    setDraftAbout(about);
    setEditAbout(false);
  };

  const onSaveQuals = () => {
    setQualifications(draftQualifications.map((s) => s.trim()).filter(Boolean));
    setExperienceYears(draftExperienceYears);
    setHighlights(draftHighlights.map((s) => s.trim()).filter(Boolean));
    setEditQuals(false);
  };
  const onCancelQuals = () => {
    setDraftQualifications(qualifications);
    setDraftExperienceYears(experienceYears);
    setDraftHighlights(highlights);
    setEditQuals(false);
  };

  const yearsLabel = useMemo(() => {
    const y = Number(experienceYears || 0);
    return `${y} year${y === 1 ? "" : "s"} of experience`;
  }, [experienceYears]);

  return (
    <div className="grid gap-4">
      {/* HERO */}
      <section className="ui-card p-5 md:p-6 relative overflow-hidden" aria-label="Doctor hero">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(1000px 300px at -200px -200px, var(--secondary) 0%, transparent 60%)",
            opacity: 0.12,
          }}
        />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{name}</h1>
            <div className="text-sm text-gray-700 mt-0.5">{specialty}</div>
            <p className="mt-2 text-sm text-gray-800 max-w-3xl">{tagline}</p>
          </div>
          <button
            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border hover:bg-gray-50"
            title="Edit header"
            onClick={() => {
              const n = prompt("Doctor name", name) ?? name;
              const s = prompt("Specialty line", specialty) ?? specialty;
              const t = prompt("Tagline", tagline) ?? tagline;
              setName(n.trim());
              setSpecialty(s.trim());
              setTagline(t.trim());
            }}
          >
            <PenIcon className="w-4 h-4" /> Edit
          </button>
        </div>
      </section>

      {/* ROW 2: PHOTO + ABOUT */}
      <section className="grid gap-4 md:grid-cols-2 items-start">
        {/* Photo */}
        <div className="ui-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Profile Photo</h2>
            <button
              className="text-xs rounded-md px-2 py-1 border hover:bg-gray-50"
              onClick={() => alert("Hook this to your upload flow")}
            >
              Upload
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border">
              <Image
                src="/whitelogo.png" // replace with real photo path
                alt="Doctor photo"
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="text-xs text-gray-600">Recommended: square image, 600×600 or higher. PNG/JPG.</div>
          </div>
        </div>

        {/* About / Write-up */}
        <div className="ui-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">About the Doctor</h2>
            {!editAbout ? (
              <button
                className="inline-flex items-center gap-2 text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                onClick={() => setEditAbout(true)}
                title="Edit about"
              >
                <PenIcon className="w-4 h-4" />
                Edit
              </button>
            ) : null}
          </div>

          {!editAbout ? (
            <p className="mt-2 text-sm text-gray-800 leading-6">{about}</p>
          ) : (
            <div className="mt-2 grid gap-2">
              <textarea
                className="ui-textarea w-full min-h-[120px]"
                value={draftAbout}
                onChange={(e) => setDraftAbout(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs rounded-md border bg-gray-900 text-white hover:bg-gray-800" onClick={onSaveAbout}>
                  Save
                </button>
                <button className="px-3 py-1.5 text-xs rounded-md border hover:bg-gray-50" onClick={onCancelAbout}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ROW 3: QUALIFICATIONS & EXPERIENCE + VISITING HOURS */}
      <section className="grid gap-4 md:grid-cols-2 items-start">
        {/* Qualifications & Experience */}
        <div className="ui-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Qualifications & Experience</h2>
            {!editQuals ? (
              <button
                className="inline-flex items-center gap-2 text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                onClick={() => setEditQuals(true)}
                title="Edit qualifications & experience"
              >
                <PenIcon className="w-4 h-4" />
                Edit
              </button>
            ) : null}
          </div>

          {!editQuals ? (
            <div className="mt-2 grid gap-2 text-sm">
              <div className="text-gray-800">{yearsLabel}</div>
              <ul className="list-disc pl-5 space-y-1 text-gray-800">
                {qualifications.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
              {highlights.length > 0 && (
                <>
                  <div className="pt-1 text-xs text-gray-500">Highlights</div>
                  <ul className="list-disc pl-5 space-y-1 text-gray-800">
                    {highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <div className="mt-3 grid gap-3 text-sm">
              <div className="grid gap-1">
                <label className="text-[11px] text-gray-600">Years of Experience</label>
                <input
                  type="number"
                  className="ui-input w-28"
                  value={draftExperienceYears}
                  onChange={(e) => setDraftExperienceYears(Number(e.target.value || 0))}
                />
              </div>

              <EditableList
                label="Qualifications"
                items={draftQualifications}
                onChange={setDraftQualifications}
                placeholder="Add qualification"
              />

              <EditableList
                label="Highlights"
                items={draftHighlights}
                onChange={setDraftHighlights}
                placeholder="Add highlight (optional)"
              />

              <div className="flex items-center gap-2 pt-1">
                <button className="px-3 py-1.5 text-xs rounded-md border bg-gray-900 text-white hover:bg-gray-800" onClick={onSaveQuals}>
                  Save
                </button>
                <button className="px-3 py-1.5 text-xs rounded-md border hover:bg-gray-50" onClick={onCancelQuals}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Visiting Hours / Schedule — modern component */}
        <VisitingHours value={schedule} onChange={setSchedule} />
      </section>

      {/* FOOTER CTAs */}
      <footer className="ui-card p-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="text-xs text-gray-600">
          Tip: Keep your profile concise. Update schedule changes promptly so patients see accurate timings.
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50" onClick={() => alert("Saved draft")}>
            Save Draft
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
            onClick={() => alert("Published")}
          >
            Publish Profile
          </button>
          <button className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50" onClick={() => alert("Open public page preview")}>
            View Public Page
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ------------ Small helpers/components ------------ */
function EditableList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const add = () => onChange([...items, ""]);
  const set = (i: number, v: string) => {
    const next = items.slice();
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="grid gap-1">
      <label className="text-[11px] text-gray-600">{label}</label>
      <div className="grid gap-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="ui-input w-full" value={it} placeholder={placeholder} onChange={(e) => set(i, e.target.value)} />
            <button className="w-8 h-8 rounded-md border hover:bg-gray-50" onClick={() => remove(i)} title="Remove">
              ×
            </button>
          </div>
        ))}
        <button className="self-start px-2 py-1.5 text-xs rounded-md border hover:bg-gray-50" onClick={add}>
          + Add
        </button>
      </div>
    </div>
  );
}

function PenIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
