"use client";

import { useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/Support";

function decodeBase64UrlToJson(base64url) {
  try {
    let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    const jsonStr =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

function AuthCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserToken, setCurrentUser } = useAuthContext();

  const token = searchParams.get("token");
  const userEncoded = searchParams.get("user");
  const returnUrl = searchParams.get("continue");

  const user = useMemo(
    () => (userEncoded ? decodeBase64UrlToJson(userEncoded) : null),
    [userEncoded]
  );

  useEffect(() => {
    if (token && user) {
      setUserToken(token);
      setCurrentUser(user);
      router.replace(returnUrl || "/");
    }
  }, [token, user, router, setUserToken, setCurrentUser, returnUrl]);

  return null;
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={null}>
      <AuthCompleteContent />
    </Suspense>
  );
}
