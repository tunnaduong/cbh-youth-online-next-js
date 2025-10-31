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
  const { returnUrl = "/" } = fromBase64Url(stateParam);

  const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI;

  if (!code) {
    const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
    redirect.cookies.set("oauth_error", "Thiếu mã xác thực từ Facebook", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      maxAge: 60,
    });
    redirect.cookies.set(
      "oauth_debug",
      Buffer.from(
        JSON.stringify({ provider: "facebook", step: "no_code", details: {} })
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
    redirect.cookies.set("oauth_error", "Facebook OAuth chưa được cấu hình", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      maxAge: 60,
    });
    const missing = {
      NEXT_PUBLIC_FACEBOOK_CLIENT_ID: !!clientId,
      NEXT_PUBLIC_FACEBOOK_CLIENT_SECRET: !!clientSecret,
      NEXT_PUBLIC_FACEBOOK_REDIRECT_URI: !!redirectUri,
    };
    redirect.cookies.set(
      "oauth_debug",
      Buffer.from(
        JSON.stringify({
          provider: "facebook",
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
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v17.0/oauth/access_token?${tokenParams.toString()}`,
      { cache: "no-store" }
    );

    if (!tokenRes.ok) {
      const msg = await tokenRes.text();
      console.error("Facebook token error:", msg);
      const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
      redirect.cookies.set(
        "oauth_error",
        "Không lấy được access token Facebook",
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
            provider: "facebook",
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

    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(
        accessToken
      )}`,
      { cache: "no-store" }
    );
    if (!profileRes.ok) {
      const msg = await profileRes.text();
      console.error("Facebook profile error:", msg);
      const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
      redirect.cookies.set(
        "oauth_error",
        "Không lấy được thông tin người dùng Facebook",
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
            provider: "facebook",
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
        provider: "facebook",
        accessToken,
        profile,
      });
    } catch (err) {
      const redirect = NextResponse.redirect(new URL(`/login`, url.origin));
      redirect.cookies.set("oauth_error", "Đăng nhập bằng Facebook thất bại", {
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
            provider: "facebook",
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

    // Optionally redirect via client helper to mirror into localStorage
    const setTokenUrl = new URL("/auth/set-token", url.origin);
    if (appAccessToken) setTokenUrl.searchParams.set("access", appAccessToken);
    if (appRefreshToken)
      setTokenUrl.searchParams.set("refresh", appRefreshToken);
    setTokenUrl.searchParams.set("return", returnUrl);

    // send user via short-lived cookie for client to pick up and set context
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
      "Đăng nhập Facebook gặp lỗi không xác định",
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
          provider: "facebook",
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
