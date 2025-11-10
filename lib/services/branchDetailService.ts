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
  workingHours: { dayStart: string; dayEnd: string; openTime: string; closeTime: string }[];
};

export async function getBranchDetail(branchId: string): Promise<BranchDetail> {
  const res = await fetch(`/data/branches/${branchId}.json`);
  if (!res.ok) throw new Error(`Failed to fetch branch detail: ${branchId}`);
  return res.json();
}
