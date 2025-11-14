"use client";

import type { ReactNode } from "react";
import {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import NextImage from "next/image";
import RoleAwareSidebar, { type Role } from "@/components/shell/RoleAwareSidebar";
import { logout } from "@/lib/auth/logout";
import { Toaster } from "react-hot-toast";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import BranchProviderClient from "@/context/BranchProviderClient";
import { useBranch } from "@/context/BranchContext";

const SIDEBAR_KEY = "aran:sidebarCollapsed";
const HEADER_HEIGHT = 56;

/* ---------- Read role from cookie ---------- */
function getActiveRoleFromCookie(): Role {
  if (typeof document === "undefined") return "doctor";
  const raw = document.cookie
    .split("; ")
    .find((x) => x.startsWith("aran.activeRole="));
  const role = raw?.split("=")[1];
  return role === "doctor" || role === "staff" || role === "admin"
    ? role
    : "doctor";
}

/* ----------------------------------------------------------- */
/*          MAIN EXPORTED WRAPPER (fixes refresh bug)          */
/* ----------------------------------------------------------- */

export default function AppShellLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <BranchProviderClient>
      <ThemeProvider>
        <AppShellLayout>{children}</AppShellLayout>
      </ThemeProvider>
    </BranchProviderClient>
  );
}

/* ----------------------------------------------------------- */
/*                     Actual Layout Component                 */
/* ----------------------------------------------------------- */

function AppShellLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<Role>("doctor");

  const { branches, selectedBranch, setSelectedBranch, loading } = useBranch();

  /* ---------- Initial mount ---------- */
  useEffect(() => {
    setMounted(true);
    setCollapsed(readCollapsedFromStorage());
    setRole(getActiveRoleFromCookie());
  }, []);

  /* ---------- Update role when context done loading ---------- */
  useEffect(() => {
    if (!loading) {
      const activeRole = getActiveRoleFromCookie();
      setRole(activeRole);
    }
  }, [loading]);

  /* ---------- Sidebar toggle ---------- */
  const toggleSidebar = useMemo(
    () => () => {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
        } catch {}
        return next;
      });
    },
    []
  );

  /* ---------- Prevent blank dropdown until ready ---------- */
  if (!mounted || loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-gray-500">
        Loading ARAN…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ---------------- Header ---------------- */}
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

          <button
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-50"
            title={collapsed ? "Open sidebar" : "Close sidebar"}
          >
            <NextImage
              src={collapsed ? "/icons/Pushin.png" : "/icons/Pushout.png"}
              alt="Toggle Sidebar"
              width={20}
              height={20}
            />
          </button>
        </div>

        {/* Role + Branch + Profile */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-800 capitalize">
            {role}
          </span>

          {/* ---------------- Branch dropdown ---------------- */}
          {branches.length > 0 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="ui-input text-sm min-w-[140px]"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <ProfileMenu role={role} />
        </div>
      </header>

      {/* ---------------- Sidebar + Main ---------------- */}
      <div
        className="flex-1 grid"
        style={{
          gridTemplateColumns: `${collapsed ? "0px" : "150px"} minmax(0,1fr)`,
        }}
      >
        <aside
          className={[
            "relative bg-white transition-all duration-200 overflow-hidden",
            collapsed ? "w-0 p-0 pointer-events-none" : "w-[150px]",
          ].join(" ")}
        >
          <RoleAwareSidebar role={role} />
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

      <Toaster />
    </div>
  );
}

/* ----------------------------------------------------------- */
/*                        Utils                                */
/* ----------------------------------------------------------- */

function readCollapsedFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

/* ----------------------------------------------------------- */
/*                       Profile Menu                          */
/* ----------------------------------------------------------- */

function ProfileMenu({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative">
      {/* Your existing profile button content */}
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full border hover:bg-gray-50"
      >
        <NextImage
          src={
            role === "staff"
              ? "/icons/nurse.png"
              : role === "admin"
              ? "/icons/administrator.png"
              : "/icons/doctor.png"
          }
          width={24}
          height={24}
          alt="User Avatar"
          className="w-6 h-6"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg z-50 py-2"
        >
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
