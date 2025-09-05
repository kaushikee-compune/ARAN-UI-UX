// lib/openai/client.ts
import schema from "@/lib/nlp/schemas/classify-utterances.json";
import { buildFewShot, buildSystemPrompt } from "@/lib/nlp/prompts/classify-utterances";
import { logInfo, logWarn } from "@/lib/observability/log";

type ResultItem = {
  text: string;
  label: "complaint" | "advice" | "other";
  negated: boolean;
  confidence: number;
};

export async function callOpenAIClassify(
  lang: string,
  sentences: string[]
): Promise<{ usedOpenAI: boolean; results?: ResultItem[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logWarn("missing_api_key");
    return { usedOpenAI: false };
  }

  // You can set OPENAI_MODEL in env; otherwise use a sensible default.
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Build messages
  const system = buildSystemPrompt(lang);
  const fewshot = buildFewShot();

  const userPayload = {
    lang,
    sentences,
    examples: fewshot
  };

  // Responses API with Structured Outputs (JSON Schema)
  const body = {
    model,
    temperature: 0,
    // Newer OpenAI Responses API expects input/messages; using "input" here:
    input: [
      { role: "system", content: [{ type: "text", text: system }] },
      {
        role: "user",
        content: [{ type: "input_text", text: JSON.stringify(userPayload) }]
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "UtteranceClassificationResponse",
        schema,         // imported JSON Schema
        strict: true
      }
    }
  };

  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  const res = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    logWarn("openai_http_error", { status: res.status, statusText: res.statusText });
    return { usedOpenAI: false };
  }

  const data = await res.json();

  // The Responses API returns the JSON object in data.output[0].content[0].* (varies by SDK).
  // To be robust, try a couple of paths:
  const parsed =
    data?.output?.[0]?.content?.[0]?.json ??
    data?.response?.output?.[0]?.content?.[0]?.json ??
    data?.output?.[0]?.content?.[0]?.text && safeParse(data.output[0].content[0].text);

  const results: ResultItem[] | undefined = parsed?.results;
  if (!Array.isArray(results)) {
    logWarn("openai_no_results");
    return { usedOpenAI: false };
  }

  // Clip/guard confidence values
  results.forEach((r) => {
    if (typeof r.confidence !== "number" || !isFinite(r.confidence)) r.confidence = 0.5;
    if (r.confidence < 0) r.confidence = 0;
    if (r.confidence > 1) r.confidence = 1;
  });

  logInfo("openai_ok", { count: results.length, model });

  return { usedOpenAI: true, results };
}

function safeParse(s: string | undefined) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
