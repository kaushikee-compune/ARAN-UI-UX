export async function loadUserLoginData() {
  const res = await fetch("/data/userlogin.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Cannot load login data");
  return res.json();
}
