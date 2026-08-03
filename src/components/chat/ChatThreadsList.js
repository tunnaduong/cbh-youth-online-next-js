"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatContext } from "@/contexts/Support";
import Image from "next/image";
import moment from "moment";
import "moment/locale/vi";
import { Image as ImageIcon, Video as VideoIcon, FileText } from "lucide-react";

export default function ChatThreadsList({ onSelectConversation }) {
  const { conversations } = useChatContext();

  // Filter out the public chat group "Tán gẫu linh tinh"
  const filteredConversations = conversations.filter(
    (conversation) =>
      !(
        conversation.type === "group" &&
        conversation.name === "Tán gẫu linh tinh"
      )
  );

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      moment.locale("vi");
      return moment(timestamp).fromNow();
    } catch {
      return "";
    }
  };

  const getThreadDisplayName = (conversation) => {
    if (conversation.display_name) {
      return conversation.display_name;
    }
    if (conversation.type === "group" && conversation.name) {
      return conversation.name;
    }
    if (conversation.participants?.[0]) {
      return (
        conversation.participants[0].profile_name ||
        conversation.participants[0].username
      );
    }
    return "Unknown";
  };

  const getThreadAvatar = (conversation) => {
    if (conversation.display_avatar_url) {
      return conversation.display_avatar_url;
    }
    if (conversation.type === "group") {
      // Falls back to the group name's first letter (via AvatarFallback below)
      // when the group has no custom avatar set.
      return conversation.avatar_url || null;
    }
    return conversation.participants?.[0]?.avatar_url;
  };

  const getLatestMessagePreview = (conversation) => {
    if (!conversation.latest_message) return "Không có tin nhắn";

    const { is_myself, type } = conversation.latest_message;

    if (type === "story_reply") {
      const partnerName = getThreadDisplayName(conversation);
      return is_myself
        ? `Bạn đã bình luận về tin của ${partnerName}`
        : `${partnerName} đã bình luận về tin của bạn`;
    }

    if (conversation.latest_message.is_recalled) {
      return (
        <span className="italic text-gray-400">Tin nhắn đã bị thu hồi</span>
      );
    }

    const prefix = is_myself ? "Bạn: " : "";

    if (type === "image") {
      return (
        <span className="inline-flex items-center gap-1">
          {prefix}
          <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
          Hình ảnh
        </span>
      );
    }

    if (type === "video") {
      return (
        <span className="inline-flex items-center gap-1">
          {prefix}
          <VideoIcon className="w-3.5 h-3.5 flex-shrink-0" />
          Video
        </span>
      );
    }

    if (type === "file") {
      const fileName =
        conversation.latest_message.file_name ||
        conversation.latest_message.content ||
        "Tệp đính kèm";
      return (
        <span className="inline-flex items-center gap-1 min-w-0">
          {prefix}
          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{fileName}</span>
        </span>
      );
    }

    const content = conversation.latest_message.content || "";
    const editedSuffix = conversation.latest_message.is_edited ? " (Đã sửa)" : "";
    const truncated = content.length > 50 ? content.substring(0, 50) + "..." : content;

    return prefix + truncated + editedSuffix;
  };

  if (filteredConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Image
          src="/images/sad_frog.png"
          alt="Empty chat"
          width={136}
          height={136}
          className="mb-4"
        />
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Chưa có cuộc trò chuyện nào
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {filteredConversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
          className="flex items-start gap-3 p-3 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors text-left border-b dark:border-neutral-600"
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            {getThreadAvatar(conversation) ? (
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={getThreadAvatar(conversation)}
                  alt={getThreadDisplayName(conversation)}
                />
                <AvatarFallback>
                  {getThreadDisplayName(conversation)?.[0]?.toUpperCase() ||
                    "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 bg-gray-300 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {getThreadDisplayName(conversation)?.[0]?.toUpperCase() ||
                    "?"}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h3 className="font-medium text-sm dark:text-white truncate">
                  {getThreadDisplayName(conversation)}
                </h3>
                {conversation.unread_count > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-[#319527] text-white rounded-full flex-shrink-0">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
              {conversation.latest_message?.created_at && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {formatTimestamp(conversation.latest_message.created_at)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate flex items-center min-w-0">
              {getLatestMessagePreview(conversation)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
