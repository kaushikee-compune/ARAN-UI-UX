export async function loadUserAccessData() {
  const res = await fetch("/data/users.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Cannot load user access data");
  return res.json();
}
