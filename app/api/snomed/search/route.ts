import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const term = searchParams.get("term") || "";
  const semantictag = searchParams.get("semantictag") || "";
  const state = searchParams.get("state") || "active";
  const returnlimit = searchParams.get("returnlimit") || "10";

  const url = `http://localhost:8080/csnoserv/api/search/search?term=${encodeURIComponent(
    term
  )}&semantictag=${semantictag}&state=${state}&returnlimit=${returnlimit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SNOMED search failed: ${res.statusText}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
