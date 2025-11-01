"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";
import { setAuthCookie } from "@/utils/cookies";
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
    const access = searchParams.get("access") || getCookie("auth_token");
    const refresh = searchParams.get("refresh") || getCookie("refresh_token");
    // Get return URL and ensure it's valid (not null/empty), default to "/"
    const returnParam = searchParams.get("return");
    const returnUrl =
      returnParam && returnParam.trim() !== "" ? returnParam : "/";
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
      try {
        if (access) {
          // sync to context, cookies and localStorage
          setUserToken(access);
          setAuthCookie(access);
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
