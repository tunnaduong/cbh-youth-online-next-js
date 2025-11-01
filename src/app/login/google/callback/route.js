import { NextResponse } from "next/server";
import { postServer } from "../../../../utils/serverFetch";

export const runtime = "nodejs";

function fromBase64Url(input) {
  try {
    const json = Buffer.from(input || "", "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const state = fromBase64Url(stateParam);
  // Ensure returnUrl is valid - use "/" if missing or empty
  const returnUrl = state?.returnUrl && state.returnUrl.trim() !== "" ? state.returnUrl : "/";

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  if (!code) {
    const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
    redirect.cookies.set("oauth_error", "Thiếu mã xác thực từ Google", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      maxAge: 60,
    });
    redirect.cookies.set(
      "oauth_debug",
      Buffer.from(
        JSON.stringify({ provider: "google", step: "no_code", details: {} })
      ).toString("base64url"),
      {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60,
      }
    );
    return redirect;
  }

  if (!clientId || !clientSecret || !redirectUri) {
    const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
    redirect.cookies.set("oauth_error", "Google OAuth chưa được cấu hình", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      maxAge: 60,
    });
    const missing = {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: !!clientId,
      GOOGLE_CLIENT_SECRET: !!clientSecret,
      NEXT_PUBLIC_GOOGLE_REDIRECT_URI: !!redirectUri,
    };
    redirect.cookies.set(
      "oauth_debug",
      Buffer.from(
        JSON.stringify({
          provider: "google",
          step: "config_missing",
          details: missing,
        })
      ).toString("base64url"),
      {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60,
      }
    );
    return redirect;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      const msg = await tokenRes.text();
      console.error("Google token error:", msg);
      const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
      redirect.cookies.set(
        "oauth_error",
        "Không lấy được access token Google",
        {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          secure: true,
          maxAge: 60,
        }
      );
      redirect.cookies.set(
        "oauth_debug",
        Buffer.from(
          JSON.stringify({
            provider: "google",
            step: "exchange_code",
            details: { status: tokenRes.status, body: msg?.slice(0, 500) },
          })
        ).toString("base64url"),
        {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          secure: true,
          maxAge: 60,
        }
      );
      return redirect;
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    const idToken = tokenJson.id_token;

    const profileRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );
    if (!profileRes.ok) {
      const msg = await profileRes.text();
      console.error("Google profile error:", msg);
      const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
      redirect.cookies.set(
        "oauth_error",
        "Không lấy được thông tin người dùng Google",
        {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          secure: true,
          maxAge: 60,
        }
      );
      redirect.cookies.set(
        "oauth_debug",
        Buffer.from(
          JSON.stringify({
            provider: "google",
            step: "fetch_profile",
            details: { status: profileRes.status, body: msg?.slice(0, 500) },
          })
        ).toString("base64url"),
        {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          secure: true,
          maxAge: 60,
        }
      );
      return redirect;
    }

    const profile = await profileRes.json();

    // Call cbh-api to login/register with provider
    let apiResponse;
    try {
      apiResponse = await postServer("/v1.0/login/oauth", {
        provider: "google",
        accessToken,
        idToken,
        profile,
      });
    } catch (err) {
      const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
      redirect.cookies.set("oauth_error", "Đăng nhập bằng Google thất bại", {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60,
      });
      redirect.cookies.set(
        "oauth_debug",
        Buffer.from(
          JSON.stringify({
            provider: "google",
            step: "call_api",
            details: { message: err?.message },
          })
        ).toString("base64url"),
        {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          secure: true,
          maxAge: 60,
        }
      );
      return redirect;
    }

    const appAccessToken = apiResponse?.accessToken || apiResponse?.token || "";
    const appRefreshToken = apiResponse?.refreshToken || "";
    const appUser = apiResponse?.user || null;

    // Set non-HttpOnly cookie for SSR reads; localStorage will be set in client step
    const redirect = NextResponse.redirect(new URL(returnUrl, url.origin));
    if (appAccessToken) {
      redirect.cookies.set("auth_token", appAccessToken, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    if (appRefreshToken) {
      redirect.cookies.set("refresh_token", appRefreshToken, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    const setTokenUrl = new URL("/auth/set-token", url.origin);
    if (appAccessToken) setTokenUrl.searchParams.set("access", appAccessToken);
    if (appRefreshToken)
      setTokenUrl.searchParams.set("refresh", appRefreshToken);
    setTokenUrl.searchParams.set("return", returnUrl);

    if (appUser) {
      redirect.cookies.set(
        "oauth_user",
        Buffer.from(JSON.stringify(appUser)).toString("base64url"),
        {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          secure: true,
          maxAge: 60,
        }
      );
    }

    return NextResponse.redirect(setTokenUrl);
  } catch (e) {
    console.error(e);
    const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
    redirect.cookies.set(
      "oauth_error",
      "Đăng nhập Google gặp lỗi không xác định",
      {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60,
      }
    );
    redirect.cookies.set(
      "oauth_debug",
      Buffer.from(
        JSON.stringify({
          provider: "google",
          step: "unknown",
          details: { message: e?.message },
        })
      ).toString("base64url"),
      {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60,
      }
    );
    return redirect;
  }
}
