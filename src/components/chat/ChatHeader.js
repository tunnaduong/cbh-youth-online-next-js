"use client";

import {
  Plus,
  Users,
  Settings,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  X,
  Flag,
  LayoutGrid,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarFrameWrap from "@/components/profile/AvatarFrameWrap";
import UserName from "@/components/profile/UserName";
import ReportModal from "@/components/ReportModal";
import { useCallContext } from "@/contexts/Support";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function ChatHeader({
  conversation,
  conversationId,
  onNewChat,
  onNewGroup,
  onSettings,
  onBackground,
  onGallery,
  onMinimize,
  onClose,
  onBack,
  isMinimized,
  showNewChatDialog,
  showNewGroupDialog,
}) {
  const isThreadsView = !conversation;
  const { startCall } = useCallContext();
  const [showReportModal, setShowReportModal] = useState(false);
  const otherParticipant =
    conversation?.type !== "group" ? conversation?.participants?.[0] : null;
  const cid = conversationId || conversation?.id;
  const isGroup = conversation?.type === "group" || Boolean(conversation?.is_group);
  const isAi = Boolean(otherParticipant?.is_ai) || otherParticipant?.role === "ai" || Boolean(otherParticipant?.username?.startsWith("ai_"));
  const canCall = Boolean(cid) && !isGroup && !isAi;

  return (
    <div className="flex items-center justify-between rounded-lg px-4 py-3 bg-white dark:bg-neutral-700">
      {/* Left side - Logo/Icon and Title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showNewChatDialog || showNewGroupDialog ? (
          <>
            {/* Back button for new chat/group dialog */}
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors flex-shrink-0 mr-1"
                title="Quay lại"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <h2 className="font-semibold text-sm dark:text-white flex-1">
              {showNewGroupDialog ? "Tạo nhóm mới" : "Tạo cuộc trò chuyện mới"}
            </h2>
          </>
        ) : isThreadsView ? (
          <>
            <h2 className="font-semibold text-sm dark:text-white truncate">
              Cuộc trò chuyện
            </h2>
          </>
        ) : (
          <>
            {/* Back button */}
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors flex-shrink-0 mr-1"
                title="Quay lại"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            {/* Avatar for conversation view - a group's own avatar_url, never a
                participant's personal photo; display_avatar_url/participant
                avatar only apply to 1-on-1 chats. */}
            {(() => {
              const avatarSrc =
                conversation?.type === "group"
                  ? conversation?.avatar_url
                  : conversation?.display_avatar_url ||
                    conversation?.participants?.[0]?.avatar_url;
              const fallbackLetter =
                conversation?.type === "group"
                  ? conversation?.name?.[0]?.toUpperCase()
                  : conversation?.display_name?.[0]?.toUpperCase() ||
                    conversation?.participants?.[0]?.username?.[0]?.toUpperCase();

              const theme =
                conversation?.type === "group"
                  ? null
                  : conversation?.participants?.[0]?.profile_theme;

              return avatarSrc ? (
                <AvatarFrameWrap theme={theme}>
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage
                    src={avatarSrc}
                    alt={
                      conversation.display_name ||
                      conversation.name ||
                      conversation.participants?.[0]?.profile_name ||
                      conversation.participants?.[0]?.username
                    }
                  />
                  <AvatarFallback>{fallbackLetter || "?"}</AvatarFallback>
                </Avatar>
                </AvatarFrameWrap>
              ) : (
                <div className="w-6 h-6 bg-gray-300 dark:bg-neutral-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {fallbackLetter || "?"}
                  </span>
                </div>
              );
            })()}
            <div className="min-w-0 flex-1">
              {conversation?.display_name ? (
                <h2 className="flex min-w-0 items-center font-semibold text-sm dark:text-white">
                  <UserName
                    name={conversation.display_name}
                    theme={
                      conversation?.type === "group"
                        ? null
                        : conversation?.participants?.[0]?.profile_theme
                    }
                    variant="full"
                  />
                </h2>
              ) : conversation?.type === "group" ? (
                <h2 className="font-semibold text-sm dark:text-white truncate">
                  {conversation?.name || "Chat"}
                </h2>
              ) : conversation?.participants?.[0]?.username ? (
                <Link
                  href={`/${conversation.participants[0].username}`}
                  className="hover:underline"
                >
                  <h2 className="flex min-w-0 items-center font-semibold text-sm dark:text-white">
                    <UserName
                      name={
                        conversation?.participants?.[0]?.profile_name ||
                        conversation?.participants?.[0]?.username ||
                        "Chat"
                      }
                      theme={conversation?.participants?.[0]?.profile_theme}
                      variant="full"
                    />
                  </h2>
                </Link>
              ) : (
                <h2 className="font-semibold text-sm dark:text-white truncate">
                  {conversation?.name ||
                    conversation?.participants?.[0]?.profile_name ||
                    conversation?.participants?.[0]?.username ||
                    "Chat"}
                </h2>
              )}
              {conversation?.type === "group" && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {conversation.participants.length} thành viên
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {isThreadsView ? (
          <>
            <button
              onClick={onNewGroup}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors"
              title="Tạo nhóm mới"
            >
              <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={onNewChat}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors"
              title="Tạo cuộc trò chuyện mới"
            >
              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors"
                title={isMinimized ? "Mở rộng" : "Thu gọn"}
              >
                {isMinimized ? (
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </>
        ) : (
          <>
            {canCall && (
              <>
                <button
                  onClick={() => startCall(cid, "audio", conversation)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors text-primary-600 dark:text-primary-400"
                  title="Gọi thoại"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startCall(cid, "video", conversation)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors text-primary-600 dark:text-primary-400"
                  title="Gọi video"
                >
                  <Video className="w-4 h-4" />
                </button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors text-gray-600 dark:text-gray-300"
                  title="Tùy chọn khác"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 shadow-xl rounded-xl p-1 z-[9999]"
              >
                {conversation?.type === "group" && onSettings && (
                  <DropdownMenuItem
                    onClick={onSettings}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Thông tin nhóm</span>
                  </DropdownMenuItem>
                )}
                {conversation?.type !== "group" && onBackground && (
                  <DropdownMenuItem
                    onClick={onBackground}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span>Đổi hình nền</span>
                  </DropdownMenuItem>
                )}
                {onGallery && (
                  <DropdownMenuItem
                    onClick={onGallery}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200"
                  >
                    <LayoutGrid className="w-4 h-4 text-gray-500" />
                    <span>Bộ sưu tập file</span>
                  </DropdownMenuItem>
                )}
                {conversation?.type !== "group" && otherParticipant?.id && (
                  <DropdownMenuItem
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Báo cáo người dùng</span>
                  </DropdownMenuItem>
                )}
                {(onMinimize || onClose) && (
                  <DropdownMenuSeparator className="my-1 border-t border-gray-100 dark:border-neutral-700" />
                )}
                {onMinimize && (
                  <DropdownMenuItem
                    onClick={onMinimize}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200"
                  >
                    {isMinimized ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                    <span>{isMinimized ? "Mở rộng" : "Thu gọn"}</span>
                  </DropdownMenuItem>
                )}
                {onClose && (
                  <DropdownMenuItem
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                    <span>Đóng</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={otherParticipant?.id}
        title="Báo cáo người dùng"
      />
    </div>
  );
}
