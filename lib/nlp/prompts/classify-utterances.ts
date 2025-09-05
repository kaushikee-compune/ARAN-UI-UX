// lib/nlp/prompts/classify-utterances.ts
export const PROMPT_VERSION = "v1";

export function buildSystemPrompt(lang: string) {
  // Keep it short and rule-like for determinism
  return [
    "You are a clinical utterance classifier for doctor-patient scribe notes.",
    "Task: For EACH input sentence, return a JSON array item with:",
    "- label ∈ {complaint, advice, other}",
    "- negated (true if sentence expresses absence of a symptom, e.g., 'no fever', 'denies pain')",
    "- confidence ∈ [0,1]",
    "Definitions:",
    "- complaint: patient's symptoms/findings/history (e.g., 'stomach pain', 'I have fever since 2 days').",
    "- advice: clinician advice/instructions/orders (e.g., 'take rest', 'you need antibiotics'). Imperatives/second-person directives are advice.",
    "- other: greetings, questions, small talk, admin info.",
    "Notes:",
    "- Prefer 'advice' for imperatives or 'you should/need to' statements even if symptoms co-occur.",
    "- If sentence contains both symptom narrative and advice, choose the dominant intent.",
    "- negated=true when a symptom/finding is explicitly absent.",
    "- Keep output strictly aligned to the provided JSON schema.",
    `Language hint: ${lang} (sentences can be English / Hinglish / simple Hindi transliterations).`
  ].join("\n");
}

export function buildFewShot() {
  // Few concise, local-context examples (order matters)
  return [
    { text: "Having fever since 2 days", label: "complaint", negated: false },
    { text: "Fever and stomach ache", label: "complaint", negated: false },
    { text: "Nausea and indigestion", label: "complaint", negated: false },
    { text: "Good morning", label: "other", negated: false },
    { text: "Take rest and have fluids", label: "advice", negated: false },
    { text: "Pet mein dard tha", label: "complaint", negated: false },
    { text: "No chest pain", label: "complaint", negated: true },
    { text: "You need antibiotics", label: "advice", negated: false },
    { text: "Gargle with salt", label: "advice", negated: false },
    {
      text: "I am vomiting since 2 days, taking light diet, also having fever",
      label: "complaint",
      negated: false
    }
  ];
}
