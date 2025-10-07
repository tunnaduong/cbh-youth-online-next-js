import { NextResponse } from "next/server";
export const runtime = "nodejs";

async function exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri }) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Google token exchange failed");
  return res.json();
}

function fromBase64Url(str) {
  try {
    return JSON.parse(Buffer.from(str, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const { returnUrl } = fromBase64Url(state || "");

  if (!code) {
    const error = encodeURIComponent("Thiếu mã xác thực từ Google");
    return NextResponse.redirect(new URL(`/login?error=${error}`, url.origin));
  }

  if (!clientId || !clientSecret || !redirectUri || !apiBase) {
    const error = encodeURIComponent("Cấu hình OAuth chưa đầy đủ");
    return NextResponse.redirect(new URL(`/login?error=${error}`, url.origin));
  }

  try {
    const tokenData = await exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri });
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoRes.ok) throw new Error("Google userinfo failed");
    const userInfo = await userInfoRes.json();

    // Call backend to obtain app token using Google tokens
    const backendRes = await fetch(`${apiBase}/v1.0/oauth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "google",
        id_token: idToken,
        access_token: accessToken,
        profile: userInfo,
      }),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      throw new Error(`Backend error: ${errText}`);
    }

    const backendData = await backendRes.json();
    const token = backendData.token;
    const user = backendData.user;

    if (!token || !user) {
      throw new Error("Phản hồi từ máy chủ không hợp lệ");
    }

    const redirect = new URL("/auth/complete", url.origin);
    redirect.searchParams.set("token", token);
    redirect.searchParams.set("user", Buffer.from(JSON.stringify(user)).toString("base64url"));
    if (returnUrl) redirect.searchParams.set("continue", returnUrl);

    return NextResponse.redirect(redirect.toString());
  } catch (e) {
    const error = encodeURIComponent(e.message || "Đăng nhập Google thất bại");
    const redirect = new URL(`/login?error=${error}`, url.origin);
    return NextResponse.redirect(redirect.toString());
  }
}
