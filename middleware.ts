// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Decode base64url JSON from cookie (Edge-safe) */
function decodeBase64UrlJSON<T = any>(input: string | undefined | null): T | null {
  if (!input) return null;
  try {
    const norm = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
    // Edge runtime: atob is available
    const bin = atob(norm);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

type Role = "doctor" | "staff" | "admin";
type SessionPayload = { id: string; role: Role; name?: string | null } | null;

function readSession(req: NextRequest): SessionPayload {
  const raw = req.cookies.get("aran.session")?.value;
  return decodeBase64UrlJSON<SessionPayload>(raw);
}

function roleLanding(role: Role): string {
  switch (role) {
    case "doctor":
      return "/doctor/console";
    case "staff":
      return "/doctor/appointments"; // adjust if you add /staff/dashboard
    case "admin":
      return "/admin/overview";      // adjust when admin area exists
    default:
      return "/cliniclogin";
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = readSession(req);

  // 1) Protect all pages under the (app) group
  if (pathname.startsWith("/(app)")) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/cliniclogin";
      if (pathname !== "/(app)") url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    // If you also want to enforce role-based access per sub-tree, add checks here.
    return NextResponse.next();
  }

  // 2) If already logged in, keep user out of /cliniclogin and redirect to role landing
  if (pathname === "/cliniclogin" && session?.role) {
    const url = req.nextUrl.clone();
    url.pathname = roleLanding(session.role);
    return NextResponse.redirect(url);
  }

  // 3) Optional: redirect "/" to role landing (if logged in) or to /cliniclogin (if not)
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = session?.role ? roleLanding(session.role) : "/cliniclogin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Guard the app area and handle "/" and "/cliniclogin"
  matcher: ["/(app)(.*)", "/", "/cliniclogin"],
};
