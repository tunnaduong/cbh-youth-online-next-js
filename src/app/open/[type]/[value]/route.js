import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { type, value } = params;
  const decodedValue = decodeURIComponent(value || "");

  let targetPath = "/";

  if (type === "story") {
    targetPath = `/?storyId=${encodeURIComponent(decodedValue)}`;
  } else if (type === "post") {
    targetPath = `/?postSlug=${encodeURIComponent(decodedValue)}`;
  } else if (type === "group") {
    targetPath = `/invite/${encodeURIComponent(decodedValue)}`;
  } else if (type === "quiz") {
    targetPath = `/explore/quiz?shared=${encodeURIComponent(decodedValue)}`;
  } else if (type === "game") {
    targetPath = `/explore/games/${encodeURIComponent(decodedValue)}`;
  }

  return NextResponse.redirect(new URL(targetPath, request.url));
}
