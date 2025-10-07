import { NextResponse } from "next/server";
export const runtime = "nodejs";

function toBase64Url(obj) {
  try {
    return Buffer.from(JSON.stringify(obj)).toString("base64url");
  } catch {
    return "";
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const continueParam = url.searchParams.get("continue");

  const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    const error = encodeURIComponent("Facebook OAuth chưa được cấu hình");
    return NextResponse.redirect(new URL(`/login?error=${error}`, url.origin));
  }

  const state = toBase64Url({ returnUrl: continueParam || "/" });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "public_profile,email",
    state,
  });

  const authorizeUrl = `https://www.facebook.com/v17.0/dialog/oauth?${params.toString()}`;
  return NextResponse.redirect(authorizeUrl);
}
