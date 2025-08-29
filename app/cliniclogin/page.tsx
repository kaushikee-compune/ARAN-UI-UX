"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Test credentials
 * - Doctor (role=doctor → /doctor):
 *     Email:    doctor.tempr.email
 *     Password: Aran@123
 *
 * - Admin/Default (→ /):
 *     Email:    test@tempr.email
 *     Password: Aran@123
 *
 * - OTP (→ /):
 *     Mobile:   9971234567
 *     OTP:      123456
 */

// ---- Minimal role flag for client-side guards (doctor area) ----
const ROLE_STORAGE_KEY = "aran.role";
function setRole(role: "doctor" | null) {
  if (typeof window === "undefined") return;
  if (role) localStorage.setItem(ROLE_STORAGE_KEY, role);
  else localStorage.removeItem(ROLE_STORAGE_KEY);
}

type Mode = "password" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");

  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // OTP state
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error banner
  const [error, setError] = useState<string | null>(null);

  const isPasswordMode = mode === "password";
  const canSubmit = useMemo(() => {
    if (isPasswordMode) {
      return email.trim().length > 0 && password.trim().length > 0;
    }
    return mobile.trim().length === 10 && otp.trim().length > 0;
  }, [isPasswordMode, email, password, mobile, otp]);

  const handleSendOtp = () => {
    setOtpSent(true);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (isPasswordMode) {
      // --- Doctor login path → set role=doctor and land on /doctor ---
      if (email.trim() === "doctor@tempr.email" && password === "Aran@123") {
        setRole("doctor");
        router.push("/doctor/console");
        return;
      }
      // --- Existing admin/default path → clear role and go to / ---
      if (email.trim() === "test@tempr.email" && password === "Aran@123") {
        setRole(null);
        router.push("/");
        return;
      }
      setError("Invalid email or password. Please try again.");
    } else {
      // --- OTP flow unchanged → clear role and go to / ---
      if (mobile.trim() === "9971234567" && otp.trim() === "123456") {
        setRole(null);
        router.push("/");
        return;
      } else {
        setError("Invalid mobile or OTP. Please try again.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(120deg,#f0f2f5_0%,#ffffff_100%)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-10 h-10 rounded-2xl mr-3" style={{ background: "var(--secondary)" }}></div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">ARAN HMIS</h1>
            <p className="text-sm text-gray-600">Sign in to your clinic workspace</p>
          </div>
        </div>

        {/* Card */}
        <div className="ui-card p-5">
          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError(null);
              }}
              className={[
                "ui-chip",
                isPasswordMode ? "text-[--on-secondary]" : "text-gray-800",
              ].join(" ")}
              style={{
                background: isPasswordMode ? "var(--secondary)" : undefined,
                color: isPasswordMode ? "var(--on-secondary)" : undefined,
                borderColor: isPasswordMode ? "var(--secondary)" : undefined,
              }}
              aria-pressed={isPasswordMode}
            >
              <MailIcon className="w-4 h-4" />
              Email + Password
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("otp");
                setError(null);
              }}
              className={[
                "ui-chip",
                !isPasswordMode ? "text-[--on-tertiary]" : "text-gray-800",
              ].join(" ")}
              style={{
                background: !isPasswordMode ? "var(--tertiary)" : undefined,
                color: !isPasswordMode ? "var(--on-tertiary)" : undefined,
                borderColor: !isPasswordMode ? "var(--tertiary)" : undefined,
              }}
              aria-pressed={!isPasswordMode}
            >
              <PhoneIcon className="w-4 h-4" />
              Mobile + OTP
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            {isPasswordMode ? (
              <>
                {/* Email */}
                <label className="block">
                  <span className="block text-xs font-medium text-gray-700 mb-1">Email</span>
                  <div className="relative">
                    <input
                      type="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      className="ui-input pr-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                    <MailIcon className="w-4 h-4 absolute right-3 top-2.5 text-gray-500" />
                  </div>
                </label>

                {/* Password */}
                <label className="block">
                  <span className="block text-xs font-medium text-gray-700 mb-1">Password</span>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      className="ui-input pr-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1.5 rounded-md px-1.5 py-1"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? (
                        <EyeOffIcon className="w-4 h-4 text-gray-600" />
                      ) : (
                        <EyeIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </label>

                {/* Helper note for testers */}
                <div className="text-[11px] text-gray-500">
                  Doctor demo: <span className="font-medium">doctor@tempr.email</span> / <span className="font-medium">Aran@123</span>
                </div>
              </>
            ) : (
              <>
                {/* Mobile */}
                <label className="block">
                  <span className="block text-xs font-medium text-gray-700 mb-1">Mobile Number</span>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile"
                      className="ui-input pr-9"
                      value={mobile}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setMobile(digits);
                      }}
                      required
                    />
                    <PhoneIcon className="w-4 h-4 absolute right-3 top-2.5 text-gray-500" />
                  </div>
                </label>

                {/* OTP */}
                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 mb-1">OTP</span>
                    <button type="button" onClick={handleSendOtp} className="btn-outline text-xs">
                      {otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="6-digit OTP"
                      className="ui-input pr-9"
                      value={otp}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtp(digits);
                      }}
                      required
                    />
                    <KeyIcon className="w-4 h-4 absolute right-3 top-2.5 text-gray-500" />
                  </div>
                  {otpSent && (
                    <div className="mt-1 text-[11px] text-gray-600">
                      For testing, use <span className="font-medium">123456</span>.
                    </div>
                  )}
                </label>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={["btn-primary", (!canSubmit || loading) ? "opacity-60 cursor-not-allowed" : ""].join(" ")}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <LoginIcon className="w-4 h-4" />
                {loading ? "Signing in..." : "Login"}
              </span>
            </button>
          </form>

          {/* Footer helpers */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
            <a href="#" className="hover:text-gray-900">Forgot password?</a>
            <a href="/" className="inline-flex items-center gap-1 hover:text-gray-900">
              <HomeIcon className="w-3.5 h-3.5" />
              Back to dashboard
            </a>
          </div>
        </div>

        {/* Helper note */}
        <div className="mt-4 text-center text-[11px] text-gray-500">
          Tip: Toggle **Material ↔ Skeuomorphism** from the dashboard top bar to compare styles.
        </div>
      </div>
    </div>
  );
}

/* ---------- Inline SVG Icons ---------- */
function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 3h4l1 5-2 1a11 11 0 0 0 5 5l1.1-2.1 5 .9v4a2 2 0 0 1-2 2h-1A16 16 0 0 1 3 7V5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
function KeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7.5" cy="15.5" r="3" />
      <path d="M9.7 13.3 19 4l1 1-2 2 1 1-2 2 1 1-2 2" />
    </svg>
  );
}
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6 0 10 7 10 7a18.8 18.8 0 0 1-4 4" />
      <path d="M9 9a3 3 0 0 1 4.2 4.2" />
      <path d="M6.7 6.7A18.1 18.1 0 0 0 2 12s4 7 10 7a10.9 10.9 0 0 0 5.3-1.4" />
    </svg>
  );
}
function LoginIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" />
      <path d="M15 12H3m0 0 3-3m-3 3 3 3" />
    </svg>
  );
}
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}
