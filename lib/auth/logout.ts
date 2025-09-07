// lib/auth/logout.ts
"use client";

/** Clear the session cookie and send to login */
export function logout() {
  // clear cookie
   document.cookie = "aran.session=; Path=/; Max-Age=0; SameSite=Lax";

  // redirect to login
  window.location.href = "/cliniclogin";
}
