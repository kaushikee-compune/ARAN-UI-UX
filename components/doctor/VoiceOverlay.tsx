// components/doctor/VoiceOverlay.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { segmentTranscript } from "@/utils/voiceNlp";
import type {
  ClassifiedUtterance,
  ClassType,
  ScribeSubmitPayload,
} from "@/components/doctor/ScribePanel";

/* ---------------- SpeechRecognition bridge (webkit + standard) ---------------- */
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}
// Minimal local typings for Web Speech result event
type SpeechRecEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList; // from lib.dom
};



type SR = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart?: (e: Event) => void;
  onerror?: (e: any) => void;
  onend?: (e: Event) => void;
  onresult?: (e: SpeechRecEvent) => void;
};

/* ----------------------------- Component ----------------------------- */
export default function VoiceOverlay({
  open,
  onClose,
  defaultLang = "en",
  initialTranscript = "",
  onSubmit,
  onCancel,
  clearAfterSubmit = true,
  onInsert, // legacy fallback
}: {
  open: boolean;
  onClose: () => void;
  defaultLang?: string;
  initialTranscript?: string;
  onSubmit?: (payload: ScribeSubmitPayload) => void;
  onCancel?: () => void;
  clearAfterSubmit?: boolean;
  onInsert?: (target: "chiefComplaints" | "doctorNote", text: string) => void;
}) {
  /* ---------------- State ---------------- */
  const [lang, setLang] = useState(defaultLang);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [results, setResults] = useState<ClassifiedUtterance[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // mic state
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);
  const interimRef = useRef<string>("");

  const srSupported =
    typeof window !== "undefined" &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  /* ---------------- Derived ---------------- */
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

  /* ---------------- Mic control ---------------- */
  const ensureRecognizer = () => {
    if (!srSupported) return null;
    if (recRef.current) return recRef.current;

    const RecCtor =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const rec = new RecCtor() as SR;

    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = mapLang(lang);

    rec.onstart = () => {
      setListening(true);
      setMicError(null);
    };
    rec.onerror = (e: any) => {
      // PermissionDeniedError / NotAllowedError fire here too
      setMicError(e?.error || "microphone-error");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };
    rec.onresult = (event: SpeechRecEvent)=> {
      // Collect interim/final chunks
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += text;
        else interimText += text;
      }
      // Append finals into the main transcript (with a space/newline if needed)
      if (finalText.trim()) {
        setTranscript((prev) =>
          [prev.trim(), finalText.trim()].filter(Boolean).join(prev ? "\n" : "")
        );
      }
      interimRef.current = interimText;
    };

    recRef.current = rec;
    return rec;
  };

  const startListening = () => {
    if (!srSupported) {
      setMicError("Speech recognition not supported in this browser.");
      return;
    }
    try {
      const rec = ensureRecognizer();
      if (!rec) return;
      rec.lang = mapLang(lang);
      interimRef.current = "";
      rec.start();
    } catch (e: any) {
      setMicError(e?.message || "Unable to start microphone.");
    }
  };

  const stopListening = () => {
    try {
      recRef.current?.stop();
    } catch {}
  };

  // keep recognizer language in sync
  useEffect(() => {
    if (recRef.current) recRef.current.lang = mapLang(lang);
  }, [lang]);

  // cleanup on unmount/close
  useEffect(() => {
    if (!open) {
      if (listening) stopListening();
    }
    return () => {
      try {
        recRef.current?.abort?.();
      } catch {}
      recRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ---------------- Actions (same as Scribe) ---------------- */
  const analyze = async () => {
    const sentences = segmentTranscript(transcript || "")
      .flatMap((s) => s.split(/\r?\n+/)) // split on newlines
      .flatMap((s) => s.split(/(?<=[.!?])\s+/)) // then sentence punctuation
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
      const data: any = await res.json();

      setResults(
        (Array.isArray(data?.results) ? data.results : [])
          .map((r: any) => {
            const text = (r?.text ?? r?.sentence ?? "").toString().trim();
            if (!text) return null;

            const raw = pickRawLabel(r);
            let predicted = normalizeClass(raw);

            // if label missing/unknown, infer generically (no symptom wordlist)
            if (predicted === "other") {
              predicted = hasAdviceSignals(text) ? "advice" : "complaint";
            }

            const cls = softRelabel(predicted, text);
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

  const clearAll = () => {
    setTranscript("");
    setResults(null);
    interimRef.current = "";
  };

  const cancelReview = () => {
    setResults(null);
    onCancel?.();
  };

  const submitReview = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        onSubmit({ complaints, advice });
      } else if (onInsert) {
        const bullets = (arr: string[]) => arr.map((t) => `• ${t}`).join("\n");
        if (complaints.length) onInsert("chiefComplaints", bullets(complaints));
        if (advice.length) onInsert("doctorNote", bullets(advice));
      }
      if (clearAfterSubmit) setResults(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Dialog */}
      <div className="relative mx-auto mt-10 w-full max-w-3xl">
        <div className="rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">
                Voice Scribe
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
              </select>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Transcript (same shell as Scribe, + mic button) */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  Transcript
                </span>
                <div className="flex items-center gap-2">
                  {/* Mic icon button (start/stop) */}
                  <button
                    type="button"
                    onClick={listening ? stopListening : startListening}
                    disabled={!srSupported}
                    className={[
                      "inline-flex items-center justify-center w-9 h-9 rounded-full border",
                      listening
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                      !srSupported ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                    title={
                      srSupported
                        ? listening
                          ? "Stop listening"
                          : "Start listening"
                        : "Speech recognition not supported"
                    }
                    aria-pressed={listening}
                    aria-label={listening ? "Stop mic" : "Start mic"}
                  >
                    <MicSvg className="w-4 h-4" />
                  </button>

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
                    onClick={clearAll}
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    title="Clear"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Textarea with subtle interim hint */}
              <div className="relative">
                <textarea
                  value={
                    interimRef.current
                      ? `${transcript}${transcript ? "\n" : ""}${interimRef.current}`
                      : transcript
                  }
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={6}
                  placeholder="Tap the mic and speak…"
                  className="w-full resize-y border-0 p-3 focus:ring-0"
                />
                {/* listening badge */}
                {listening && (
                  <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-red-400 text-red-700 bg-red-50">
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500">
                      <span className="absolute inline-flex h-full w-full rounded-full animate-ping bg-red-400 opacity-60" />
                    </span>
                    Listening…
                  </div>
                )}
              </div>

              {micError && (
                <div className="px-3 pb-2 text-xs text-red-600">{micError}</div>
              )}
            </div>

            {/* Review / Results */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  Analysis Review
                </span>
                <div className="text-xs text-gray-500">
                  <span className="mr-3">
                    Complaints: <b>{complaints.length}</b>
                  </span>
                  <span className="mr-3">
                    Advice: <b>{advice.length}</b>
                  </span>
                  <span>
                    Other:{" "}
                    <b>
                      {(results ?? []).filter((r) => r.class === "other").length}
                    </b>
                  </span>
                </div>
              </div>

              <div className="max-h-52 overflow-auto p-3 space-y-2">
                {results === null ? (
                  <p className="text-sm text-gray-500">
                    Waiting for analysis… run <b>Analyze</b> to see classified
                    lines.
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
                      <p className="text-sm text-gray-800 leading-5">
                        {r.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

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
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Helpers (same logic as ScribePanel) ------------------------------ */

function mapLang(code: string) {
  // Extend as you add languages
  switch ((code || "en").toLowerCase()) {
    case "hi":
      return "hi-IN";
    case "en":
    default:
      return "en-IN"; // keeps accenting decent for India locale
  }
}

// pull a label from whatever shape the API returns
function pickRawLabel(r: any): string {
  if (!r || typeof r !== "object") return "";
  const direct =
    r.class ?? r.label ?? r.type ?? r.category ?? r.tag ?? r.kind ?? r.group;
  if (typeof direct === "string") return direct;
  const nested =
    (r.class && (r.class.name || r.class.label || r.class.type)) ||
    (r.label && (r.label.name || r.label.value)) ||
    (r.type && (r.type.name || r.type.value)) ||
    (r.category && (r.category.name || r.category.value));
  return typeof nested === "string" ? nested : "";
}

function normalizeClass(raw: string): ClassType {
  const s = (raw || "").toLowerCase().trim();
  if (
    s === "complaint" ||
    s === "complaints" ||
    s === "chief_complaint" ||
    s === "chief-complaint" ||
    s === "chief complaint" ||
    s === "cc" ||
    s.startsWith("complain")
  ) {
    return "complaint";
  }
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

// structure-only cues that a line is an instruction
function hasAdviceSignals(text: string): boolean {
  const s = text.toLowerCase();
  const dosage = /\b\d+(\.\d+)?\s?(mg|ml|mcg|g|drops?|tabs?|tablets?|caps?|sachets?)\b/;
  const freq =
    /\b(qd|od|bid|tid|qid|qhs|hs|qod|q\d+h|once daily|twice daily|thrice daily|\d+\s*(x|times)\s*(a|per)\s*day)\b/;
  const duration = /\bfor\s+\d+\s*(day|days|week|weeks|month|months)\b/;
  const route =
    /\b(po|iv|im|sc|topical|oral|intravenous|intramuscular|subcutaneous)\b/;
  const imperative =
    /^(please|kindly)?\s*(take|start|continue|apply|use|drink|avoid|increase|decrease|begin|stop|give|prescribe|rest)\b/;
  return (
    dosage.test(s) ||
    freq.test(s) ||
    duration.test(s) ||
    route.test(s) ||
    imperative.test(s)
  );
}

// soften "advice" when it clearly looks like a noun phrase (no instruction structure)
function softRelabel(predicted: ClassType, text: string): ClassType {
  if (predicted !== "advice") return predicted;
  if (hasAdviceSignals(text)) return predicted;
  const t = text.trim();
  const isShortNP =
    t.split(/\s+/).length <= 6 && /[a-z]/i.test(t) && !/[.?!]$/.test(t);
  return isShortNP ? "complaint" : predicted;
}

/* ------------------------------ Icons ------------------------------ */
function MicSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm7-3a7 7 0 0 1-14 0H3a9 9 0 0 0 18 0h-2zM11 19h2v3h-2z" />
    </svg>
  );
}
