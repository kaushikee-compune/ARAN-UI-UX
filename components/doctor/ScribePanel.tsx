// components/doctor/ScribePanel.tsx
"use client";

import React, { useMemo, useState } from "react";
import { segmentTranscript } from "@/utils/voiceNlp"; // sentence splitter only
// Endpoint should already exist per project note #51:
// POST /api/nlp/classify-utterances -> { lang, sentences } => { results }

export type ClassType = "complaint" | "advice" | "other";

export type ClassifiedUtterance = {
  text: string;
  class: ClassType;
};

export type ScribeSubmitPayload = {
  complaints: string[]; // bullets → chiefComplaints
  advice: string[]; // bullets → doctorNote
};

export default function ScribePanel({
  defaultLang = "en",
  initialTranscript = "",
  onSubmit,
  onCancel,
  clearAfterSubmit = true, // <— NEW (optional)
}: {
  defaultLang?: string;
  initialTranscript?: string;
  onSubmit: (payload: ScribeSubmitPayload) => void;
  onCancel?: () => void;
  clearAfterSubmit?: boolean;
}) {
  // --------------- State ---------------
  const [lang, setLang] = useState(defaultLang);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [results, setResults] = useState<ClassifiedUtterance[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------- Derived ---------------
  const { complaints, advice } = useMemo(() => {
    const c: string[] = [];
    const a: string[] = [];
    (results ?? []).forEach((r) => {
      if (r.class === "complaint") c.push(r.text);
      if (r.class === "advice") a.push(r.text);
    });
    return { complaints: c, advice: a };
  }, [results]);

  const canSubmit = !!results && (complaints.length > 0 || advice.length > 0);

  // --------------- Actions ---------------

  const analyze = async () => {
    const sentences = segmentTranscript(transcript || "")
      .flatMap((s) => s.split(/\r?\n+/))
      .flatMap((s) => s.split(/(?<=[.!?])\s+/))
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length === 0) {
      setResults([]);
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/nlp/classify-utterances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, sentences }),
      });
      if (!res.ok) throw new Error("Classification failed");
      // const data: { results: Array<{ text: string; class: ClassType }> } =
      //   await res.json();
      const data: any = await res.json();
      // setResults(
      //   data.results.map((r) => ({
      //     text: r.text.trim(),
      //     class: r.class,
      //   }))
      // );

      setResults(
        (Array.isArray(data?.results) ? data.results : [])
          .map((r: any) => {
            const text = (r?.text || r?.sentence || "").toString().trim();
            if (!text) return null;

            // Robustly pick the raw label and normalize
            const rawLabel = pickRawLabel(r);
            const cls = normalizeClass(rawLabel);

            return { text, class: cls } as ClassifiedUtterance;
          })
          .filter(Boolean) as ClassifiedUtterance[]
      );
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setResults(null);
  };

  const cancelReview = () => {
    setResults(null);
    onCancel?.();
  };

  const submitReview = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      onSubmit({ complaints, advice });
      // keep transcript for re-edits; but clear the review (optional flag)
      if (clearAfterSubmit) setResults(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------- UI ---------------
  return (
    <div className="space-y-4">
      {/* Transcript input block */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Transcript
            </span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="text-xs rounded-md border border-gray-300 px-2 py-1"
              aria-label="Language"
              title="Language"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              {/* add more as needed */}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={analyze}
              disabled={isAnalyzing || !transcript.trim()}
              className="inline-flex items-center rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              title="Analyze transcript"
            >
              {isAnalyzing ? "Analyzing…" : "Analyze"}
            </button>
            <button
              type="button"
              onClick={clearTranscript}
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Clear"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          placeholder="Paste or dictate transcript here…"
          className="w-full resize-y border-0 p-3 focus:ring-0"
        />
      </div>

      {/* Review / Results block */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">
            Analysis Review
          </span>
          <div className="text-xs text-gray-500">
            {/* Simple tally */}
            <span className="mr-3">
              Complaints: <b>{complaints.length}</b>
            </span>
            <span className="mr-3">
              Advice: <b>{advice.length}</b>
            </span>
            <span>
              Other:{" "}
              <b>{(results ?? []).filter((r) => r.class === "other").length}</b>
            </span>
          </div>
        </div>

        {/* Results list with chips */}
        <div className="max-h-52 overflow-auto p-3 space-y-2">
          {results === null ? (
            <p className="text-sm text-gray-500">
              Waiting for analysis… run <b>Analyze</b> to see classified lines.
            </p>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-500">No items found.</p>
          ) : (
            results.map((r, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <span
                  className={[
                    "inline-flex shrink-0 select-none items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    r.class === "complaint"
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : r.class === "advice"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-gray-200 text-gray-700 border border-gray-300",
                  ].join(" ")}
                >
                  {r.class === "complaint"
                    ? "Complaint"
                    : r.class === "advice"
                    ? "Advice"
                    : "Other"}
                </span>
                <p className="text-sm text-gray-800 leading-5">{r.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Submit / Cancel */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100">
          <button
            type="button"
            onClick={cancelReview}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submitReview}
            disabled={!canSubmit || isSubmitting}
            className="inline-flex items-center rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Extract a label string from various API result shapes
function pickRawLabel(r: any): string {
  if (!r || typeof r !== "object") return "";

  // direct string fields
  const direct =
    r.class ?? r.label ?? r.type ?? r.category ?? r.tag ?? r.kind ?? r.group;

  if (typeof direct === "string") return direct;

  // nested object shapes like { class: { name: "Complaint" } }
  const nested =
    (r.class && (r.class.name || r.class.label || r.class.type)) ||
    (r.label && (r.label.name || r.label.value)) ||
    (r.type && (r.type.name || r.type.value)) ||
    (r.category && (r.category.name || r.category.value));

  if (typeof nested === "string") return nested;

  return "";
}

// Normalizes LLM/route labels → our internal union
function normalizeClass(raw: string): ClassType {
  const s = (raw || "").toLowerCase().trim();

  // complaints synonyms / variants
  if (
    s === "complaint" ||
    s === "complaints" ||
    s === "chief_complaint" ||
    s === "chief-complaint" ||
    s === "chief complaint" ||
    s === "cc" ||
    s.startsWith("complain") // handles "complain"/"complaining"
  ) {
    return "complaint";
  }

  // advice / plan / note synonyms / variants
  if (
    s === "advice" ||
    s === "plan" ||
    s === "instruction" ||
    s === "instructions" ||
    s === "doctor_note" ||
    s === "doctor’s advice" ||
    s === "doctors_advice" ||
    s === "doctors advice" ||
    s === "recommendation" ||
    s === "recommendations" ||
    s === "note" ||
    s === "notes"
  ) {
    return "advice";
  }

  return "other";
}
