// app/api/nlp/classify-utterances/route.ts
import { NextRequest } from "next/server";
import { callOpenAIClassify } from "@/lib/openai/client";
import { LruTtlCache, hashFor } from "@/lib/nlp/cache";
import { fallbackClassify } from "@/lib/nlp/fallback/rules";
import { PROMPT_VERSION } from "@/lib/nlp/prompts/classify-utterances";
import { logError, logInfo } from "@/lib/observability/log";

export const runtime = "nodejs"; // important: Node runtime (not edge)

type Label = "complaint" | "advice" | "other";

type Result = {
  text: string;
  label: Label;
  negated: boolean;
  confidence: number;
};

const CACHE = new LruTtlCache<Result[]>(400, 10 * 60 * 1000); // 10 min TTL
const CONFIDENCE_THRESHOLD = 0.7;

export async function POST(req: NextRequest) {
  try {
    const { lang, sentences } = (await req.json()) as {
      lang?: string;
      sentences?: string[];
    };

    if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
      return json(400, { error: "Provide { lang, sentences[] }." });
    }
    const safeLang = (lang || "en-IN").slice(0, 16);

    // SHORT REQUEST LIMITS
    if (sentences.length > 100) {
      return json(413, { error: "Too many sentences (max 100)." });
    }

    // CACHE HIT?
    const key = hashFor(safeLang, sentences.join("\n"));
    const cached = CACHE.get(key);
    if (cached) {
      return json(200, wrapResponse(false, cached));
    }

    // CALL OPENAI
    const res = await callOpenAIClassify(safeLang, sentences);

    // FALLBACK IF NEEDED
    let results: Result[];
    let usedFallback = false;

    if (!res.usedOpenAI || !res.results) {
      usedFallback = true;
      results = fallbackClassify(sentences);
    } else {
      // Thresholding: if any item < threshold, patch using fallback for that item
      const fb = fallbackClassify(sentences);
      results = res.results.map((r, i) => {
        if (typeof r.confidence !== "number" || r.confidence < CONFIDENCE_THRESHOLD) {
          usedFallback = true;
          return fb[i];
        }
        return r;
      });
    }

    CACHE.set(key, results);
    logInfo("classify_ok", {
      count: results.length,
      usedFallback,
      belowThreshold: results.filter((r) => r.confidence < CONFIDENCE_THRESHOLD).length
    });

    return json(200, wrapResponse(usedFallback, results));
  } catch (err) {
    logError("classify_exception", { message: (err as Error)?.message });
    // Fallback on total failure? We can't classify without input here; return 500.
    return json(500, { error: "Internal error" });
  }
}

function wrapResponse(usedFallback: boolean, results: Result[]) {
  return {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    prompt_version: PROMPT_VERSION,
    schema_version: "1.0.0",
    used_fallback: usedFallback,
    results
  };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
