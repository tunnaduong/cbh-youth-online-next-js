import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { type, value } = params;
  const decodedValue = decodeURIComponent(value || "");

  let targetPath = "/";

  if (type === "story") {
    targetPath = `/?storyId=${encodeURIComponent(decodedValue)}`;
  } else if (type === "post") {
    targetPath = `/?postSlug=${encodeURIComponent(decodedValue)}`;
  }

  return NextResponse.redirect(new URL(targetPath, request.url));
}
