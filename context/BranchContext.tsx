"use client";

import React, { createContext, useContext, useState } from "react";

type BranchContextType = {
  selectedBranch: string;
  setSelectedBranch: (id: string) => void;
};

const BranchContext = createContext<BranchContextType>({
  selectedBranch: "b1",
  setSelectedBranch: () => {},
});

export const BranchProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedBranch, setSelectedBranch] = useState("b1");

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => useContext(BranchContext);
