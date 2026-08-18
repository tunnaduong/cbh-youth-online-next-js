import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const major = searchParams.get("major");

  if (!city || !major) {
    return NextResponse.json({ error: "city and major are required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://hoctap.coccoc.com/composer/university_hub?city=${city}&major=${major}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
