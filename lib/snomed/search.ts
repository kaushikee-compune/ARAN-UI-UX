export async function searchSnomed(term: string, semantictag: string) {
  if (!term) return [];
  const res = await fetch(
    `/api/snomed/search?term=${encodeURIComponent(term)}&semantictag=${semantictag}`
  );
  if (!res.ok) throw new Error("SNOMED search failed");
  return res.json();
}

