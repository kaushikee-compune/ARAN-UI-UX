/* utils/voiceNlp.ts
 * ------------------------------------------------------------
 * Day-1: sentence segmentation + RULE-based classifier
 *   -> labels: "complaint" | "advice" | "other"
 *   -> negation flag
 *   -> optional SNOMED candidate hints (local map)
 *
 * Day-2: hybrid with a trained model (see classifySentenceHybrid)
 * ------------------------------------------------------------
 */

export type SentenceClass = "complaint" | "advice" | "other";

export type SnomedConceptCandidate = {
  code: string;      // SNOMED conceptId, e.g., "21522001"
  display: string;   // Preferred term/FSN
  matchText: string; // exact substring matched in the raw sentence
  start: number;     // char index
  end: number;       // char index (exclusive)
};

export type ClassifiedSentence = {
  text: string;
  label: SentenceClass;
  negated: boolean;
  confidence?: number;                // present when ML used
  concepts?: SnomedConceptCandidate[];// for complaints (optional)
};

/* -------------------------------------------------------------------------- */
/* Lexicons — extend freely                                                   */
/* Keep entries lowercased for normalized matching                            */
/* -------------------------------------------------------------------------- */

// Common symptoms/findings (English + a few Indic/Hinglish)
const COMPLAINT_TOKENS = [
  "pain","ache","fever","pyrexia","cough","cold","sore throat","throat pain",
  "vomiting","nausea","diarrhea","loose motion","giddiness","dizziness","weakness",
  "shortness of breath","breathlessness","dyspnea","burning","itching","pruritus",
  "swelling","edema","bleeding","rash","headache","migraine","chest pain",
  "back pain","abdominal pain","stomach pain","epigastric pain",
  "urinary frequency","frequent urination","dysuria","burning micturition",
  // Indic / Hinglish
  "pet me dard","pet mein dard","bukhar","ulti","jallan","sans phoolna"
];

// Imperative/advice verbs & patterns
const ADVICE_PHRASES = [
  "take","start","continue","stop","avoid","drink","increase","reduce","apply",
  "gargle","rest","exercise","monitor","schedule","use","wear","follow","follow-up",
  "come back","review","consult","do not","don’t","with food","after meals",
  "twice daily","once daily","thrice daily","every 8 hours","for","days","weeks",
  "take plenty of fluids","plenty of fluids"
];

// Negation cues
const NEGATIONS = ["no","not","denies","without","never","nil","none"];

// First-person/symptom narrative cues
const FIRST_PERSON_CUES = [
  "i have","i am having","i'm having","i feel","i'm feeling","i am feeling",
  "since","for ",
];

/* -------------------------------------------------------------------------- */
/* Normalization & helpers                                                    */
/* -------------------------------------------------------------------------- */

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(haystack: string, needles: string[]): boolean {
  return needles.some((p) => haystack.includes(p));
}

function isImperative(raw: string): boolean {
  return (
    /^(please\s+)?(take|start|continue|stop|avoid|drink|apply|use|wear|rest|monitor|increase|reduce|schedule|follow|come)\b/i.test(
      raw
    ) ||
    /\b(you should|you need to|please|kindly)\b/i.test(raw)
  );
}

