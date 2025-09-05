// lib/nlp/fallback/rules.ts
import { classifyRuleBased } from "@/utils/voiceNlp";

export type FallbackItem = {
  text: string;
  label: "complaint" | "advice" | "other";
  negated: boolean;
  confidence: number;
};

export function fallbackClassify(sentences: string[]): FallbackItem[] {
  // Simple heuristic for "confidence": stronger patterns → higher value
  return sentences.map((s) => {
    const cls = classifyRuleBased(s);
    let confidence = 0.7;
    if (cls.label === "other") confidence = 0.55;
    if (cls.negated) confidence = Math.min(0.85, confidence + 0.1);
    return {
      text: cls.text,
      label: cls.label,
      negated: cls.negated,
      confidence
    };
  });
}
