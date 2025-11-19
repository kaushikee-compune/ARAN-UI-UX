export async function getDepartmentName(code?: string | null) {
  if (!code) return null;

  try {
    const res = await fetch("/data/department-mapper.json", {
      cache: "no-store",
    });
    const json = await res.json();
    return json[code] || null;
  } catch (e) {
    console.error("Error loading department-mapper.json", e);
    return null;
  }
}
