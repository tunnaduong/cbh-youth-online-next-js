"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, message as antdMessage } from "antd";
import { Users, Smartphone } from "lucide-react";
import Navbar from "@/components/include/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGroupInvitePreview, joinGroupViaInvite } from "@/app/Api";
import { useAuthContext } from "@/contexts/Support";
import { openDeepLink, isMobileDevice } from "@/lib/deepLink";

const InviteClient = ({ token }) => {
  const router = useRouter();
  const { loggedIn, authLoading } = useAuthContext();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    getGroupInvitePreview(token)
      .then((res) => setPreview(res?.data || res))
      .catch((err) =>
        setError(
          err?.response?.data?.message ||
            "Liên kết mời không hợp lệ hoặc đã hết hạn."
        )
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleJoin = async () => {
    if (authLoading) return;
    if (!loggedIn) {
      router.push(`/login?continue=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }

    setJoining(true);
    try {
      const res = await joinGroupViaInvite(token);
      const conversationId = res?.data?.conversation_id || res?.conversation_id;
      router.push(`/chat?conversation=${conversationId}`);
    } catch (err) {
      antdMessage.error(
        err?.response?.data?.message || "Không thể tham gia nhóm."
      );
    } finally {
      setJoining(false);
    }
  };

  // Opens the app immediately - no web login required first. The mobile app's
  // own invite-link handler (App.js's GroupJoin deep-link target) resolves
  // login and joining itself once it opens, so forcing a web login here
  // would just be a redundant extra step before the app even launches.
  //
  // If we already happen to be logged in on the web (e.g. this tab was open
  // in a logged-in session), join right here too as a best-effort - harmless
  // since joining is idempotent, and it means the membership exists even if
  // the deep link fails to open the app (falls through to the store).
  const handleOpenInApp = () => {
    if (loggedIn) {
      joinGroupViaInvite(token).catch((err) => {
        console.error("Failed to join group before opening app", err);
      });
    }

    openDeepLink("group", token, {
      onFallback: (storeUrl) => {
        window.location.href = storeUrl;
      },
    });
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <div className="mt-[66px] min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Navbar selected={null} />
      <div className="flex justify-center px-4 py-16">
        <div className="w-full max-w-sm bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-700 p-6 text-center">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-10">
              Đang tải...
            </p>
          ) : error || !preview ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
              <Button className="mt-4 w-full" onClick={handleCancel}>
                Về trang chủ
              </Button>
            </>
          ) : (
            <>
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarImage src={preview.avatar_url} alt={preview.name} />
                <AvatarFallback>
                  <Users className="w-8 h-8 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <h1 className="font-semibold text-lg text-gray-900 dark:text-white">
                Bạn đã được mời vào nhóm
              </h1>
              <p className="font-semibold text-xl text-[#319527] dark:text-[#6bcf60] mt-1 truncate">
                {preview.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {preview.member_count} thành viên
              </p>

              {preview.already_member ? (
                <Button
                  type="primary"
                  className="w-full mt-6 bg-[#319527] hover:bg-[#3dbb31]"
                  onClick={() => router.push(`/chat?conversation=${preview.conversation_id}`)}
                >
                  Mở cuộc trò chuyện
                </Button>
              ) : (
                <div className="flex gap-2 mt-6">
                  <Button className="flex-1" onClick={handleCancel} disabled={joining}>
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    className="flex-1 bg-[#319527] hover:bg-[#3dbb31]"
                    loading={joining}
                    onClick={handleJoin}
                  >
                    Tham gia
                  </Button>
                </div>
              )}

              {isMobile && !preview.already_member && (
                <button
                  type="button"
                  onClick={handleOpenInApp}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[#319527]"
                >
                  <Smartphone className="w-4 h-4" /> Tham gia qua ứng dụng
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteClient;
