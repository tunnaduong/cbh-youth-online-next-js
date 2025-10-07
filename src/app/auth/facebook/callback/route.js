import { NextResponse } from "next/server";
export const runtime = "nodejs";

async function exchangeCodeForAccessToken({ code, clientId, clientSecret, redirectUri }) {
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const res = await fetch(`https://graph.facebook.com/v17.0/oauth/access_token?${params.toString()}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error("Facebook token exchange failed");
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

  const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI;
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const { returnUrl } = fromBase64Url(state || "");

  if (!code) {
    const error = encodeURIComponent("Thiếu mã xác thực từ Facebook");
    return NextResponse.redirect(new URL(`/login?error=${error}`, url.origin));
  }

  if (!clientId || !clientSecret || !redirectUri || !apiBase) {
    const error = encodeURIComponent("Cấu hình OAuth chưa đầy đủ");
    return NextResponse.redirect(new URL(`/login?error=${error}`, url.origin));
  }

  try {
    const tokenData = await exchangeCodeForAccessToken({ code, clientId, clientSecret, redirectUri });
    const accessToken = tokenData.access_token;

    const userInfoRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`
    );
    if (!userInfoRes.ok) throw new Error("Facebook userinfo failed");
    const userInfo = await userInfoRes.json();

    const backendRes = await fetch(`${apiBase}/v1.0/oauth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "facebook",
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
    const error = encodeURIComponent(e.message || "Đăng nhập Facebook thất bại");
    const redirect = new URL(`/login?error=${error}`, url.origin);
    return NextResponse.redirect(redirect.toString());
  }
}
