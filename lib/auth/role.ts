// lib/auth/roles.ts
export type Role = "doctor" | "staff" | "admin";

export const ALL_ROLES: Role[] = ["doctor", "staff", "admin"];

export function hasRole(userRole: Role | null | undefined, allowed: Role[]) {
  if (!userRole) return false;
  return allowed.includes(userRole);
}
