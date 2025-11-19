// lib/auth/client-session.ts
import type { Role, CurrentUser } from "./session";

/**
 * Client-side session reader.
 * Safe to use in "use client" components.
 */
function base64UrlDecode(str: string): string {
  try {
    const norm =
      str.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((str.length + 3) % 4);
    const bin = atob(norm);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

export function readClientSession(): CurrentUser | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie || "";
  const part = cookie.split("; ").find((c) => c.startsWith("aran.session="));
  if (!part) return null;
  const raw = part.split("=")[1];
  if (!raw) return null;

  try {
    const json = base64UrlDecode(raw);
    const parsed = JSON.parse(json);
    if (!parsed?.id || !(parsed?.legacyRole || parsed?.role)) return null;
    return parsed as CurrentUser;
  } catch {
    return null;
  }
}
