"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthContext, useNotificationContext } from "@/contexts/Support";
import { useRouter } from "@bprogress/next/app";
import { generatePostSlug } from "@/utils/slugify";

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
      return `Bài viết của bạn đã được chuyển đến ${
        data?.new_subforum || "subforum khác"
      }`;
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

const parseLegacyUrlMetadata = (url) => {
  if (!url || typeof url !== "string") {
    return {};
  }

  const topicMatch = url.match(/topics\/(\d+)/i);
  const commentMatch = url.match(/comment-(\d+)/i);

  return {
    topicId: topicMatch?.[1],
    commentId: commentMatch?.[1],
  };
};

const convertToRelativeUrl = (url) => {
  if (!url || typeof url !== "string") {
    return "/";
  }

  // Strip domain if present so router.push works with an internal path
  const relative = url.replace(/^https?:\/\/[^/]+/i, "");
  return relative.startsWith("/") ? relative : `/${relative}`;
};

const buildNotificationTargetUrl = (notification, viewerUsername) => {
  const data = notification?.data || {};
  const legacyMetadata = parseLegacyUrlMetadata(data.url);

  const topicId =
    data.topic_id ??
    data.post_id ??
    data.topicId ??
    data.topic?.id ??
    data.post?.id ??
    legacyMetadata.topicId;

  if (!topicId) {
    return convertToRelativeUrl(data.url);
  }

  const commentId =
    data.comment_id ??
    data.commentId ??
    data.reply_id ??
    data.replyId ??
    data.comment?.id ??
    legacyMetadata.commentId;

  const postTitle =
    data.topic_title ??
    data.post_title ??
    data.title ??
    notification?.subject ??
    "";

  const slug =
    postTitle && typeof postTitle === "string" && postTitle.trim() !== ""
      ? generatePostSlug(topicId, postTitle)
      : String(topicId);

  const isAnonymous =
    data.topic_is_anonymous ??
    data.post_is_anonymous ??
    data.is_anonymous ??
    false;

  const candidateUsernames = [
    data.topic_author_username,
    data.post_author_username,
    data.post_username,
    data.topic_username,
    data.username,
    data.author_username,
    data.author?.username,
    data.topic?.author?.username,
    data.post?.author?.username,
  ].filter((value) => typeof value === "string" && value.trim() !== "");

  let username = candidateUsernames[0];

  if (!username) {
    username = isAnonymous ? "anonymous" : viewerUsername;
  }

  if (!username || typeof username !== "string") {
    username = "anonymous";
  }

  const basePath = `/${username}/posts/${slug}`;
  return commentId ? `${basePath}#comment-${commentId}` : basePath;
};

export default function NotificationItem({ notification }) {
  const { markAsRead, deleteNotification } = useNotificationContext();
  const { currentUser } = useAuthContext();
  const router = useRouter();

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    const targetUrl = buildNotificationTargetUrl(
      notification,
      currentUser?.username
    );

    if (targetUrl) {
      router.push(targetUrl);
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

  // Determine avatar URL
  const getAvatarUrl = () => {
    // System notification (no actor)
    if (!notification.actor) {
      return `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/Admin/avatar`;
    }

    // User notification - use avatar_url if available, otherwise construct from username
    if (notification.actor.avatar_url) {
      return notification.actor.avatar_url;
    }

    // Fallback: construct avatar URL from username
    const username = notification.actor.username;
    if (username) {
      return `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${username}/avatar`;
    }

    return null;
  };

  const avatarUrl = getAvatarUrl();
  const avatarAlt = notification.actor?.username || "Hệ thống";

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
        <AvatarImage src={avatarUrl} alt={avatarAlt} />
        <AvatarFallback></AvatarFallback>
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
