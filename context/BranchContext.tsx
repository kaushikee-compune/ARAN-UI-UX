"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/* -------------------------------------------------------------------------- */
/*                              Type definitions                              */
/* -------------------------------------------------------------------------- */
export type Branch = {
  id: string;
  branchId?: string; // optional support
  name: string;
  status: string;
};

// Hard default (fallback)
const DEFAULT_BRANCH_ID = "B001";

type BranchContextType = {
  /**
   * Always a *string* BranchId after initialization.
   * Never null once loading=false.
   */
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;

  branches: Branch[];
  loading: boolean;
};

/* -------------------------------------------------------------------------- */
/*                             Default (safe) context                         */
/* -------------------------------------------------------------------------- */
const BranchContext = createContext<BranchContextType>({
  selectedBranch: DEFAULT_BRANCH_ID,
  setSelectedBranch: (_branchId: string) => {},
  branches: [],
  loading: true,
});

/* -------------------------------------------------------------------------- */
/*                              Branch Provider                               */
/* -------------------------------------------------------------------------- */
export const BranchProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    // SSR-safe localStorage read
    if (typeof window !== "undefined") {
      return localStorage.getItem("aran:selectedBranch") || DEFAULT_BRANCH_ID;
    }
    return DEFAULT_BRANCH_ID;
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------------- Persist branch selection ---------------------- */
  useEffect(() => {
    if (typeof window !== "undefined" && selectedBranch) {
      localStorage.setItem("aran:selectedBranch", selectedBranch);
    }
  }, [selectedBranch]);

  /* ---------------------- Load user + clinic + branches ---------------------- */
  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch("/data/users.json");
        if (!res.ok) throw new Error("Failed to load users.json");
        const data = await res.json();

        const currentUser = data.users.find((u: any) => u.role === "admin");
        if (!currentUser) throw new Error("Admin user not found");

        const clinic = data.clinics.find(
          (c: any) => c.id === currentUser.clinicId
        );
        if (!clinic) throw new Error("Clinic not found");

        setBranches(clinic.branches);

        /* ---------------- Ensure selectedBranch is valid ---------------- */
        // 1) If selectedBranch is already in localStorage and valid → accept
        const valid = clinic.branches.some((b: Branch) => b.id === selectedBranch);

        if (valid) {
          // Already valid, no action needed
          return;
        }

        // 2) Else pick user's first accessible branch
        if (currentUser.accessibleBranches.length > 0) {
          const fallbackId = currentUser.accessibleBranches[0];
          setSelectedBranch(fallbackId);
          return;
        }

        // 3) Else fallback to first clinic branch
        if (clinic.branches.length > 0) {
          setSelectedBranch(clinic.branches[0].id);
          return;
        }

        // 4) Final last fallback: DEFAULT_BRANCH_ID
        setSelectedBranch(DEFAULT_BRANCH_ID);
      } catch (err) {
        console.error("BranchContext error:", err);
        // Hard fallback to default branch
        setSelectedBranch(DEFAULT_BRANCH_ID);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  /* ---------------------- Provide consistent types ---------------------- */
 const ctx: BranchContextType = {
  selectedBranch,
  // use the state setter directly – it's already typed as (value: string) => void
  setSelectedBranch,
  branches,
  loading,
};


  return <BranchContext.Provider value={ctx}>{children}</BranchContext.Provider>;
};

/* -------------------------------------------------------------------------- */
/*                                Hook export                                 */
/* -------------------------------------------------------------------------- */
export const useBranch = () => useContext(BranchContext);
