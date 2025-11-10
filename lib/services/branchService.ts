export type Branch = {
  id: string;
  name: string;
  location: string;
};

/**
 * Unified getBranches()
 * Works in both mock (public JSON) and live API modes.
 */
export async function getBranches(): Promise<Branch[]> {
  // ───────────── MOCK MODE (Frontend JSON fetch) ─────────────
  if (
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
      !process.env.NEXT_PUBLIC_API_URL)
  ) {
    const res = await fetch("/data/mock-branches.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load branches: ${res.status}`);
    return res.json();
  }

  // ───────────── LIVE API MODE ─────────────
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const res = await fetch(`${apiUrl}/branches`, { cache: "no-store" });

  if (!res.ok) throw new Error(`Failed to load branches: ${res.status}`);
  return res.json();
}
