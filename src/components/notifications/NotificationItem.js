"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotificationContext } from "@/contexts/Support";
import { useRouter } from "@bprogress/next/app";

const getNotificationMessage = (notification) => {
  const { type, actor, data } = notification;
  const actorName = actor?.profile_name || actor?.username || "Ai đó";

  switch (type) {
    case "topic_liked":
      return `${actorName} đã thích bài viết của bạn`;
    case "comment_liked":
      return `${actorName} đã thích bình luận của bạn`;
    case "comment_replied":
      return `${actorName} đã trả lời bình luận của bạn`;
    case "topic_commented":
      return `${actorName} đã bình luận bài viết của bạn`;
    case "mentioned":
      return `${actorName} đã nhắc đến bạn`;
    case "topic_pinned":
      return "Bài viết của bạn đã được ghim";
    case "topic_moved":
      return `Bài viết của bạn đã được chuyển đến ${data?.new_subforum || "subforum khác"}`;
    case "topic_closed":
      return "Bài viết của bạn đã bị đóng";
    case "rank_up":
      return `Bạn đã được thăng hạng! ${data?.rank || ""}`;
    case "badge_earned":
      return `Bạn đã nhận được huy hiệu: ${data?.badge_name || "Huy hiệu"}`;
    case "points_earned":
      return `Bạn đã nhận được ${data?.points || 0} điểm`;
    case "content_reported":
      return "Nội dung của bạn đã bị báo cáo";
    case "content_hidden":
      return "Nội dung của bạn đã bị ẩn";
    case "content_deleted":
      return "Nội dung của bạn đã bị xóa";
    case "system_message":
      return data?.message || "Bạn có thông báo mới";
    default:
      return "Bạn có thông báo mới";
  }
};

export default function NotificationItem({ notification }) {
  const { markAsRead, deleteNotification } = useNotificationContext();
  const router = useRouter();

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to the notification URL if available
    if (notification.data?.url) {
      router.push(notification.data.url);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification.id);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  return (
    <div
      className={`group flex items-start gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
        !notification.is_read
          ? "bg-blue-50 dark:bg-blue-900/20"
          : "bg-white dark:bg-gray-900"
      }`}
      onClick={handleClick}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        {notification.actor ? (
          <AvatarImage src={notification.actor.avatar_url} alt={notification.actor.username} />
        ) : (
          <AvatarFallback>Hệ thống</AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100">
          {getNotificationMessage(notification)}
        </p>
        {notification.data?.topic_title && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {notification.data.topic_title}
          </p>
        )}
        {notification.data?.comment_excerpt && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {notification.data.comment_excerpt}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {notification.created_at_human}
        </p>
      </div>
      {!notification.is_read && (
        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
      )}
      <button
        onClick={handleDelete}
        className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}

