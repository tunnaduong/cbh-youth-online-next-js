"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddOutline, HelpCircleOutline, Mic } from "react-ionicons";
import { Skeleton, message } from "antd";
import CustomColorButton from "../ui/CustomColorButton";
import { useState, useEffect, useCallback, useRef } from "react";
import CreatePostModal from "../modals/CreatePostModal";
import UploadRecordingModal from "../modals/UploadRecordingModal";
import { useAuthContext, useTopUsersContext } from "@/contexts/Support";
import { useRouter } from "@bprogress/next/app";
import { getCurrentUser } from "@/app/Api";

export default function RightSidebar({ onHandleCreatePost }) {
  const iconSize = "20px";
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Get current URL to determine if we're on recordings page
  const isRecordingsPage = pathname.startsWith("/recordings");

  const { loggedIn, currentUser, refreshUser } = useAuthContext();
  const { topUsers, loading, error, fetchTopUsers } = useTopUsersContext();
  const [userStatus, setUserStatus] = useState({ points: 0, rank: null, loading: false });

  // Calculate sticky top position based on alert visibility
  const stickyTop =
    loggedIn && !currentUser?.email_verified_at
      ? "calc(69px + 24px + 30px)"
      : "calc(69px + 24px)";

  // Fetch current user status (points and rank) directly from DB on mount
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (loggedIn) {
        try {
          setUserStatus(prev => ({ ...prev, loading: true }));
          const response = await getCurrentUser();
          const userData = response?.data || response;
          if (userData) {
            setUserStatus({
              points: userData.total_points || 0,
              rank: userData.rank || null,
              loading: false
            });
          }
        } catch (err) {
          console.error("Failed to fetch user status:", err);
          setUserStatus(prev => ({ ...prev, loading: false }));
        }
      }
    };

    fetchUserStatus();
  }, [loggedIn]);

  const handleCreatePost = useCallback(() => {
    if (!loggedIn) {
      message.error("Bạn cần đăng nhập để tạo cuộc thảo luận");
      router.push(
        "/login?continue=" + encodeURIComponent(window.location.href)
      );
    } else if (!currentUser?.email_verified_at) {
      message.error("Bạn cần xác minh email để tạo cuộc thảo luận");
      return;
    } else {
      isRecordingsPage && message.loading("Cái này ad đang làm nha ^^");
      setOpen(true);
    }
  }, [loggedIn, currentUser, isRecordingsPage, router]);

  // Pass the handleCreatePost function to parent
  useEffect(() => {
    if (onHandleCreatePost) {
      onHandleCreatePost(handleCreatePost);
    }
  }, [onHandleCreatePost, handleCreatePost]);

  return (
    <>
      {isRecordingsPage ? (
        <UploadRecordingModal open={open} onClose={() => setOpen(false)} />
      ) : (
        <CreatePostModal open={open} onClose={() => setOpen(false)} />
      )}

      {/* Right side bar */}
      <div
        className="w-full max-w-[775px] xl:w-[340px] mx-auto !pb-6 xl:p-6"
        id="right-sidebar"
      >
        <div className="sticky" style={{ top: stickyTop }}>
          <CustomColorButton
            bgColor={"#319527"}
            block
            className="text-base text-white font-semibold py-[19px] mb-1.5 hidden xl:flex"
            onClick={handleCreatePost}
          >
            {isRecordingsPage ? (
              <div className="flex items-center gap-x-2">
                <Mic
                  color="#FFFFFF"
                  height={iconSize}
                  width={iconSize}
                  cssClasses="-mr-1"
                />
                Đăng ghi âm mới
              </div>
            ) : (
              <div className="flex items-center gap-x-2">
                <AddOutline
                  color="#FFFFFF"
                  height={iconSize}
                  width={iconSize}
                  cssClasses="-mr-1"
                />
                Tạo cuộc thảo luận
              </div>
            )}
          </CustomColorButton>
          <div className="bg-white dark:!bg-[var(--main-white)] text-sm p-3 xl:mt-4 rounded-xl long-shadow [@media(max-width:800px)]:mx-2.5">
            <div className="flex flex-row items-center justify-between">
              <span className="font-bold text-[#6B6B6B] dark:text-neutral-300 block text-base">
                Xếp hạng thành viên
              </span>
              {/* Assuming this is an internal link, if external keep as <a> */}
              <Link href="/guide/points">
                {" "}
                {/* Changed to Link */}
                <HelpCircleOutline
                  color="#888888"
                  height={iconSize}
                  width={iconSize}
                />
              </Link>
            </div>
            {/* User ranking list - dynamic data from API */}
            {loading ? (
              <div className="space-y-2 pt-2">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="flex flex-row items-center">
                    <Skeleton.Avatar
                      active
                      size={32}
                      className="flex-shrink-0"
                    />
                    <div className="ml-1.5 flex-1">
                      <Skeleton.Input
                        active
                        size="small"
                        style={{ width: "60%", height: 16 }}
                      />
                    </div>
                    <div className="ml-1.5">
                      <Skeleton.Button
                        active
                        size="small"
                        style={{ width: "10%", height: 16 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center py-4">
                <div className="text-red-500 text-sm">Lỗi tải dữ liệu</div>
                <div className="text-gray-400 text-xs mt-1">{error}</div>
                <button
                  onClick={() => fetchTopUsers(true)}
                  className="text-blue-500 text-xs mt-2 hover:underline"
                >
                  Thử lại
                </button>
              </div>
            ) : Array.isArray(topUsers) && topUsers.length > 0 ? (
              topUsers.map((user, index) => (
                <div key={user.uid} className="flex flex-row items-center mt-2">
                  <Link href={`/${user.username}`}>
                    <img
                      src={
                        user.oauth_profile_picture ||
                        `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${user.username}/avatar`
                      }
                      className="w-8 h-8 bg-gray-300 rounded-full border object-cover"
                      alt={`${user.profile_name || user.username} avatar`}
                    />
                  </Link>
                  <Link
                    href={`/${user.username}`}
                    className="ml-1.5 font-semibold flex-1 truncate text-left dark:text-neutral-300"
                  >
                    {user.profile_name || user.username}
                  </Link>
                  <span className="mr-1.5 text-[#C1C1C1]">
                    {user.total_points} điểm
                  </span>
                  <span className="text-green-500 font-bold">#{index + 1}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col justify-center items-center py-4">
                <div className="text-gray-400 text-sm">
                  Không có dữ liệu xếp hạng
                </div>
              </div>
            )}

            {/* Show current user if logged in and they're not already in top users */}
            {loggedIn && currentUser && !loading && (
              <>
                {(!Array.isArray(topUsers) || topUsers.length > 0) && (
                  <hr className="my-2 dark:border-gray-600" />
                )}
                <div className="flex flex-row items-center mt-2">
                  <Link href={`/${currentUser.username}`}>
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${currentUser.username}/avatar`}
                      className="w-8 h-8 bg-gray-300 rounded-full border object-cover"
                      alt={`${currentUser.profile_name || currentUser.username
                        } avatar`}
                    />
                  </Link>
                  <Link
                    href={`/${currentUser.username}`}
                    className="ml-1.5 font-semibold flex-1 truncate text-left dark:text-neutral-300"
                  >
                    Bạn
                  </Link>
                  <span className="mr-1.5 text-[#C1C1C1]">
                    {userStatus.loading ? (
                      <Skeleton.Button active size="small" style={{ width: 40, height: 16 }} />
                    ) : (
                      <>{userStatus.points || 0} điểm</>
                    )}
                  </span>
                  {!userStatus.loading && userStatus.rank && (
                    <span className="text-green-500 font-bold">
                      #{userStatus.rank}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="hidden xl:block">
            <div className="flex flex-row text-sm font-semibold p-3 text-[#BCBCBC] dark:text-neutral-400">
              <div className="flex flex-1 flex-col gap-y-0.5">
                <Link
                  href="/help"
                  className="w-fit hover:text-gray-700 dark:hover:text-white"
                >
                  Hỗ trợ
                </Link>
                <Link
                  href="/contact"
                  className="w-fit hover:text-gray-700 dark:hover:text-white"
                >
                  Liên hệ
                </Link>
                <a
                  href="https://stats.uptimerobot.com/i7pA9rBmTC/798634874"
                  className="w-fit hover:text-gray-700 dark:hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Trạng thái
                </a>
                <Link
                  href="/ads"
                  className="w-fit hover:text-gray-700 dark:hover:text-white"
                >
                  Quảng cáo
                </Link>
              </div>
              <div className="flex flex-1 flex-col ml-5 gap-y-0.5">
                <Link
                  href="/about"
                  className="w-fit hover:text-gray-700 dark:hover:text-white"
                >
                  Giới thiệu
                </Link>
                <Link
                  href="/jobs"
                  className="w-fit hover:text-gray-700 dark:hover:text-white"
                >
                  Việc làm
                </Link>
                <Link
                  href="/policy/terms"
                  className="w-fit hover:text-gray-700 dark:hover:text-white"
                >
                  Điều khoản
                </Link>
                <Link
                  href="/policy/privacy"
                  className="w-fit hover:text-gray-700 dark:hover:text-white"
                >
                  Quyền riêng tư
                </Link>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <a href="https://fatties.vercel.app" target="_blank">
                <img
                  src="/images/from_fatties.png"
                  alt="Fatties Logo"
                  className="h-6 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
