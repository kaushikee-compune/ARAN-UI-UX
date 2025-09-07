// lib/auth/session.ts
import { cookies } from "next/headers";
import type { Role } from "./role";

export type CurrentUser = {
  id: string;
  role: Role;
  name?: string | null;
};

/** Safe base64url → JSON string decode for Node/Edge */
function decodeBase64UrlToString(input: string): string {
  const norm = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(norm, "base64").toString("utf8");
  }
  // Edge/runtime fallback
  const binary = atob(norm);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // ✅ await cookies() in Next 15
  const jar = await cookies();
  const raw = jar.get("aran.session")?.value;
  if (!raw) return null;

  try {
    const json = decodeBase64UrlToString(raw);
    const parsed = JSON.parse(json);
    if (!parsed?.id || !parsed?.role) return null;
    return parsed as CurrentUser;
  } catch {
    return null;
  }
}
