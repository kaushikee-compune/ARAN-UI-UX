"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Browser-safe base64url encoder */
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const USERS = {
    "doctor@example.com": { password: "doc123", role: "doctor" as const },
    "staff@example.com": { password: "staff123", role: "staff" as const },
    "admin@example.com": { password: "admin123", role: "admin" as const },
  };

  function setSessionCookie(payload: any) {
    const value = encodeBase64Url(JSON.stringify(payload));
    document.cookie = `aran.session=${value}; Path=/; SameSite=Lax`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const user = USERS[email as keyof typeof USERS];
    if (!user || user.password !== password) {
      setError("Invalid credentials");
      return;
    }
    setSessionCookie({ id: email, role: user.role, name: email });
    router.push("/");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[--secondary] to-[--tertiary] text-black p-12">
        <div className="text-center space-y-6 max-w-sm">
          <h1 className="text-3xl font-bold tracking-tight">ARAN HMIS</h1>
          <img
            src="/whitelogo.png"
            alt="ARAN HMIS Logo"
            className="mx-auto w-24 h-24 object-contain drop-shadow-lg"
          />
          
          <p className="text-sm text-black/90 leading-relaxed">
            Simplifying digital health records for clinics, doctors, and care
            teams.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm bg-white shadow-lg rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-1">
            Clinic Login
          </h2>
          <p className="text-sm text-center text-gray-500 mb-6">
            Sign in to access your clinic dashboard
          </p>

          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="ui-input w-full mt-1"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
              />
            </div>

            {/* PASSWORD WITH TOGGLE */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  className="ui-input w-full pr-10"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    /* Eye Off Icon */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c1.712 0 3.338-.363 4.793-1.016M9.88 9.88A3 3 0 0114.12 14.12M9.88 9.88L3 3m6.88 6.88L3 3m0 0l6.88 6.88"
                      />
                    </svg>
                  ) : (
                    /* Eye Icon */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.273 4.5 12 4.5c4.727 0 8.577 3.01 9.964 7.178a1.012 1.012 0 010 .644C20.577 16.49 16.727 19.5 12 19.5c-4.727 0-8.577-3.01-9.964-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <div className="text-right mt-1">
                <button
                  type="button"
                  className="text-xs text-[--tertiary] hover:underline"
                  onClick={() => alert('Password recovery flow coming soon')}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="w-full py-2.5 mt-2 rounded-lg font-medium text-black bg-blue-500 hover:bg-[--tertiary] transition-all"
            >
              Login
            </button>
          </form>

          <div className="mt-6 border-t pt-4 text-xs text-gray-500 space-y-1">
            <p>
              <strong>Doctor:</strong> doctor@example.com / doc123
            </p>
            <p>
              <strong>Staff:</strong> staff@example.com / staff123
            </p>
            <p>
              <strong>Admin:</strong> admin@example.com / admin123
            </p>
          </div>
        </div>

        <footer className="mt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} ARAN Care
        </footer>
      </div>
    </div>
  );
}
