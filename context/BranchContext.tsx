"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SessionData, AccessEntry } from "@/lib/auth/role";

export type Branch = {
  id: string;
  name: string;
  status: string;
};

const DEFAULT_BRANCH_ID = "B001";

type BranchContextType = {
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  branches: Branch[];
  loading: boolean;
};

const BranchContext = createContext<BranchContextType>({
  selectedBranch: DEFAULT_BRANCH_ID,
  setSelectedBranch: () => {},
  branches: [],
  loading: true,
});

/* Utility: read cookie value */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

/* Utility: decode session cookie */
function loadSession(): SessionData | null {
  if (typeof document === "undefined") return null;

  const raw = getCookie("aran.session");
  if (!raw) return null;

  try {
    const decoded = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Session decode failed:", err);
    return null;
  }
}

export const BranchProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedBranch, setSelectedBranch] = useState<string>(DEFAULT_BRANCH_ID);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  /* 
    ⭐ CRUCIAL FIX: Re-run this effect 
    whenever the role cookie changes.
    
    This lets role switching dynamically
    refresh the allowed branches.
  */
  const activeRoleCookie = 
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((c) => c.startsWith("aran.activeRole="))
      : null;

  useEffect(() => {
    async function init() {
      try {
        const session = loadSession();
        if (!session || !session.clinicId) {
          console.warn("No session found → no branches");
          setBranches([]);
          setSelectedBranch(DEFAULT_BRANCH_ID);
          return;
        }

        /* Load USERS + CLINICS from JSON */
        const res = await fetch("/data/users.json?" + Date.now());
        const data = await res.json();

        const clinic = data.clinics.find(
          (c: any) => c.id === session.clinicId
        );
        if (!clinic) throw new Error("Clinic not found for user");

        const clinicBranches: Branch[] = clinic.branches;

        /* Determine active role */
        const activeRole =
          getCookie("aran.activeRole") || session.legacyRole;

        if (!activeRole) {
          console.warn("No activeRole → fallback to all branches");
          setBranches(clinicBranches);
          setSelectedBranch(DEFAULT_BRANCH_ID);
          return;
        }

        /* Determine allowed branches for the role */
        const allowedBranchIds =
          session.access
            ?.filter((a: AccessEntry) => a.role === activeRole)
            .map((a: AccessEntry) => a.branchId) || [];

        /* If exactly one allowed branch → force select it */
        if (allowedBranchIds.length === 1) {
          const onlyBranch = clinicBranches.find(
            (b) => b.id === allowedBranchIds[0]
          );
          setBranches(onlyBranch ? [onlyBranch] : []);
          setSelectedBranch(onlyBranch?.id || DEFAULT_BRANCH_ID);
          return;
        }

        /* Filter visible branches */
        const visibleBranches = clinicBranches.filter((b: Branch) =>
          allowedBranchIds.includes(b.id)
        );

        setBranches(visibleBranches);

        /* Set selected branch from cookie or first allowed */
        const cookieBranch = getCookie("aran.activeBranch");

        if (cookieBranch && allowedBranchIds.includes(cookieBranch)) {
          setSelectedBranch(cookieBranch);
        } else if (visibleBranches.length > 0) {
          setSelectedBranch(visibleBranches[0].id);
        } else {
          setSelectedBranch(DEFAULT_BRANCH_ID);
        }
      } catch (err) {
        console.error("BranchProvider Error:", err);
        setBranches([]);
        setSelectedBranch(DEFAULT_BRANCH_ID);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [activeRoleCookie]); // 🔥 Effect now triggers when role changes

  /* Persist branch to cookie */
  useEffect(() => {
    if (typeof document !== "undefined" && selectedBranch) {
      document.cookie = `aran.activeBranch=${selectedBranch}; Path=/`;
    }
  }, [selectedBranch]);

  const ctx: BranchContextType = {
    selectedBranch,
    setSelectedBranch,
    branches,
    loading,
  };

  return (
    <BranchContext.Provider value={ctx}>{children}</BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);
