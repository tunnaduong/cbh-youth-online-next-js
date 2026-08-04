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
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatHeader({
  conversation,
  onNewChat,
  onNewGroup,
  onSettings,
  onBackground,
  onMinimize,
  onClose,
  onBack,
  isMinimized,
  showNewChatDialog,
  showNewGroupDialog,
}) {
  const isThreadsView = !conversation;

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
            {/* Avatar for conversation view — a group's own avatar_url, never a
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

              return avatarSrc ? (
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
                <h2 className="font-semibold text-sm dark:text-white truncate">
                  {conversation.display_name}
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
                  <h2 className="font-semibold text-sm dark:text-white truncate">
                    {conversation?.participants?.[0]?.profile_name ||
                      conversation?.participants?.[0]?.username ||
                      "Chat"}
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
        {isThreadsView && (
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
          </>
        )}
        {conversation?.type === "group" && (
          <button
            onClick={onSettings}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors"
            title="Thông tin nhóm"
          >
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        {conversation?.id && (
          <button
            onClick={onBackground}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors"
            title="Đổi hình nền đoạn chat"
          >
            <ImageIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
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
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors"
          title="Đóng"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  );
}
