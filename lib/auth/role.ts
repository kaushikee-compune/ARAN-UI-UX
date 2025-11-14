// lib/auth/role.ts

/**
 * ARAN Unified Role System
 * Supports:
 *  - Multiple roles per user
 *  - Per-branch roles
 *  - Backward compatibility: session.legacyRole
 */

export type Role = "doctor" | "staff" | "admin";
export const ALL_ROLES: Role[] = ["doctor", "staff", "admin"];

// Type for branch-role mapping
export interface AccessEntry {
  branchId: string;
  role: Role;
}

// Type for the session cookie structure
export interface SessionData {
  id?: string;
  email?: string;
  name?: string;
  clinicId?: string;
  status?: string;

  access?: AccessEntry[];     // NEW multi-role structure
  legacyRole?: Role;          // old-style
  legacyBranches?: string[];  // old-style
}

/**
 * Check if session has a role (any branch)
 */
export function hasAnyRole(session: SessionData | null | undefined, role: Role): boolean {
  if (!session) return false;

  // NEW multi-role structure
  if (Array.isArray(session.access)) {
    if (session.access.some((a: AccessEntry) => a.role === role)) {
      return true;
    }
  }

  // OLD single-role structure
  if (session.legacyRole === role) return true;

  return false;
}

/**
 * Check if session has a role for a specific branch
 */
export function hasRoleForBranch(
  session: SessionData | null | undefined,
  role: Role,
  branchId: string
): boolean {
  if (!session || !branchId) return false;

  if (Array.isArray(session.access)) {
    return session.access.some(
      (a: AccessEntry) => a.role === role && a.branchId === branchId
    );
  }

  return false;
}

/**
 * Check if activeRole cookie matches a specific role
 */
export function isActiveRole(role: Role): boolean {
  if (typeof document === "undefined") return false;

  const cookie = document.cookie
    .split("; ")
    .find((x) => x.startsWith("aran.activeRole="));

  if (!cookie) return false;

  return cookie.split("=")[1] === role;
}

/**
 * Convenience helpers
 */
export function isAdmin(session: SessionData | null | undefined): boolean {
  return hasAnyRole(session, "admin");
}

export function isDoctor(session: SessionData | null | undefined): boolean {
  return hasAnyRole(session, "doctor");
}

export function isStaff(session: SessionData | null | undefined): boolean {
  return hasAnyRole(session, "staff");
}
