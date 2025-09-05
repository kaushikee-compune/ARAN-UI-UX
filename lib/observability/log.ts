// lib/observability/log.ts
export function logInfo(event: string, meta?: Record<string, unknown>) {
  // Avoid logging PHI/raw text. Keep meta numeric/boolean where possible.
  try {
    console.log(`[nlp] ${event}`, meta ? JSON.stringify(meta) : "");
  } catch {}
}

export function logWarn(event: string, meta?: Record<string, unknown>) {
  try {
    console.warn(`[nlp] ${event}`, meta ? JSON.stringify(meta) : "");
  } catch {}
}

export function logError(event: string, meta?: Record<string, unknown>) {
  try {
    console.error(`[nlp] ${event}`, meta ? JSON.stringify(meta) : "");
  } catch {}
}
