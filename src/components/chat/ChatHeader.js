"use client";

import {
  Plus,
  Settings,
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
  onSettings,
  onMinimize,
  onClose,
  onBack,
  isMinimized,
  showNewChatDialog,
}) {
  const isThreadsView = !conversation;

  return (
    <div className="flex items-center justify-between rounded-lg px-4 py-3 bg-white dark:bg-neutral-700">
      {/* Left side - Logo/Icon and Title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showNewChatDialog ? (
          <>
            {/* Back button for new chat dialog */}
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
              Tạo cuộc trò chuyện mới
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
            {/* Avatar for conversation view */}
            {conversation?.participants?.[0]?.avatar_url ? (
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage
                  src={conversation.participants[0].avatar_url}
                  alt={
                    conversation.participants[0].profile_name ||
                    conversation.participants[0].username
                  }
                />
                <AvatarFallback>
                  {conversation.participants[0].username?.[0]?.toUpperCase() ||
                    "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-6 h-6 bg-gray-300 dark:bg-neutral-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {conversation?.name?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              {conversation?.type === "group" ? (
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
          <button
            onClick={onNewChat}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors"
            title="Tạo cuộc trò chuyện mới"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        <button
          onClick={onSettings}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors"
          title="Cài đặt"
        >
          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
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
