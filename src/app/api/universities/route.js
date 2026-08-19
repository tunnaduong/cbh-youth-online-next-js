import { NextResponse } from "next/server";

const CBH_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com") +
  "/v1.0/universities";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  try {
    let url;
    const params = new URLSearchParams();

    if (mode === "options") {
      url = `${CBH_BASE}/options`;
    } else if (mode === "search") {
      url = `${CBH_BASE}/search`;
      const q = searchParams.get("q") ?? "";
      params.set("q", q);
      if (searchParams.get("autocomplete")) params.set("autocomplete", "1");
    } else {
      url = CBH_BASE;
      for (const [k, v] of searchParams.entries()) {
        if (k !== "mode") params.set(k, v);
      }
    }

    const fullUrl = params.toString() ? `${url}?${params}` : url;
    const res = await fetch(fullUrl, {
      ...(mode === "options" ? { next: { revalidate: 86400 } } : { cache: "no-store" }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
