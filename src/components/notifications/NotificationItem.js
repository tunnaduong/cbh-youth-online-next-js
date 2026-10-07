"use client";

import React from "react";
import AvatarFrameWrap from "@/components/profile/AvatarFrameWrap";
import StyledName from "@/components/profile/StyledName";
import NameIcon from "@/components/profile/NameIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthContext, useNotificationContext } from "@/contexts/Support";
import { useRouter } from "@bprogress/next/app";
import { generatePostSlug } from "@/utils/slugify";

// Only these notification types mean the actor authored the anonymous
// content themselves (their own anonymous reply/comment). Voters/likers are
// never anonymous, even when they vote/like someone else's anonymous
// comment/post, so `data.is_anonymous` must not hide them for other types.
const ANONYMOUS_ACTOR_TYPES = ["comment_replied", "topic_commented"];

// Names of the content a moderator warned about / removed (content_type).
const MODERATED_CONTENT_LABELS = {
  topic: "bài viết",
  comment: "bình luận",
  message: "tin nhắn",
  story: "tin",
};

const moderatedLabel = (data) => MODERATED_CONTENT_LABELS[data?.content_type] || "nội dung";
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const isActorAnonymous = (notification) =>
  ANONYMOUS_ACTOR_TYPES.includes(notification?.type) &&
  notification?.data?.is_anonymous === true;

// The message with the actor's name drawn in their name style (plus their
// name icon) when the sentence starts with it; the plain text otherwise.
const renderNotificationMessage = (notification) => {
  const message = getNotificationMessage(notification);
  const actor = notification?.actor;
  const theme = actor?.profile_theme;
  const actorName = actor?.profile_name || actor?.username;

  if (
    !theme ||
    !actorName ||
    isActorAnonymous(notification) ||
    typeof message !== "string" ||
    !message.startsWith(actorName)
  ) {
    return message;
  }

  return (
    <>
      <StyledName theme={theme} variant="compact" className="font-medium">
        {actorName}
      </StyledName>
      <NameIcon theme={theme} />
      {message.slice(actorName.length)}
    </>
  );
};

