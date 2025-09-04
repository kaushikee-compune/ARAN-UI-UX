"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  segmentTranscript,
  classifySentenceHybrid,
  type SentenceClass,
  type SnomedConceptCandidate,
} from "@/utils/voiceNlp";
import {
  loadUtteranceModel,
  createNoopModel,
  type UtteranceModelInstance,
} from "@/lib/nlp/utterance-model";

/**
 * VoiceOverlay
 * - Uses Web Speech API; falls back to manual textarea.
 * - Auto-sorts transcript sentences into Complaint / Advice / Other.
 * - Lets the user insert grouped text into target fields.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onInsert: (target: "chiefComplaints" | "doctorNote", text: string) => void
 */
type InsertTarget = "chiefComplaints" | "doctorNote";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (target: InsertTarget, text: string) => void;
};

type UiItem = {
  id: number;
  text: string;
  label: SentenceClass; // "complaint" | "advice" | "other"
  negated: boolean;
  confidence?: number;
  concepts?: SnomedConceptCandidate[];
  include: boolean; // for inserting
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

  // ---- NLP model (optional; rules work even if this stays no-op)
  const modelRef = useRef<UtteranceModelInstance>(createNoopModel());
  const [modelReady, setModelReady] = useState(false);

  // Auto-sort UI state
  const [nlpBusy, setNlpBusy] = useState(false);
  const [items, setItems] = useState<UiItem[]>([]); // editable preview

  // Detect Web Speech API (prefix variants)
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;
    recognizerSupported(!!SR);
  }, []);

  // Load ML model (optional). If not found, rules-only still work.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await loadUtteranceModel("/models/utterance-v1.json");
        if (!mounted) return;
        if (m) {
          modelRef.current = m;
          setModelReady(true);
        } else {
          modelRef.current = createNoopModel();
          setModelReady(false);
        }
      } catch {
        modelRef.current = createNoopModel();
        setModelReady(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Init recognizer when opening
  useEffect(() => {
    if (!open) return;
    setError(null);
    setInterim("");
    setFinalTranscript("");
    setRecording("idle");
    setItems([]); // clear previous NLP preview

    if (!supported) return;

    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();

    rec.lang = lang;           // e.g. "en-IN", "hi-IN"
    rec.continuous = true;     // continuous results
    rec.interimResults = true; // get interim

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
      // If ended suddenly during listening, go idle.
      setRecording((prev) => (prev === "listening" ? "idle" : prev));
    };

    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {}
      recRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supported, lang]);

  // Close on Escape + focus first button on open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    startBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const start = useCallback(() => {
    if (!supported || !recRef.current) return;
    setError(null);
    setInterim("");
    setFinalTranscript("");
    setItems([]); // reset auto-sort
    try {
      recRef.current.lang = lang;
      recRef.current.start();
      setRecording("listening");
    } catch (e) {
      setError("Unable to start microphone.");
    }
  }, [supported, lang]);

  const stop = useCallback(() => {
    if (!supported || !recRef.current) return;
    try {
      recRef.current.stop();
    } catch {}
    setRecording("idle");
  }, [supported]);

  const pause = useCallback(() => {
    // Web Speech API lacks real "pause"; emulate by stop but keep transcript
    if (!supported || !recRef.current) return;
    try {
      recRef.current.stop();
      setRecording("paused");
    } catch {}
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported || !recRef.current) return;
    try {
      recRef.current.start();
      setRecording("listening");
    } catch {}
  }, [supported]);

  // Combined transcript
  const fullText = useMemo(
    () => [finalTranscript.trim(), interim.trim()].filter(Boolean).join(" ") || "",
    [finalTranscript, interim]
  );

  // Small word wave for visual feedback
  const words = useMemo(() => {
    const txt = (interim || finalTranscript).trim();
    if (!txt) return [];
    return txt.split(/\s+/).slice(-12); // last 12 words
  }, [interim, finalTranscript]);

  // -------------------- NLP: classify sentences (debounced) --------------------
  useEffect(() => {
    // Only (re)classify when not actively listening (to avoid thrashing)
    if (!open) return;
    const sourceText = supported ? fullText : manual;
    if (!sourceText.trim()) {
      setItems([]);
      return;
    }
    if (recording === "listening") return;

    let cancelled = false;
    setNlpBusy(true);
    const handle = setTimeout(async () => {
      try {
        const sentences = segmentTranscript(sourceText)
          .map((s) => s.trim())
          .filter(Boolean);

        const results: UiItem[] = [];
        let id = 0;
        for (const s of sentences) {
          const cls = await classifySentenceHybrid(s, {
            model: modelRef.current, // ok even if noop
            threshold: 0.7,
            withSnomed: true,
          });
          if (cancelled) return;
          results.push({
            id: id++,
            text: cls.text,
            label: cls.label,
            negated: cls.negated,
            confidence: cls.confidence,
            concepts: cls.concepts,
            include: cls.label !== "other", // default include complaints/advice; skip "other"
          });
        }
        if (!cancelled) setItems(results);
      } catch (e) {
        if (!cancelled) {
          // do not surface error to the main error bar; keep silent here
          console.warn("[VoiceOverlay] NLP classify error:", e);
        }
      } finally {
        if (!cancelled) setNlpBusy(false);
      }
    }, 250); // debounce

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fullText, manual, recording, supported]);

  // -------------------- Insert helpers --------------------
  const bulletJoin = (arr: string[]) =>
    arr.length ? "• " + arr.map((s) => s.trim()).filter(Boolean).join("\n• ") : "";

  const onInsertComplaints = () => {
    const complaints = items
      .filter((it) => it.include && it.label === "complaint")
      .map((it) => it.text);
    const blob = bulletJoin(complaints);
    if (blob) onInsert("chiefComplaints", blob);
  };

  const onInsertAdvice = () => {
    const advice = items
      .filter((it) => it.include && it.label === "advice")
      .map((it) => it.text);
    const blob = bulletJoin(advice);
    if (blob) onInsert("doctorNote", blob); // mapped to doctorNote prop
  };

  const onInsertBoth = () => {
    onInsertComplaints();
    onInsertAdvice();
  };

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
              Dictate notes. Auto-sort separates <b>Complaints</b> from <b>Advice</b>.
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
            {modelReady ? (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                NLP Model
              </span>
            ) : (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                Rules Only
              </span>
            )}
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
                <span
                  key={`${w}-${i}`}
                  className="px-2 py-0.5 rounded-full border bg-gray-50"
                >
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

        {/* Auto-sort Preview */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">Auto-sort Preview</div>
            {nlpBusy && (
              <div className="text-[11px] text-gray-500">Analyzing…</div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="mt-2 text-xs text-gray-500">
              (Dictate or type text to see classified sentences here.)
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-start gap-2 p-2 border rounded-lg bg-white"
                >
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
                      <span className="ml-1 opacity-70">
                        ({Math.round(it.confidence * 100)}%)
                      </span>
                    ) : null}
                    {it.negated ? <span className="ml-1">• neg</span> : null}
                  </span>

                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{it.text}</div>

                    {/* SNOMED badges for complaints */}
                    {it.label === "complaint" && it.concepts?.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {it.concepts.map((c, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded border bg-violet-50 text-violet-800 border-violet-200"
                            title={c.code}
                          >
                            {c.display}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 text-[11px] text-gray-700">
                      <input
                        type="checkbox"
                        checked={it.include}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((p) =>
                              p.id === it.id ? { ...p, include: e.target.checked } : p
                            )
                          )
                        }
                      />
                      Include
                    </label>

                    {/* Swap Complaint <-> Advice; cycle for Other */}
                    <button
                      className="text-[11px] rounded border px-2 py-1 hover:bg-gray-50"
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((p) =>
                            p.id === it.id
                              ? {
                                  ...p,
                                  label:
                                    p.label === "complaint"
                                      ? "advice"
                                      : p.label === "advice"
                                      ? "complaint"
                                      : "complaint", // other → complaint
                                }
                              : p
                          )
                        )
                      }
                      title="Swap Complaint/Advice"
                    >
                      Swap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Insert actions (Auto) */}
        <div className="mt-3 flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
            onClick={onInsertComplaints}
            disabled={!items.some((i) => i.include && i.label === "complaint")}
          >
            Insert Complaints → Chief Complaints
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
            onClick={onInsertAdvice}
            disabled={!items.some((i) => i.include && i.label === "advice")}
          >
            Insert Advice → Doctor Note
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
            onClick={onInsertBoth}
            disabled={
              !items.some((i) => i.include && (i.label === "complaint" || i.label === "advice"))
            }
          >
            Insert Both
          </button>
          <div className="ml-auto text-xs text-gray-500">
            Tip: You can still use the manual buttons below.
          </div>
        </div>

        {/* Manual Insert (unchanged behavior) */}
        <div className="mt-3 flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
            onClick={() => onInsert("chiefComplaints", supported ? fullText : manual)}
            disabled={!((supported ? fullText : manual).trim())}
          >
            Insert (Raw) → Chief Complaints
          </button>
          <button
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
            onClick={() => onInsert("doctorNote", supported ? fullText : manual)}
            disabled={!((supported ? fullText : manual).trim())}
          >
            Insert (Raw) → Doctor Note
          </button>
          <div className="ml-auto text-xs text-gray-500">
            Press <kbd>Esc</kbd> to close
          </div>
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
