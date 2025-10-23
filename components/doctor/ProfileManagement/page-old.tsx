"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";

/* =======================================================
   Main Component
======================================================= */
export default function ProfileManagement() {
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [tagline, setTagline] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [experience, setExperience] = useState("");
  const [qualifications, setQualifications] = useState<string[]>([""]);
  const [about, setAbout] = useState("");
  const [address, setAddress] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [internalPhone, setInternalPhone] = useState("");
  const [testimonials, setTestimonials] = useState<
    { patient: string; text: string }[]
  >([{ patient: "", text: "" }]);
  const [previewMode, setPreviewMode] = useState(false);

  const minChars = 100;
  const maxChars = 800;

  /* ---------- Dropzone for photo ---------- */
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop,
  });

  /* ---------- Qualification handlers ---------- */
  const updateQualification = (i: number, v: string) => {
    const next = [...qualifications];
    next[i] = v;
    setQualifications(next);
  };
  const addQualification = () => setQualifications([...qualifications, ""]);
  const removeQualification = (i: number) =>
    setQualifications(qualifications.filter((_, idx) => idx !== i));

  /* ---------- Testimonials handlers ---------- */
  const updateTestimonial = (
    i: number,
    field: "patient" | "text",
    v: string
  ) => {
    const next = [...testimonials];
    next[i] = { ...next[i], [field]: v };
    setTestimonials(next);
  };
  const addTestimonial = () =>
    setTestimonials([...testimonials, { patient: "", text: "" }]);
  const removeTestimonial = (i: number) =>
    setTestimonials(testimonials.filter((_, idx) => idx !== i));

  /* ---------- Form stats ---------- */
  const charCount = about.length;
  const charError =
    charCount < minChars
      ? `Minimum ${minChars} characters required`
      : charCount > maxChars
      ? `Maximum ${maxChars} characters exceeded`
      : "";

  /* ---------- Actions ---------- */
  const onSave = () => alert("Draft saved successfully");
  const onPublish = () => alert("Profile published successfully");

  /* ---------- Preview ---------- */
  if (previewMode) {
    return (
      <DoctorProfilePreview
        name={name}
        specialization={specialization}
        tagline={tagline}
        photo={photo}
        experience={experience}
        qualifications={qualifications}
        about={about}
        address={address}
        publicPhone={publicPhone}
        testimonials={testimonials}
        onBack={() => setPreviewMode(false)}
        onPublish={onPublish}
      />
    );
  }

  /* =======================================================
     Edit Mode
  ======================================================= */
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-xl font-semibold text-gray-800">
          Complete Your Doctor Profile
        </h1>
        <p className="text-sm text-gray-500">
          Please fill in the details below to set up your professional profile.
        </p>
      </header>

      {/* Name & Specialization */}
      <section className="ui-card p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-800">
          Name & Specialization
        </h2>
        <div className="grid gap-3">
          <input
            className="ui-input w-full"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="ui-input w-full"
            placeholder="Specialization or Title (e.g. Consultant Gynecologist)"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />
          <input
            className="ui-input w-full"
            placeholder="Short tagline (optional)"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>
      </section>

      {/* Profile Photo */}
      <section className="ui-card p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-800">Profile Photo</h2>
        <div
          {...getRootProps()}
          className={[
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition",
            isDragActive ? "bg-gray-50 border-gray-400" : "border-gray-300",
          ].join(" ")}
        >
          <input {...getInputProps()} />
          {photo ? (
            <div className="flex flex-col items-center space-y-2">
              <Image
                src={photo}
                alt="Profile Preview"
                width={120}
                height={120}
                className="rounded-full object-cover"
              />
              <span className="text-xs text-gray-500">
                Click or drag to change photo
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Drag & drop or click to upload your photo
              </p>
              <p className="text-xs text-gray-400">
                Recommended: square image, 600×600px, PNG/JPG
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Experience & Qualifications */}
      <section className="ui-card p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-800">
          Experience & Qualifications
        </h2>
        <div className="grid gap-3">
          <div>
            <label className="text-[11px] text-gray-600">
              Years of Experience
            </label>
            <input
              type="number"
              className="ui-input w-32"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] text-gray-600">
              Qualifications
            </label>
            {qualifications.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="ui-input flex-1"
                  placeholder="e.g. MBBS, MD (OBGYN)"
                  value={q}
                  onChange={(e) => updateQualification(i, e.target.value)}
                />
                {qualifications.length > 1 && (
                  <button
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                    onClick={() => removeQualification(i)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
              onClick={addQualification}
            >
              + Add Another
            </button>
          </div>
        </div>
      </section>

      {/* Address & Phone */}
      <section className="ui-card p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-800">
          Address & Contact
        </h2>
        <div className="grid gap-3">
          <div>
            <label className="text-[11px] text-gray-600">Clinic Address</label>
            <textarea
              className="ui-textarea w-full min-h-[80px]"
              placeholder="Enter your clinic or hospital address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-600">
                Public Phone Number (visible on profile)
              </label>
              <input
                type="tel"
                className="ui-input w-full"
                placeholder="+91 98765 43210"
                value={publicPhone}
                onChange={(e) => setPublicPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-600">
                Internal Contact (for clinic use only)
              </label>
              <input
                type="tel"
                className="ui-input w-full"
                placeholder="+91 98765 00000"
                value={internalPhone}
                onChange={(e) => setInternalPhone(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="ui-card p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-800">About the Doctor</h2>
        <p className="text-xs text-gray-500">
          Write about yourself in 100–800 characters. Include your approach,
          experience, and areas of interest.
        </p>
        <textarea
          className="ui-textarea w-full min-h-[160px]"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Describe your medical journey, patient care philosophy, and specializations..."
          maxLength={maxChars}
        />
        <div className="flex items-center justify-between text-xs">
          <span className={charError ? "text-red-500" : "text-gray-500"}>
            {charError || `${charCount}/${maxChars} characters`}
          </span>
        </div>
      </section>

      {/* Testimonials */}
      <section className="ui-card p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-800">Patient Testimonials</h2>
        <p className="text-xs text-gray-500">
          Add feedback or testimonials received from your patients.
        </p>
        {testimonials.map((t, i) => (
          <div key={i} className="grid gap-2 border p-3 rounded-md">
            <input
              className="ui-input w-full"
              placeholder="Patient Name"
              value={t.patient}
              onChange={(e) => updateTestimonial(i, "patient", e.target.value)}
            />
            <textarea
              className="ui-textarea w-full min-h-[60px]"
              placeholder="Patient's feedback or testimonial"
              value={t.text}
              onChange={(e) => updateTestimonial(i, "text", e.target.value)}
            />
            <div className="flex justify-end">
              {testimonials.length > 1 && (
                <button
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  onClick={() => removeTestimonial(i)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
          onClick={addTestimonial}
        >
          + Add Testimonial
        </button>
      </section>

      {/* Footer */}
      <footer className="ui-card p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          Tip: Update your profile regularly for patients to see accurate
          information.
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
            onClick={onSave}
          >
            Save Draft
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md border bg-blue-600 text-white hover:bg-blue-700 border-blue-700"
            onClick={() => setPreviewMode(true)}
          >
            Preview Profile
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
            onClick={onPublish}
          >
            Publish
          </button>
        </div>
      </footer>
    </div>
  );
}

/* =======================================================
   Subcomponent: Public Preview
======================================================= */
function DoctorProfilePreview({
  name,
  specialization,
  tagline,
  photo,
  experience,
  qualifications,
  about,
  address,
  publicPhone,
  testimonials,
  onBack,
  onPublish,
}: {
  name: string;
  specialization: string;
  tagline: string;
  photo: string | null;
  experience: string;
  qualifications: string[];
  about: string;
  address: string;
  publicPhone: string;
  testimonials: { patient: string; text: string }[];
  onBack: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b bg-gray-50 py-3 px-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800">Profile Preview</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
            onClick={onBack}
          >
            ← Back to Edit
          </button>
          <button
            className="px-3 py-1 text-sm border rounded bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onPublish}
          >
            Publish Profile
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          {photo ? (
            <Image
              src={photo}
              alt="Doctor photo"
              width={140}
              height={140}
              className="rounded-full object-cover shadow"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-gray-100 grid place-items-center text-gray-400">
              No Photo
            </div>
          )}
          <h1 className="text-2xl font-semibold text-gray-900">
            {name || "Dr. Your Name"}
          </h1>
          <div className="text-sm text-gray-700">{specialization}</div>
          {tagline && (
            <p className="text-gray-600 italic text-sm max-w-md">{tagline}</p>
          )}
        </div>

        <section className="text-gray-800 leading-relaxed text-sm space-y-2">
          <h2 className="font-semibold text-gray-700">About</h2>
          <p>{about || "No description provided yet."}</p>
        </section>

        <section className="text-gray-800 leading-relaxed text-sm space-y-2">
          <h2 className="font-semibold text-gray-700">
            Experience & Qualifications
          </h2>
          <p>
            {experience
              ? `${experience} years of experience`
              : "Experience not specified"}
          </p>
          <ul className="list-disc pl-6 space-y-1">
            {qualifications.filter(Boolean).length > 0 ? (
              qualifications.map((q, i) => <li key={i}>{q}</li>)
            ) : (
              <li>No qualifications added</li>
            )}
          </ul>
        </section>

        <section className="text-gray-800 leading-relaxed text-sm space-y-2">
          <h2 className="font-semibold text-gray-700">Contact & Address</h2>
          <p>{address || "Address not provided."}</p>
          {publicPhone && (
            <p className="text-gray-700 font-medium">
              📞 {publicPhone}
            </p>
          )}
        </section>

        {testimonials.filter((t) => t.text.trim()).length > 0 && (
          <section className="text-gray-800 leading-relaxed text-sm space-y-3">
            <h2 className="font-semibold text-gray-700">
              Patient Testimonials
            </h2>
            <div className="grid gap-3">
              {testimonials
                .filter((t) => t.text.trim())
                .map((t, i) => (
                  <div
                    key={i}
                    className="border rounded-lg p-3 bg-gray-50 shadow-sm"
                  >
                    <p className="italic">"{t.text}"</p>
                    <div className="text-xs text-gray-600 mt-1">
                      — {t.patient || "Anonymous"}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
