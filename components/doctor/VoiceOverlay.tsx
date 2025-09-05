// components/doctor/VoiceOverlay.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { segmentTranscript, type SentenceClass } from "@/utils/voiceNlp";


type InsertTarget = "chiefComplaints" | "doctorNote";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (target: InsertTarget, text: string) => void;
};

type UiItem = {
  id: number;
  text: string;
  label: SentenceClass;        // "complaint" | "advice" | "other"
  negated: boolean;
  confidence?: number;
};

export default function VoiceOverlay({ open, onClose, onInsert }: Props) {
  const [supported, recognizerSupported] = useState(false);
  const [recording, setRecording] = useState<"idle" | "listening" | "paused">("idle");
  const [interim, setInterim] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(""); // fallback textarea
  const [lang, setLang] = useState("en-IN");

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const startBtnRef = useRef<HTMLButtonElement | null>(null);
  const recRef = useRef<any>(null);

  // classification preview
  const [nlpBusy, setNlpBusy] = useState(false);
  const [items, setItems] = useState<UiItem[]>([]);

  // prevent duplicate onInsert calls
  const lastAppliedRef = useRef<string>("");

  // ---- Detect Web Speech API
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;
    recognizerSupported(!!SR);
  }, []);

  // ---- Init recognizer on open
  useEffect(() => {
    if (!open) return;
    setError(null);
    setInterim("");
    setFinalTranscript("");
    setItems([]);
    lastAppliedRef.current = "";
    setRecording("idle");

    if (!supported) return;

    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();

    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: any) => {
      let interimText = "";
      let finalText = finalTranscript;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalText += res[0].transcript + " ";
        } else {
          interimText += res[0].transcript;
        }
      }
      setInterim(interimText);
      setFinalTranscript(finalText);
    };

    rec.onerror = (e: any) => {
      setError(e?.error || "Speech recognition error");
      setRecording("idle");
    };

    rec.onend = () => {
      // If ended suddenly during listening, go idle (this will trigger classify)
      setRecording((prev) => (prev === "listening" ? "idle" : prev));
    };

    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
      recRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supported, lang]);

  // ---- Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    startBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ---- Controls
  const start = useCallback(() => {
    if (!supported || !recRef.current) return;
    setError(null);
    setInterim("");
    setFinalTranscript("");
    setItems([]);
    lastAppliedRef.current = "";
    try {
      recRef.current.lang = lang;
      recRef.current.start();
      setRecording("listening");
    } catch {
      setError("Unable to start microphone.");
    }
  }, [supported, lang]);

  const stop = useCallback(() => {
    if (!supported || !recRef.current) return;
    try { recRef.current.stop(); } catch {}
    setRecording("idle"); // will trigger classify
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported || !recRef.current) return;
    try { recRef.current.stop(); setRecording("paused"); } catch {}
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported || !recRef.current) return;
    try { recRef.current.start(); setRecording("listening"); } catch {}
  }, [supported]);

  // ---- Derived text
  const fullText = useMemo(
    () => [finalTranscript.trim(), interim.trim()].filter(Boolean).join(" ") || "",
    [finalTranscript, interim]
  );

  const words = useMemo(() => {
    const txt = (interim || finalTranscript).trim();
    if (!txt) return [];
    return txt.split(/\s+/).slice(-12);
  }, [interim, finalTranscript]);

  // ---- Classify with your backend (OpenAI + fallback)
  useEffect(() => {
    // Only classify when not actively listening (to avoid thrashing mid-speech)
    if (!open) return;
    const sourceText = supported ? fullText : manual;
    const canClassify = !!sourceText.trim() && recording !== "listening";
    if (!canClassify) { setItems([]); return; }

    let cancelled = false;
    setNlpBusy(true);
    const handle = setTimeout(async () => {
      try {
        const sentences = segmentTranscript(sourceText)
          .map((s) => s.trim())
          .filter(Boolean);
        if (sentences.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }

        const res = await fetch("/api/nlp/classify-utterances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang, sentences }),
        });

        if (!res.ok) throw new Error(`NLP API ${res.status}`);
        const data = await res.json();

        const results = (data?.results ?? []) as Array<{
          text: string;
          label: SentenceClass;
          negated?: boolean;
          confidence?: number;
        }>;

        if (cancelled) return;

        let id = 0;
        const mapped: UiItem[] = results.map((r) => ({
          id: id++,
          text: r.text,
          label: r.label,
          negated: !!r.negated,
          confidence: r.confidence,
        }));
        setItems(mapped);
      } catch (e) {
        if (!cancelled) {
          console.warn("[VoiceOverlay] classify error:", e);
          // Soft-fail: keep previous items; do not hard error the overlay
        }
      } finally {
        if (!cancelled) setNlpBusy(false);
      }
    }, 250); // debounce

    return () => { cancelled = true; clearTimeout(handle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fullText, manual, recording, supported, lang]);

  // ---- Auto-apply to DigitalRx (no buttons)
  const bulletJoin = (arr: string[]) =>
    arr.length ? "• " + arr.map((s) => s.trim()).filter(Boolean).join("\n• ") : "";

  useEffect(() => {
    if (!open) return;
    if (nlpBusy) return;
    if (recording === "listening") return; // apply only when paused/idle/typing

    const complaints = items
      .filter((i) => i.label === "complaint")
      .map((i) => (i.negated ? `${i.text} (negated)` : i.text));

    const advice = items
      .filter((i) => i.label === "advice")
      .map((i) => i.text);

    const ccBlob = bulletJoin(complaints);
    const adviceBlob = bulletJoin(advice);

    const fingerprint = JSON.stringify({ ccBlob, adviceBlob });
    if (fingerprint === lastAppliedRef.current) return; // no change

    // Only push non-empty fields; never clear existing form fields implicitly
    if (ccBlob) onInsert("chiefComplaints", ccBlob);
    if (adviceBlob) onInsert("doctorNote", adviceBlob);

    lastAppliedRef.current = fingerprint;
  }, [items, nlpBusy, recording, onInsert, open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Voice overlay"
    >
      <div className="w-[min(900px,94vw)] rounded-xl bg-white shadow-xl border p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold">Voice Scribe</h2>
            <p className="text-xs text-gray-600">
              Dictate notes. We’ll auto-sort into <b>Chief Complaints</b> and <b>Doctor Note</b>.
            </p>
          </div>
          <button
            className="text-xs rounded border px-2 py-1 hover:bg-gray-50"
            onClick={onClose}
            aria-label="Close voice overlay"
          >
            Close
          </button>
        </div>

        {/* Status row */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 text-xs">
            <StatusDot state={recording} />
            <span className="text-gray-700">
              {supported
                ? recording === "listening"
                  ? "Listening…"
                  : recording === "paused"
                  ? "Paused"
                  : "Ready"
                : "Mic transcription not supported (fallback to typing)."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-600">Language</label>
            <select
              className="ui-input text-xs"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Recognition language"
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (India)</option>
              <option value="en-US">English (US)</option>
              <option value="bn-IN">Bengali (India)</option>
              <option value="kn-IN">Kannada (India)</option>
              <option value="ta-IN">Tamil (India)</option>
              <option value="te-IN">Telugu (India)</option>
            </select>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center gap-2">
          {supported ? (
            <>
              <button
                ref={startBtnRef}
                className="px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={start}
                disabled={recording === "listening"}
                aria-disabled={recording === "listening"}
              >
                Start
              </button>
              {recording === "listening" ? (
                <button
                  className="px-3 py-1.5 text-sm rounded-md border bg-amber-500 text-white hover:bg-amber-600"
                  onClick={pause}
                >
                  Pause
                </button>
              ) : recording === "paused" ? (
                <button
                  className="px-3 py-1.5 text-sm rounded-md border bg-sky-600 text-white hover:bg-sky-700"
                  onClick={resume}
                >
                  Resume
                </button>
              ) : null}
              <button
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
                onClick={stop}
              >
                Stop
              </button>
            </>
          ) : null}
        </div>

        {/* Wave words */}
        <div className="mt-3 min-h-[26px]">
          {words.length > 0 && (
            <div className="flex flex-wrap gap-1 text-[11px] text-gray-700">
              {words.map((w, i) => (
                <span key={`${w}-${i}`} className="px-2 py-0.5 rounded-full border bg-gray-50">
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Transcript / Fallback textarea */}
        <div className="mt-3">
          <label className="text-[11px] text-gray-600">Transcript</label>
          {supported ? (
            <textarea
              className="ui-textarea w-full min-h-[140px]"
              value={fullText}
              onChange={() => {}}
              readOnly
            />
          ) : (
            <textarea
              className="ui-textarea w-full min-h-[140px]"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Start typing here…"
            />
          )}
        </div>

        {/* Read-only classification preview (no buttons) */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">Auto-sort Preview</div>
            {nlpBusy && <div className="text-[11px] text-gray-500">Analyzing…</div>}
          </div>

          {items.length === 0 ? (
            <div className="mt-2 text-xs text-gray-500">
              (Dictate or type text to see classified sentences here.)
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-start gap-2 p-2 border rounded-lg bg-white">
                  <span
                    className={[
                      "inline-flex items-center px-2 py-0.5 rounded text-[11px] border",
                      it.label === "complaint"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : it.label === "advice"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-700 border-gray-200",
                    ].join(" ")}
                    title={it.negated ? "Negated" : undefined}
                  >
                    {it.label === "complaint" ? "Complaint" : it.label === "advice" ? "Advice" : "Other"}
                    {typeof it.confidence === "number" ? (
                      <span className="ml-1 opacity-70">({Math.round((it.confidence || 0) * 100)}%)</span>
                    ) : null}
                    {it.negated ? <span className="ml-1">• neg</span> : null}
                  </span>

                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{it.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div className="mt-2 text-xs text-red-600">{String(error || "")}</div>}
      </div>
    </div>
  );
}

function StatusDot({ state }: { state: "idle" | "listening" | "paused" }) {
  const color = state === "listening" ? "#16a34a" : state === "paused" ? "#f59e0b" : "#9ca3af";
  return (
    <span
      aria-hidden
      className="inline-block w-2.5 h-2.5 rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 0 3px ${color}22` }}
    />
  );
}
