// lib/auth/guard.ts

import { SessionData, hasAnyRole, hasRoleForBranch } from "./role";

/**
 * Get active branch from cookie (client or server)
 */
export function getActiveBranch(cookies?: string): string | null {
  const source =
    cookies ??
    (typeof document !== "undefined" ? document.cookie : "");

  if (!source) return null;

  const match = source
    .split("; ")
    .find((x) => x.startsWith("aran.activeBranch="));

  return match ? match.split("=")[1] : null;
}

/**
 * Get active role from cookie (client or server)
 */
export function getActiveRole(cookies?: string): string | null {
  const source =
    cookies ??
    (typeof document !== "undefined" ? document.cookie : "");

  if (!source) return null;

  const match = source
    .split("; ")
    .find((x) => x.startsWith("aran.activeRole="));

  return match ? match.split("=")[1] : null;
}

/**
 * Require that session exists
 */
export function requireLogin(session: SessionData | null | undefined): boolean {
  return !!(session && session.id);
}

/**
 * Require ANY role (doctor, staff, admin)
 */
export function requireAnyRole(session: SessionData | null | undefined): boolean {
  if (!session) return false;

  return (
    hasAnyRole(session, "doctor") ||
    hasAnyRole(session, "staff") ||
    hasAnyRole(session, "admin")
  );
}

/**
 * Require a specific global role (in any branch)
 */
export function requireRole(
  session: SessionData | null | undefined,
  role: "doctor" | "staff" | "admin"
): boolean {
  return hasAnyRole(session, role);
}

/**
 * Require role for the active branch
 */
export function requireRoleForActiveBranch(
  session: SessionData | null | undefined,
  role: "doctor" | "staff" | "admin",
  cookies?: string
): boolean {
  if (!session) return false;

  const activeBranch = getActiveBranch(cookies);
  if (!activeBranch) return false;

  return hasRoleForBranch(session, role, activeBranch);
}

/**
 * Require the activeRole cookie to match
 */
export function requireActiveRole(
  session: SessionData | null | undefined,
  role: "doctor" | "staff" | "admin",
  cookies?: string
): boolean {
  if (!session) return false;

  const activeRole = getActiveRole(cookies);
  return activeRole === role;
}

/**
 * Require BOTH branch + role match
 */
export function requireBranchAndRole(
  session: SessionData | null | undefined,
  role: "doctor" | "staff" | "admin",
  cookies?: string
): boolean {
  if (!session) return false;

  const activeBranch = getActiveBranch(cookies);
  const activeRole = getActiveRole(cookies);

  if (!activeBranch || !activeRole) return false;
  if (activeRole !== role) return false;

  return hasRoleForBranch(session, role, activeBranch);
}
