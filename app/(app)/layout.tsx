"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useRef } from "react";
import NextImage from "next/image";
import RoleAwareSidebar, { type Role } from "@/components/shell/RoleAwareSidebar";
import { logout } from "@/lib/auth/logout";
import { Toaster } from "react-hot-toast";

const SIDEBAR_KEY = "aran:sidebarCollapsed";
const HEADER_HEIGHT = 56;

/* ---------- Decode & read role from cookie ---------- */
function base64UrlDecode(str: string): string {
  try {
    const norm =
      str.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((str.length + 3) % 4);
    const bin = atob(norm);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}
function readClientRoleFromCookie(): Role {
  const cookie = typeof document !== "undefined" ? document.cookie : "";
  const part = cookie.split("; ").find((c) => c.startsWith("aran.session="));
  if (!part) return "doctor";
  const raw = part.split("=")[1];
  if (!raw) return "doctor";
  try {
    const obj = JSON.parse(base64UrlDecode(raw));
    const role = obj?.role as Role | undefined;
    return role === "doctor" || role === "staff" || role === "admin"
      ? role
      : "doctor";
  } catch {
    return "doctor";
  }
}

/* ---------- Main shared layout ---------- */
export default function AppShellLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<Role>("doctor");

  useEffect(() => {
    setMounted(true);
    setCollapsed(readCollapsedFromStorage());
    setRole(readClientRoleFromCookie());
  }, []);

  const toggleSidebar = useMemo(
    () => () => {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
        } catch {}
        return next;
      });
    },
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 bg-white h-14 shadow-md">
        <div className="flex items-center gap-2">
          <NextImage
            src="/icons/aranlogo.png"
            alt="ARAN Logo"
            width={28}
            height={28}
            className="w-8 h-8"
          />
          <div className="font-semibold">ARAN</div>
          <div className="h-6 w-px bg-gray-300 mx-2" />
          {mounted && (
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-50"
              title={collapsed ? "Open sidebar" : "Close sidebar"}
              aria-label="Toggle sidebar"
            >
              <NextImage
                src={collapsed ? "/icons/Pushin.png" : "/icons/Pushout.png"}
                alt={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </button>
          )}
        </div>

        {/* Dynamically show role-specific avatar */}
        <ProfileMenu role={role} />
      </header>

      {/* Grid: sidebar + main */}
      <div
        className="flex-1 grid"
        style={{
          gridTemplateColumns: `${collapsed ? "0px" : "150px"} minmax(0,1fr)`,
        }}
      >
        <aside
          className={[
            "relative bg-white transition-all duration-200 overflow-hidden",
            `sticky top-[${HEADER_HEIGHT}px]`,
            "rounded-tr-xl",
            collapsed ? "w-0 p-0 pointer-events-none" : "w-[150px]",
          ].join(" ")}
        >
          {/* 🔹 Role-aware sidebar */}
          <RoleAwareSidebar role={role} />

          {!collapsed && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 h-full w-2 bg-gradient-to-r from-black/5 to-transparent"
            />
          )}
        </aside>

        <main
          className={[
            "min-w-0 transition-[padding] duration-200",
            collapsed ? "pl-0" : "pl-2",
          ].join(" ")}
        >
          {children}
        </main>
      </div>

      {/* Toast renderer */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "green",
            color: "#111",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#fff" },
          },
        }}
      />
    </div>
  );
}

/* ---------- Utilities ---------- */
function readCollapsedFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_KEY);
    return raw === "1";
  } catch {
    return false;
  }
}

/* ---------- Profile menu (unchanged except role-aware avatar) ---------- */
function ProfileMenu({
  role = "doctor",
  name = role === "staff" ? "Clinic Staff" : "Dr. Hira Mardi",
}: {
  role?: Role;
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const menuItems =
    role === "admin"
      ? [
          { label: "Organization Settings", onClick: () => alert("Org Settings") },
          { label: "User Management", onClick: () => alert("User Management") },
          { label: "Help", icon: "❓", onClick: () => alert("Help Section") },
          { label: "Logout", onClick: logout },
        ]
      : [
          { label: "Profile", onClick: () => alert("Open Profile") },
          { label: "Settings", onClick: () => alert("Open Settings") },
          { label: "Help", icon: "❓", onClick: () => alert("Help Section") },
          { label: "Logout", onClick: logout },
        ];

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border hover:bg-gray-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <NextImage
          src={
            role === "staff"
              ? "/icons/staff.png"
              : role === "admin"
              ? "/icons/admin.png"
              : "/icons/doctor.png"
          }
          alt="User Profile"
          width={24}
          height={24}
          className="w-6 h-6 rounded-full"
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg z-50 py-2"
          role="menu"
        >
          <div className="px-4 pb-2">
            <div className="text-sm font-semibold text-gray-900">{name}</div>
          </div>
          <div className="h-px bg-gray-200 mb-2" />
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
