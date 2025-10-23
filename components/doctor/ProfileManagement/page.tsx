"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";

export default function ProfileManagement() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("Dr. Kavya Deshpande");
  const [specialization, setSpecialization] = useState(
    "Consultant Gynecologist & Fetal Medicine"
  );
  const [tagline, setTagline] = useState(
    "Compassionate women’s health, evidence-based care, and precise fetal diagnostics."
  );
  const [about, setAbout] = useState(
    "Dr. Kavya Deshpande is a board-certified gynecologist with 20+ years of experience in obstetrics, fetal medicine, and minimally invasive gynecologic procedures."
  );
  const [experience, setExperience] = useState("20");
  const [qualifications, setQualifications] = useState([
    "MBBS, MD (OBGYN)",
    "Fellowship in Fetal Medicine",
  ]);
  const [address, setAddress] = useState("Sushila Mathrutva Clinic, Kolkata");
  const [publicPhone, setPublicPhone] = useState("+91 98765 43210");
  const [internalPhone, setInternalPhone] = useState("+91 98765 00000");
  const [testimonials, setTestimonials] = useState([
    {
      patient: "Shampa G.",
      text: "Dr. Kavya is incredibly caring and patient. She guided me throughout my pregnancy journey with utmost compassion.",
    },
  ]);

  // Edit state toggles
  const [editingField, setEditingField] = useState<string | null>(null);

  /* ---------- Image upload ---------- */
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop,
  });

  const addQualification = () =>
    setQualifications([...qualifications, "New qualification"]);
  const removeQualification = (i: number) =>
    setQualifications(qualifications.filter((_, idx) => idx !== i));

  const addTestimonial = () =>
    setTestimonials([...testimonials, { patient: "", text: "" }]);

  const updateTestimonial = (
    i: number,
    field: "patient" | "text",
    value: string
  ) => {
    const next = [...testimonials];
    next[i] = { ...next[i], [field]: value };
    setTestimonials(next);
  };

  const removeTestimonial = (i: number) =>
    setTestimonials(testimonials.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto space-y-10">
        {/* ========== Profile Header ========== */}
        <section className="flex flex-col items-center text-center space-y-3 relative">
          {/* Profile Image */}
          <div {...getRootProps()} className="relative group cursor-pointer">
            <input {...getInputProps()} />
            <Image
              src={photo || "/default-doctor.png"}
              alt="Doctor"
              width={140}
              height={140}
              className="rounded-full object-cover shadow"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <PenIcon className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Name / Specialization / Tagline */}
          {editingField === "name" ? (
            <div className="flex flex-col items-center gap-2">
              <input
                className="ui-input w-72 text-center"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="text-xs text-blue-600"
                onClick={() => setEditingField(null)}
              >
                Done
              </button>
            </div>
          ) : (
            <h1
              className="text-2xl font-semibold text-gray-900 cursor-pointer"
              onClick={() => setEditingField("name")}
            >
              {name}
            </h1>
          )}

          {editingField === "specialization" ? (
            <input
              className="ui-input text-center"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              onBlur={() => setEditingField(null)}
            />
          ) : (
            <div
              className="text-sm text-gray-700 cursor-pointer"
              onClick={() => setEditingField("specialization")}
            >
              {specialization}
            </div>
          )}

          {editingField === "tagline" ? (
            <textarea
              className="ui-textarea text-center min-h-[60px]"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              onBlur={() => setEditingField(null)}
            />
          ) : (
            <p
              className="text-gray-600 italic text-sm max-w-md cursor-pointer"
              onClick={() => setEditingField("tagline")}
            >
              {tagline}
            </p>
          )}
        </section>

        {/* ========== About Section ========== */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 text-lg">About</h2>
            <button onClick={() => setEditingField("about")}>
              <PenIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {editingField === "about" ? (
            <div className="space-y-2">
              <textarea
                className="ui-textarea w-full min-h-[120px]"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
              <button
                className="text-xs text-blue-600"
                onClick={() => setEditingField(null)}
              >
                Done
              </button>
            </div>
          ) : (
            <p className="text-gray-800 text-sm leading-relaxed">{about}</p>
          )}
        </section>

        {/* ========== Experience & Qualifications ========== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 text-lg">
              Experience & Qualifications
            </h2>
            <button onClick={() => setEditingField("experience")}>
              <PenIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <p className="text-gray-700 text-sm">
            {experience} years of experience
          </p>

          <ul className="list-disc pl-6 space-y-1">
            {qualifications.map((q, i) =>
              editingField === "experience" ? (
                <li key={i}>
                  <input
                    className="ui-input w-full"
                    value={q}
                    onChange={(e) => {
                      const next = [...qualifications];
                      next[i] = e.target.value;
                      setQualifications(next);
                    }}
                  />
                </li>
              ) : (
                <li key={i} className="text-gray-800">
                  {q}
                </li>
              )
            )}
          </ul>

          {editingField === "experience" && (
            <div className="flex gap-2">
              <button
                className="text-xs border px-2 py-1 rounded"
                onClick={addQualification}
              >
                + Add
              </button>
              <button
                className="text-xs text-blue-600"
                onClick={() => setEditingField(null)}
              >
                Done
              </button>
            </div>
          )}
        </section>

        {/* ========== Address & Contact ========== */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 text-lg">
              Contact & Address
            </h2>
            <button onClick={() => setEditingField("contact")}>
              <PenIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {editingField === "contact" ? (
            <div className="space-y-2">
              <textarea
                className="ui-textarea w-full"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Clinic address"
              />
              <input
                className="ui-input w-full"
                value={publicPhone}
                onChange={(e) => setPublicPhone(e.target.value)}
                placeholder="Public phone"
              />
              <input
                className="ui-input w-full"
                value={internalPhone}
                onChange={(e) => setInternalPhone(e.target.value)}
                placeholder="Internal phone (not public)"
              />
              <button
                className="text-xs text-blue-600"
                onClick={() => setEditingField(null)}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-700">{address}</p>
              <p className="text-gray-800 font-medium">📞 {publicPhone}</p>
            </>
          )}
        </section>

        {/* ========== Testimonials ========== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 text-lg">
              Patient Testimonials
            </h2>
            <button onClick={() => setEditingField("testimonials")}>
              <PenIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {testimonials.map((t, i) =>
            editingField === "testimonials" ? (
              <div key={i} className="border rounded-lg p-3 space-y-1">
                <input
                  className="ui-input w-full"
                  value={t.patient}
                  onChange={(e) =>
                    updateTestimonial(i, "patient", e.target.value)
                  }
                  placeholder="Patient name"
                />
                <textarea
                  className="ui-textarea w-full min-h-[60px]"
                  value={t.text}
                  onChange={(e) =>
                    updateTestimonial(i, "text", e.target.value)
                  }
                  placeholder="Feedback"
                />
                <div className="flex justify-end">
                  <button
                    className="text-xs border px-2 py-1 rounded"
                    onClick={() => removeTestimonial(i)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="border rounded-lg p-3 bg-gray-50 shadow-sm"
              >
                <p className="italic text-gray-800">"{t.text}"</p>
                <div className="text-xs text-gray-600 mt-1">
                  — {t.patient || "Anonymous"}
                </div>
              </div>
            )
          )}

          {editingField === "testimonials" && (
            <button
              className="text-xs border px-2 py-1 rounded"
              onClick={addTestimonial}
            >
              + Add Testimonial
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

/* ---------------- Pen Icon ---------------- */
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
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