function getNotificationMessage(notification) {
  const { type, actor, data } = notification;
  const isCommentAnonymous = isActorAnonymous(notification);
  const actorName = isCommentAnonymous
    ? "Người dùng ẩn danh"
    : actor?.profile_name || actor?.username || "Ai đó";

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
    case "message_reacted":
      return `${actorName} đã bày tỏ cảm xúc ${data?.reaction_emoji || "👍"} với tin nhắn của bạn`;
    case "message_replied":
      return `${actorName} đã trả lời tin nhắn của bạn`;
    case "added_to_group":
      return `${actorName} đã thêm bạn vào nhóm ${data?.conversation_name || ""}`;
    case "removed_from_group":
      return `${actorName} đã xóa bạn khỏi nhóm ${data?.conversation_name || ""}`;
    case "group_role_changed":
      if ((data?.role || "") === "owner") {
        return `${actorName} đã chuyển quyền trưởng nhóm ${data?.conversation_name || ""} cho bạn`;
      }
      if ((data?.role || "") === "member") {
        return `${actorName} đã gỡ vai trò phó nhóm của bạn trong nhóm ${data?.conversation_name || ""}`;
      }
      return `${actorName} đã chỉ định bạn làm phó nhóm ${data?.conversation_name || ""}`;
    case "conversation_background_changed":
      return data?.conversation_type === "group"
        ? `${actorName} đã đổi hình nền nhóm ${data?.conversation_name || ""}`
        : `${actorName} đã đổi hình nền cuộc trò chuyện`;
    case "story_reacted":
      return `${actorName} đã bày tỏ cảm xúc về tin của bạn`;
    case "story_replied":
    case "story_commented":
      return `${actorName} đã bình luận về tin của bạn`;
    case "topic_pinned":
      return "Bài viết của bạn đã được ghim";
    case "topic_moved":
      return `Bài viết của bạn đã được chuyển đến ${data?.new_subforum || "subforum khác"
        }`;
    case "topic_closed":
      return "Bài viết của bạn đã bị đóng";
    case "rank_up":
      return `Bạn đã được thăng hạng! ${data?.rank || ""}`;
    case "badge_earned":
      return `Bạn đã nhận được huy hiệu: ${data?.badge_name || "Huy hiệu"}`;
    case "points_earned":
      return `Bạn đã nhận được ${data?.points || 0} điểm`;
    case "points_gifted":
      return `${actorName} đã tặng bạn ${Number(data?.amount || 0).toLocaleString()} điểm${data?.message ? `: "${data.message}"` : ""}`;
    case "study_material_purchased":
      return `${actorName} đã mua tài liệu của bạn (+${data?.price} điểm)`;
    case "study_material_rated":
      return `${actorName} đã đánh giá ${data?.rating}/5 ⭐ cho tài liệu của bạn`;
    case "content_reported":
      return "Nội dung của bạn đã bị báo cáo";
    case "content_hidden":
      return "Nội dung của bạn đã bị ẩn";
    case "content_deleted":
      return data?.content_type
        ? `${capitalize(moderatedLabel(data))} của bạn đã bị xóa vì vi phạm tiêu chuẩn cộng đồng`
        : "Nội dung của bạn đã bị xóa";
    case "content_warning":
      return `Cảnh cáo: ${moderatedLabel(data)} gần đây của bạn có nội dung không phù hợp với tiêu chuẩn cộng đồng. Hãy chỉnh sửa hoặc gỡ bỏ để tránh bị khóa tài khoản.`;
    case "content_pending_review":
      return `${data?.comment_id ? "Bình luận" : "Bài viết"} của bạn đang chờ kiểm duyệt${data?.reason ? `: ${data.reason}` : ""
        }`;
    case "content_approved":
      return `${data?.comment_id ? "Bình luận" : "Bài viết"} của bạn đã được duyệt và hiển thị công khai`;
    case "content_rejected":
      return `${data?.comment_id ? "Bình luận" : "Bài viết"} của bạn không được duyệt${data?.reason ? `: ${data.reason}` : ""
        }`;
    case "moderation_pending":
      return `${data?.content_type === "comment" ? "Bình luận" : "Bài viết"} của @${data?.author_username || "người dùng"
        } đang chờ kiểm duyệt${data?.reason ? `: ${data.reason}` : ""}`;
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

  // A gift lands in the wallet, not on the post it was made from.
  if (notification?.type === "points_gifted") {
    return "/wallet";
  }
  const legacyMetadata = parseLegacyUrlMetadata(data.url);

  const topicId =
    data.topic_id ??
    data.post_id ??
    data.topicId ??
    data.topic?.id ??
    data.post?.id ??
    legacyMetadata.topicId;

  if (data.material_id) {
    return `/explore/study-materials/${data.material_id}`;
  }

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

    // The content is gone, so there is nothing to open.
    if (notification.type === "content_deleted") {
      return;
    }

    if (notification.type === "content_warning") {
      const data = notification.data || {};
      if (data.content_type === "message" && data.conversation_id) {
        const params = new URLSearchParams({ conversation: data.conversation_id });
        if (data.message_id) params.set("message", data.message_id);
        router.push(`/chat?${params.toString()}`);
        return;
      }
      // Stories have no page of their own.
      if (data.content_type === "story") {
        return;
      }
      // Posts and comments fall through to the post / comment URL below.
    }

    if (notification.type === "message_reacted") {
      const data = notification.data || {};
      const conversationId = data.conversation_id;
      const messageId = data.message_id;
      if (conversationId) {
        const params = new URLSearchParams({ conversation: conversationId });
        if (messageId) params.set("message", messageId);
        router.push(`/chat?${params.toString()}`);
        return;
      }
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

  const isCommentAnonymous = isActorAnonymous(notification);

  // Determine avatar URL
  const getAvatarUrl = () => {
    // System notification (no actor)
    if (!notification.actor) {
      return `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/Admin/avatar`;
    }

    // Anonymous comment — hide actor identity
    if (isCommentAnonymous) {
      return null;
    }

    // Actor with no id (legacy anonymous)
    if (!notification.actor.id) {
      return null;
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
  const avatarAlt = isCommentAnonymous
    ? "Người dùng ẩn danh"
    : notification.actor?.username || "Hệ thống";
  const isAnonymous = isCommentAnonymous || (notification.actor && !notification.actor.id);

  return (
    <div
      className={`group flex items-start gap-3 p-3 hover:bg-neutral-700/20 dark:hover:bg-gray-800 cursor-pointer transition-colors ${!notification.is_read
        ? "bg-blue-50 dark:bg-neutral-700/20"
        : "bg-white dark:bg-neutral-700"
        }`}
      onClick={handleClick}
    >
      <AvatarFrameWrap theme={isAnonymous ? null : notification.actor?.profile_theme}>
      <Avatar className={`h-10 w-10 flex-shrink-0 ${isAnonymous ? 'bg-gray-200 dark:bg-gray-700' : ''}`}>
        <AvatarImage src={avatarUrl} alt={avatarAlt} />
        <AvatarFallback className="text-gray-500 dark:text-gray-400">
          {isAnonymous ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            avatarAlt.charAt(0).toUpperCase()
          )}
        </AvatarFallback>
      </Avatar>
      </AvatarFrameWrap>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100">
          {renderNotificationMessage(notification)}
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
        {["content_warning", "content_deleted"].includes(notification.type) && notification.data?.note && (
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-3">
            Ghi chú: {notification.data.note}
          </p>
        )}
        {["content_warning", "content_deleted"].includes(notification.type) && notification.data?.excerpt && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            “{notification.data.excerpt}”
          </p>
        )}
        {notification.type === "message_reacted" && notification.data?.message_content && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {notification.data.message_content}
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
