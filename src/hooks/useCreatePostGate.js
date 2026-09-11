"use client";

import { useCallback } from "react";
import { message } from "antd";
import { useRouter } from "@bprogress/next/app";
import { useAuthContext } from "@/contexts/Support";

// Wraps "open the post composer" with the checks every entry point needs:
// guests are sent to login, unverified accounts are told to verify first.
export default function useCreatePostGate(openComposer) {
  const router = useRouter();
  const { loggedIn, currentUser } = useAuthContext();

  return useCallback(() => {
    if (!loggedIn) {
      message.error("Bạn cần đăng nhập để tạo cuộc thảo luận");
      router.push("/login?continue=" + encodeURIComponent(window.location.href));
    } else if (!currentUser?.email_verified_at) {
      message.error("Bạn cần xác minh email để tạo cuộc thảo luận");
    } else {
      openComposer();
    }
  }, [loggedIn, currentUser, router, openComposer]);
}
