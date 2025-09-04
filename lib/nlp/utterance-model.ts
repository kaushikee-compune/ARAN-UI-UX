/* lib/nlp/utterance-model.ts
 * ------------------------------------------------------------
 * Tiny, dependency-free inference for a linear text classifier:
 *  - TF-IDF over fixed vocab (unigrams + optional bigrams)
 *  - weights[class][token] + bias[class]
 * Artifacts are produced offline (e.g., scikit-learn) and loaded as JSON.
 * If you don't load a model, just use the rules in voiceNlp.ts.
 * ------------------------------------------------------------
 */

export type Label = "complaint" | "advice" | "other";

export type Artifacts = {
  version: string;      // e.g., "v1"
  labels: Label[];      // must be exactly ["complaint","advice","other"]
  vocab: string[];      // token list
  idf: number[];        // same length as vocab
  useBigrams?: boolean; // whether bigrams are present in vocab
  weights: number[][];  // [numClasses][vocabSize]
  bias: number[];       // [numClasses]
};

export type UtteranceModelInstance = {
  readonly ready: boolean;
  readonly labels: Label[];
  /** probs in order ["complaint","advice","other"], or null */
  predictProba: (text: string) => [number, number, number] | null;
};

function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const exps = xs.map((x) => Math.exp(x - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => (sum > 0 ? e / sum : 0));
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\p{L}\p{N}\s']/gu, " ") // keep letters/numbers/apostrophes
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeUnigrams(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

function makeBigrams(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    out.push(tokens[i] + " " + tokens[i + 1]);
  }
  return out;
}

/** Build a TF-IDF vector matching the artifacts’ vocab. */
function vectorizeTfIdf(
  text: string,
  vocab: string[],
  idf: number[],
  useBigrams = false
): Float32Array {
  const tokens = tokenizeUnigrams(text);
  const all = useBigrams ? tokens.concat(makeBigrams(tokens)) : tokens;

  const counts = new Map<string, number>();
  for (const t of all) counts.set(t, (counts.get(t) ?? 0) + 1);

  const vec = new Float32Array(vocab.length);
  let total = 0;
  counts.forEach((c) => (total += c));
  if (total === 0) return vec;

  for (let i = 0; i < vocab.length; i++) {
    const term = vocab[i];
    const c = counts.get(term) ?? 0;
    if (c === 0) continue;
    const tf = c / total;
    const w = tf * (idf[i] ?? 1.0);
    vec[i] = w;
  }
  return vec;
}

/** Instantiate a model from artifacts JSON. */
export function createUtteranceModelFromArtifacts(
  art: Artifacts
): UtteranceModelInstance {
  if (!art || !Array.isArray(art.vocab) || !Array.isArray(art.idf)) {
    throw new Error("Invalid artifacts: missing vocab/idf");
  }
  if (!Array.isArray(art.labels) || art.labels.length !== 3) {
    throw new Error("Invalid artifacts: labels must be length 3");
  }
  if (
    !Array.isArray(art.weights) ||
    art.weights.length !== art.labels.length ||
    art.bias.length !== art.labels.length
  ) {
    throw new Error("Invalid artifacts: weights/bias shape mismatch");
  }
  const V = art.vocab.length;
  for (const row of art.weights) {
    if (!row || row.length !== V) {
      throw new Error("Invalid artifacts: each weight row must match vocab size");
    }
  }

  const predictProba = (text: string): [number, number, number] | null => {
    const x = vectorizeTfIdf(text, art.vocab, art.idf, !!art.useBigrams);
    const logits = new Array<number>(art.labels.length).fill(0);
    for (let c = 0; c < art.labels.length; c++) {
      let sum = art.bias[c] ?? 0;
      const w = art.weights[c];
      for (let i = 0; i < x.length; i++) {
        const xi = x[i];
        if (xi !== 0) sum += xi * w[i];
      }
      logits[c] = sum;
    }
    const probs = softmax(logits) as [number, number, number];
    if (probs.some((p) => !isFinite(p))) return null;
    return probs;
  };

  return {
    ready: true,
    labels: art.labels.slice() as Label[],
    predictProba,
  };
}

/** Fetch artifacts JSON and create a model instance. */
export async function loadUtteranceModel(
  src: string
): Promise<UtteranceModelInstance | null> {
  try {
    const res = await fetch(src, { cache: "no-store" });
    if (!res.ok) {
      console.warn("[utterance-model] fetch failed:", res.status, res.statusText);
      return null;
    }
    const art = (await res.json()) as Artifacts;
    return createUtteranceModelFromArtifacts(art);
  } catch (err) {
    console.warn("[utterance-model] load error:", err);
    return null;
  }
}

/** Safe stub when you haven’t loaded a model yet. */
export function createNoopModel(): UtteranceModelInstance {
  return {
    ready: false,
    labels: ["complaint", "advice", "other"],
    predictProba: () => null,
  };
}
