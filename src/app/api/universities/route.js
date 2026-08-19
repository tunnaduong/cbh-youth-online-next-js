import { NextResponse } from "next/server";

const BASE = "https://hoctap.coccoc.com/composer/university_hub";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  try {
    let url;
    if (mode === "options") {
      url = `${BASE}?offset=all`;
    } else if (mode === "search") {
      const q = searchParams.get("q") ?? "";
      const autocomplete = searchParams.get("autocomplete");
      url = `${BASE}/search?q=${encodeURIComponent(q)}${autocomplete ? "&autocomplete=1" : ""}`;
    } else {
      const params = new URLSearchParams();
      for (const [k, v] of searchParams.entries()) {
        if (k !== "mode") params.set(k, v);
      }
      url = `${BASE}?${params.toString()}`;
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        Referer: "https://hoctap.coccoc.com/tim-truong-dh-cd",
      },
      ...(mode === "options" ? { next: { revalidate: 86400 } } : { cache: "no-store" }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
