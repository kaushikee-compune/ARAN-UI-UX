"use client";

import React from "react";
import { BranchProvider } from "./BranchContext";

export default function BranchProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BranchProvider>{children}</BranchProvider>;
}
