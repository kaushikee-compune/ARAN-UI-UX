export type BranchDetail = {
  id: string;
  branchName: string;
  address: string;
  phone: string;
  email: string;
  hfrId: string;
  departments: string[];
  timings: string;
  facilities: string[];
};

/**
 * Loads branch details.
 * Uses mock JSON under /public/data/branches/ in dev mode,
 * switches to API in production.
 */
export async function getBranchDetail(branchId: string): Promise<BranchDetail> {
  if (
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
      !process.env.NEXT_PUBLIC_API_URL)
  ) {
    const res = await fetch(`/data/branches/${branchId}.json`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to load branch ${branchId}`);
    return res.json();
  }

  // 🔜 Live API mode
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const res = await fetch(`${apiUrl}/branches/${branchId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load branch ${branchId}`);
  return res.json();
}
