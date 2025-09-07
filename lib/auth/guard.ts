// lib/auth/guard.ts
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import { hasRole, type Role } from "./role";

export async function requireAuth(allowed: Role[] = ["doctor", "staff", "admin"]) {
  const user = await getCurrentUser();
  if (!user) redirect("/cliniclogin");
  if (!hasRole(user.role, allowed)) redirect("/cliniclogin?err=forbidden");
  return user;
}
