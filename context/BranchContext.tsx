"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/* -------------------------------------------------------------------------- */
/*                              Type definitions                              */
/* -------------------------------------------------------------------------- */
export type Branch = {
  id: string;
  name: string;
  status: string;
};

type BranchContextType = {
  selectedBranch: Branch | string | null;
  setSelectedBranch: (branch: Branch | string | null) => void;
  branches: Branch[];
  loading: boolean;
};

/* -------------------------------------------------------------------------- */
/*                             Default (safe) context                         */
/* -------------------------------------------------------------------------- */
const BranchContext = createContext<BranchContextType>({
  selectedBranch: null,
  setSelectedBranch: () => {},
  branches: [],
  loading: true,
});

/* -------------------------------------------------------------------------- */
/*                              Branch Provider                               */
/* -------------------------------------------------------------------------- */
export const BranchProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedBranch, setSelectedBranch] = useState<Branch | string | null>(
    null
  );
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  console.log("[BranchContext] selectedBranch =", selectedBranch);
}, [selectedBranch]);

  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch("/data/users.json");
        if (!res.ok) throw new Error("Failed to load users.json");
        const data = await res.json();

        // Pick the first admin for now (mock login assumption)
        const currentUser = data.users.find((u: any) => u.role === "admin");
        if (!currentUser) throw new Error("Admin user not found");

        const clinic = data.clinics.find(
          (c: any) => c.id === currentUser.clinicId
        );
        if (!clinic) throw new Error("Clinic not found");

        setBranches(clinic.branches);

        // Pick first accessible branch as default
        if (currentUser.accessibleBranches.length > 0) {
          const firstId = currentUser.accessibleBranches[0];
          const found = clinic.branches.find((b: Branch) => b.id === firstId);
          setSelectedBranch(found || firstId);
        }
      } catch (err) {
        console.error("BranchContext error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  return (
    <BranchContext.Provider
      value={{ selectedBranch, setSelectedBranch, branches, loading }}
    >
      {children}
    </BranchContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Hook export                                 */
/* -------------------------------------------------------------------------- */
export const useBranch = () => useContext(BranchContext);
