"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate } from "@/lib/auth/authenticate";

// Encode session cookie into base64url
function encodeBase64Url(input: string) {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const base64 = btoa(bin);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export default function ClinicLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  function setSessionCookie(sessionObj: any) {
    const value = encodeBase64Url(JSON.stringify(sessionObj));
    document.cookie = `aran.session=${value}; Path=/; SameSite=Lax`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = await authenticate(email, password);

    if (!result.ok || !result.session) {
      setError(result.error || "Login failed");
      return;
    }

    const sessionObj = result.session;
    setSessionCookie(sessionObj);

    const access = sessionObj.access || [];

    if (!access.length) {
      setError("No access permissions found.");
      return;
    }

    /* --------------------------------------------------------------
       AUTO SELECT DEFAULT ROLE (FIRST UNIQUE ROLE)
       Since RolePicker is removed, default = first unique role
    -------------------------------------------------------------- */

    const uniqueRoles = [...new Set(access.map((a: any) => a.role))] as string[];

    const chosenRole = uniqueRoles[0]; // FIRST role
    const chosenBranch =
      access.find((a: any) => a.role === chosenRole)?.branchId ||
      access[0].branchId; // fallback

    // Store the selected role + branch
    document.cookie = `aran.activeRole=${chosenRole}; Path=/`;
    document.cookie = `aran.activeBranch=${chosenBranch}; Path=/`;

    // Redirect based on role
    if (chosenRole === "doctor") router.push("/doctor/console");
    else if (chosenRole === "admin") router.push("/admin");
    else router.push("/staff");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[--secondary] to-[--tertiary] p-12">
        <h1 className="text-3xl font-bold tracking-tight text-black">ARAN HMIS</h1>
        <img src="/whitelogo.png" alt="logo" className="w-24 h-24 mt-4" />
        <p className="text-sm text-black/90 mt-2 text-center max-w-xs">
          Login to access your clinic workspace.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm bg-white shadow-xl rounded-2xl p-8">

          <h2 className="text-xl font-semibold text-center text-gray-800">
            Clinic Login
          </h2>

          {error && (
            <div className="p-2 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="ui-input w-full mt-1"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                className="ui-input w-full mt-1"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="w-full py-2.5 mt-3 rounded-lg bg-blue-500 text-white font-medium">
              Login
            </button>
          </form>
        </div>

        <footer className="mt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} ARAN Care
        </footer>
      </div>
    </div>
  );
}
