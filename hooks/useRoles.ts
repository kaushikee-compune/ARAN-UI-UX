import { useEffect, useState } from "react";

export type RoleItem = {
  id: string;
  name: string;
  category?: string;
  description?: string;
};

export function useRoles() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await fetch("/data/roles.json");
        if (!res.ok) throw new Error("Failed to load roles.json");
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error("Error loading roles:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  return { roles, loading };
}