function hasNegationBeforeSymptom(raw: string): boolean {
  // simple windowed check: negation within next few tokens before a symptom token
  const s = normalize(raw);
  const words = s.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (NEGATIONS.includes(words[i])) {
      const window = words.slice(i + 1, i + 6).join(" ");
      if (containsAny(window, COMPLAINT_TOKENS)) return true;
    }
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/* Sentence segmentation                                                      */
/* -------------------------------------------------------------------------- */

/** Split a transcript into sentences/clauses for per-utterance labeling. */
export function segmentTranscript(text: string): string[] {
  const primary = text
    .split(/(?<=[.!?])\s+/) // split after ., !, ?
    .map((s) => s.trim())
    .filter(Boolean);

  const refined: string[] = [];
  for (const chunk of primary) {
    // further split long clauses on “and/but/then”
    if (chunk.length > 90 && /\b(and|but|then)\b/i.test(chunk)) {
      refined.push(
        ...chunk
          .split(/\b(?:and|but|then)\b/i)
          .map((s) => s.trim())
          .filter(Boolean)
      );
    } else {
      refined.push(chunk);
    }
  }
  return refined;
}

/* -------------------------------------------------------------------------- */
/* Rule-based classifier                                                      */
/* -------------------------------------------------------------------------- */

export function classifyRuleBased(raw: string): ClassifiedSentence {
  const s = normalize(raw);
  const negated = hasNegationBeforeSymptom(raw);

  // Advice first (imperatives, plan language)
  if (isImperative(raw) || containsAny(s, ADVICE_PHRASES)) {
    return { text: raw, label: "advice", negated };
  }

  // Complaint (symptom tokens or first-person narrative)
  const firstPersonSymptom = containsAny(s, FIRST_PERSON_CUES);
  if (firstPersonSymptom || containsAny(s, COMPLAINT_TOKENS)) {
    return { text: raw, label: "complaint", negated };
  }

  return { text: raw, label: "other", negated: false };
}

/* -------------------------------------------------------------------------- */
/* SNOMED candidate extraction (local map; replace with server later)         */
/* -------------------------------------------------------------------------- */

const LOCAL_SNOMED_SYNONYMS: Array<{
  phrase: string;
  code: string;
  display: string;
}> = [
  { phrase: "abdominal pain", code: "21522001", display: "Abdominal pain (finding)" },
  { phrase: "stomach pain",   code: "21522001", display: "Abdominal pain (finding)" },
  { phrase: "headache",       code: "25064002", display: "Headache (finding)" },
  { phrase: "fever",          code: "386661006", display: "Fever (finding)" },
  { phrase: "cough",          code: "49727002", display: "Cough (finding)" },
  { phrase: "sore throat",    code: "162397003", display: "Sore throat symptom (finding)" },
];

export function extractSnomedCandidates(raw: string): SnomedConceptCandidate[] {
  const s = normalize(raw);
  const out: SnomedConceptCandidate[] = [];
  for (const entry of LOCAL_SNOMED_SYNONYMS) {
    const idx = s.indexOf(entry.phrase);
    if (idx >= 0) {
      out.push({
        code: entry.code,
        display: entry.display,
        matchText: raw.substring(idx, idx + entry.phrase.length),
        start: idx,
        end: idx + entry.phrase.length,
      });
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Hybrid classifier: try ML (if supplied) else rules                          */
/* -------------------------------------------------------------------------- */

/** Minimal shape we expect from any trained model instance. */
export type UtteranceModel = {
  /** returns probabilities in label order ["complaint","advice","other"] or null on failure */
  predictProba: (text: string) => Promise<[number, number, number] | null> | [number, number, number] | null;
};

export type HybridOptions = {
  model?: UtteranceModel | null;
  threshold?: number;   // default 0.7
  withSnomed?: boolean; // attach SNOMED candidates for complaints
};

/** Main entry you’ll call from your voice pipeline. */
export async function classifySentenceHybrid(
  raw: string,
  opt: HybridOptions = {}
): Promise<ClassifiedSentence> {
  const threshold = opt.threshold ?? 0.7;

  // 1) Try ML model if present
  if (opt.model && typeof opt.model.predictProba === "function") {
    const probsArrMaybe = await opt.model.predictProba(raw);
    if (probsArrMaybe && Array.isArray(probsArrMaybe)) {
      const labels: SentenceClass[] = ["complaint", "advice", "other"];
      const probsArr: number[] = [
        probsArrMaybe[0] ?? 0,
        probsArrMaybe[1] ?? 0,
        probsArrMaybe[2] ?? 0,
      ];

      // argmax (avoids TS narrowing issues)
      let maxIdx = 0;
      for (let i = 1; i < probsArr.length; i++) {
        if (probsArr[i] > probsArr[maxIdx]) maxIdx = i;
      }
      const max = probsArr[maxIdx];
      const chosenLabel: SentenceClass = labels[maxIdx];

      if (max >= threshold) {
        const negated = hasNegationBeforeSymptom(raw);
        const base: ClassifiedSentence = {
          text: raw,
          label: chosenLabel,
          negated,
          confidence: max,
        };
        if (chosenLabel === "complaint" && opt.withSnomed) {
          base.concepts = extractSnomedCandidates(raw);
        }
        return base;
      }
      // else, fallthrough to rules
    }
  }

  // 2) Fallback to rules
  const ruled = classifyRuleBased(raw);
  if (ruled.label === "complaint" && opt.withSnomed) {
    ruled.concepts = extractSnomedCandidates(raw);
  }
  return ruled;
}
