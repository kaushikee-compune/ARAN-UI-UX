"use client";

import { useEffect, useState } from "react";
import { readClientSession } from "./client-session";

/* ---------------------------------------------------------------------------
   Types
--------------------------------------------------------------------------- */
export interface AranAccess {
  branchId: string;
  role: "doctor" | "staff" | "admin";
}

export interface AranSession {
  id: string;               // u1, u2, u3...
  name: string;
  email: string;
  clinicId?: string;
  status?: string;

  access: AranAccess[];
  legacyRole: "doctor" | "staff" | "admin";
  legacyBranches: string[];
}

/* ---------------------------------------------------------------------------
   useAranSession() hook
--------------------------------------------------------------------------- */
export function useAranSession() {
  const [session, setSession] = useState<AranSession | null>(null);

  useEffect(() => {
    const s = readClientSession();
    console.log("readClientSession() returned:", s);
    setSession(s as AranSession);
  }, []);

  const isDoctor = session?.legacyRole === "doctor";
  const isStaff = session?.legacyRole === "staff";
  const isAdmin = session?.legacyRole === "admin";

  const getActiveBranch = () => {
    return (
      session?.access?.[0]?.branchId ??
      session?.legacyBranches?.[0] ??
      null
    );
  };

  const getAllowedBranches = () =>
    session?.access?.map((a) => a.branchId) ??
    session?.legacyBranches ??
    [];

  const getRoleForBranch = (branchId: string) => {
    const row = session?.access?.find((x) => x.branchId === branchId);
    return row?.role ?? session?.legacyRole;
  };

  return {
    session,
    isDoctor,
    isStaff,
    isAdmin,
    getActiveBranch,
    getAllowedBranches,
    getRoleForBranch,
  };
}
