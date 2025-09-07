"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Browser-safe base64url encoder */
function encodeBase64Url(input: string) {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const base64 = btoa(bin);
  // base64 -> base64url (RFC 4648 §5)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export default function ClinicLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Hardcoded demo users
  const USERS = {
    "doctor@example.com": { password: "doc123", role: "doctor" as const },
    "staff@example.com": { password: "staff123", role: "staff" as const },
    "admin@example.com": { password: "admin123", role: "admin" as const },
  };

  function setSessionCookie(payload: any) {
    const value = encodeBase64Url(JSON.stringify(payload));
    // minimal cookie; middleware reads this
    // add `Secure` in production if serving over https
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
    router.push("/"); // middleware will route to role landing
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white shadow rounded-xl p-6 space-y-4">
        <h1 className="text-lg font-semibold text-gray-800">Clinic Login</h1>
        {error && <div className="p-2 text-sm text-red-600 bg-red-50 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email" className="ui-input w-full" required
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password" className="ui-input w-full" required
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800">
            Login
          </button>
        </form>

        <div className="text-xs text-gray-500 mt-3 space-y-1">
          <p><strong>Doctor:</strong> doctor@example.com / doc123</p>
          <p><strong>Staff:</strong> staff@example.com / staff123</p>
          <p><strong>Admin:</strong> admin@example.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
