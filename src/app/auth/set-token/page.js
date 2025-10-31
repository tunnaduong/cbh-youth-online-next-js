"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getCookie(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export default function SetTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const access = searchParams.get("access") || getCookie("auth_token");
    const refresh = searchParams.get("refresh") || getCookie("refresh_token");
    const returnUrl = searchParams.get("return") || "/";

    try {
      if (access) localStorage.setItem("auth_token", access);
      if (refresh) localStorage.setItem("refresh_token", refresh);
    } catch {}

    router.replace(returnUrl);
  }, [router, searchParams]);

  return null;
}


