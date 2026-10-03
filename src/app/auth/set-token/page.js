"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import {
  setAuthCookie,
  removeAuthCookie,
  markSessionFromApp,
  isSessionFromApp,
} from "@/utils/cookies";
import { getRequest } from "@/services/api/ApiByAxios";

function getCookie(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function SetTokenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser, setUserToken } = useAuthContext();

  useEffect(() => {
    // `code` comes from the mobile app opening the site in its in-app
    // browser: a single-use code that's swapped for a token below, so the
    // token itself never sits in a URL (and the browser history).
    const handoffCode = searchParams.get("code");
    let access = searchParams.get("access") || getCookie("auth_token");
    const refresh = searchParams.get("refresh") || getCookie("refresh_token");
    // Get return URL and ensure it's valid (not null/empty), default to "/"
    const returnParam = searchParams.get("return");
    // Only same-site paths: absolute URLs and "//evil.example" (or "/\evil",
    // which browsers read the same way) would turn this into an open redirect.
    const returnUrl =
      returnParam && returnParam.startsWith("/") && !/^\/[/\\]/.test(returnParam)
        ? returnParam
        : "/";
    // ?logout=1: the mobile app has no signed-in account any more (signed
    // out, or "add account"), and its browser mustn't stay signed in either.
    // A session the app handed over is revoked on the API too; one the user
    // signed into here themselves only loses its cookie here.
    if (searchParams.get("logout") === "1") {
      (async () => {
        const token = getCookie("auth_token");
        if (token && isSessionFromApp()) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1.0/logout`, {
              method: "POST",
              headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            });
          } catch {}
        }
        removeAuthCookie();
        ["TOKEN", "auth_token", "refresh_token", "CURRENT_USER"].forEach((key) =>
          localStorage.removeItem(key)
        );
        // A full load, so every provider starts over signed out.
        window.location.replace(returnUrl);
      })();
      return;
    }

    const userB64 = getCookie("oauth_user");
    let userObj = null;
    if (userB64) {
      try {
        const json = atob(userB64.replace(/-/g, "+").replace(/_/g, "/"));
        userObj = JSON.parse(json);
      } catch {}
      // clear cookie after reading
      document.cookie =
        "oauth_user=; Max-Age=0; path=/; SameSite=Lax;" +
        (location.protocol === "https:" ? " Secure;" : "");
    }

    (async () => {
      let redeemedFromApp = false;
      try {
        if (handoffCode) {
          // Plain fetch, not the axios instance: a rejected code answers 401,
          // and the axios interceptor treats any 401 as "this browser's token
          // is dead" and signs out whoever is already logged in here.
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/v1.0/web-session/redeem`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({ code: handoffCode }),
              }
            );
            const data = res.ok ? await res.json() : null;
            if (data?.token) {
              // Switching accounts in the app hands over a new session: end
              // the one it handed over before, so it doesn't linger in the
              // devices list. Never touches a session the user signed into
              // themselves.
              const previous = getCookie("auth_token");
              if (previous && previous !== data.token && isSessionFromApp()) {
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1.0/logout`, {
                  method: "POST",
                  headers: { Accept: "application/json", Authorization: `Bearer ${previous}` },
                  keepalive: true,
                }).catch(() => {});
              }
              access = data.token;
              redeemedFromApp = true;
            }
          } catch {
            // Expired/used code: carry on with whatever session the browser
            // already has rather than stranding the user on a blank page.
          }
        }

        if (access) {
          // sync to context, cookies and localStorage
          setUserToken(access);
          setAuthCookie(access);
          if (redeemedFromApp) markSessionFromApp();
          localStorage.setItem("TOKEN", access);
          localStorage.setItem("auth_token", access);
        }
        if (refresh) localStorage.setItem("refresh_token", refresh);

        // Prefer fetching the canonical user payload from API
        let finalUser = userObj;
        try {
          if (access) {
            const res = await getRequest("/v1.0/user");
            if (res?.data) {
              finalUser = res.data;
            }
          }
        } catch {}

        if (finalUser) {
          setCurrentUser(finalUser);
          localStorage.setItem("CURRENT_USER", JSON.stringify(finalUser));
        }
      } catch {}

      router.replace(returnUrl);
    })();
  }, [router, searchParams]);

  return null;
}

export default function SetTokenPage() {
  return (
    <Suspense fallback={null}>
      <SetTokenInner />
    </Suspense>
  );
}
