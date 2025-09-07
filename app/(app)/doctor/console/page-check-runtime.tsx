"use client"; // must be the very first line

import { useEffect, useState } from "react";

export default function DoctorConsolePage() {
  const [n, setN] = useState(0);

  useEffect(() => {
    setN(1);
  }, []);

  return <div className="p-4">minimal ok: {n}</div>;
}
