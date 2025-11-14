import { loadUserLoginData } from "./loadUserLogin";
import { loadUserAccessData } from "./loadUserAccess";

export async function authenticate(email: string, password: string) {
  // Load login credentials
  const loginData = await loadUserLoginData();
  const loginUser = loginData.find((u: any) => u.email === email);

  if (!loginUser || loginUser.password !== password) {
    return { ok: false, error: "Invalid credentials" };
  }

  if (loginUser.status !== "active") {
    return { ok: false, error: `Account ${loginUser.status}` };
  }

  // Load full users.json
  const fullData = await loadUserAccessData();
  const user = fullData.users.find((u: any) => u.email === email);

  if (!user) {
    return { ok: false, error: "User not found in mapping database" };
  }

  // Build session payload
  const session = {
    id: user.id,
    email: user.email,
    name: user.name,
    clinicId: user.clinicId,
    status: user.status,
    access: user.access || [], // branch-role list
    legacyRole: user.role, // for backward compatibility
    legacyBranches: user.accessibleBranches || []
  };

  return { ok: true, session };
}
