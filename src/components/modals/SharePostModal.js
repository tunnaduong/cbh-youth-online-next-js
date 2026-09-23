"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, message as antdMessage } from "antd";
import { X, Link as LinkIcon, Share2, Send, Check } from "lucide-react";
import { useAuthContext, useChatContext } from "@/contexts/Support";
import { sharePostToChat } from "@/app/Api";
import { generatePostSlug } from "@/utils/slugify";
import UserMultiSelect from "@/components/chat/UserMultiSelect";
import SharedPostCard from "@/components/chat/SharedPostCard";

const MAX_TARGETS = 20;

const htmlToExcerpt = (html) => {
  if (!html) return "";
  const text = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 200 ? text.slice(0, 200) + "..." : text;
};

const getThreadDisplayName = (conversation) => {
  if (conversation.display_name) return conversation.display_name;
  if (conversation.type === "group" && conversation.name) return conversation.name;
  if (conversation.participants?.[0]) {
    return (
      conversation.participants[0].profile_name ||
      conversation.participants[0].username
    );
  }
  return "Unknown";
};

const getThreadAvatar = (conversation) =>
  conversation.display_avatar_url ||
  (conversation.type === "group"
    ? conversation.avatar_url
    : conversation.participants?.[0]?.avatar_url);

/**
 * "Chia sẻ bài viết" sheet: pick people/conversations to send the post to as a
 * quick chat message, or hand the link off to the OS/other apps.
 *
 * @param {object} props
 * @param {object} props.post - the topic being shared
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export default function SharePostModal({ post, open, onClose }) {
  const { currentUser } = useAuthContext();
  const { conversations } = useChatContext();
  const [selectedConversationIds, setSelectedConversationIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canUseNativeShare, setCanUseNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setCanUseNativeShare(typeof navigator.share === "function");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedConversationIds([]);
    setSelectedUserIds([]);
    setNote("");
    setCopied(false);
  }, [open]);

  const shareUrl = useMemo(() => {
    if (!post) return "";
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://chuyenbienhoa.com";
    const author = post.anonymous ? "anonymous" : post.author?.username;
    return `${origin}/${author}/posts/${generatePostSlug(
      post.id,
      post.title
    )}?source=share`;
  }, [post]);

  const shareTitle = post?.title || "Bài viết trên CBH Youth Online";

  // Same shape the server stores in metadata.shared_topic, so the sender sees
  // exactly the card the recipient will get.
  const previewTopic = useMemo(() => {
    if (!post) return null;
    return {
      id: post.id,
      title: post.title,
      url: shareUrl,
      excerpt: htmlToExcerpt(post.content),
      thumbnail: post.image_urls?.[0] || null,
      author_name: post.anonymous
        ? "Người dùng ẩn danh"
        : post.author?.profile_name || post.author?.username || "",
      author_avatar:
        post.anonymous || !post.author?.username
          ? null
          : `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${post.author.username}/avatar`,
    };
  }, [post, shareUrl]);

  const filteredConversations = useMemo(
    () =>
      (conversations || []).filter(
        (conversation) =>
          !(
            conversation.type === "group" &&
            conversation.name === "Tán gẫu linh tinh"
          )
      ),
    [conversations]
  );

  const totalSelected =
    selectedConversationIds.length + selectedUserIds.length;

  const toggleConversation = (id) => {
    setSelectedConversationIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleClose = () => {
    if (sending) return;
    onClose?.();
  };

  const handleSendToChat = async () => {
    if (!post) return;
    if (!currentUser) {
      antdMessage.error("Bạn cần đăng nhập để chia sẻ qua tin nhắn");
      return;
    }
    if (totalSelected === 0) {
      antdMessage.warning("Vui lòng chọn ít nhất một người để chia sẻ");
      return;
    }
    if (totalSelected > MAX_TARGETS) {
      antdMessage.warning(`Chỉ có thể chia sẻ tới tối đa ${MAX_TARGETS} nơi`);
      return;
    }

    setSending(true);
    try {
      const params = { topic_id: post.id };
      if (selectedConversationIds.length > 0) {
        params.conversation_ids = selectedConversationIds;
      }
      if (selectedUserIds.length > 0) {
        params.user_ids = selectedUserIds;
      }
      if (note.trim()) {
        params.note = note.trim();
      }

      const response = await sharePostToChat(params);
      const results = response?.data?.results || response?.results;

      if (Array.isArray(results)) {
        const failed = results.filter((r) => r.status !== "sent");
        if (failed.length === 0) {
          antdMessage.success("Đã chia sẻ bài viết");
        } else if (failed.length === results.length) {
          antdMessage.error(failed[0]?.error || "Chia sẻ bài viết thất bại");
          return;
        } else {
          antdMessage.warning(
            `Đã chia sẻ tới ${results.length - failed.length}/${
              results.length
            } nơi. ${failed
              .map((f) => f.error)
              .filter(Boolean)
              .join(", ")}`
          );
        }
      } else {
        antdMessage.success("Đã chia sẻ bài viết");
      }

      onClose?.();
    } catch (error) {
      antdMessage.error(
        error?.response?.data?.message || "Chia sẻ bài viết thất bại"
      );
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      antdMessage.success("Đã sao chép liên kết vào bộ nhớ tạm");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      antdMessage.error("Không thể sao chép liên kết");
    }
  };

  // The OS/browser share sheet (iOS, Android, Safari, Edge) - the same
  // "share to other apps" intent the mobile app uses.
  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: shareTitle, url: shareUrl });
    } catch (error) {
      // AbortError = the user dismissed the sheet; nothing to report.
      if (error?.name !== "AbortError") {
        antdMessage.error("Không thể mở trình chia sẻ của thiết bị");
      }
    }
  };

  const externalTargets = [
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
    },
    {
      key: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(shareTitle)}`,
    },
  ];

  return (
    <Modal show={!!open && !!post} onClose={handleClose} maxWidth="md">
      <div className="flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-neutral-600">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Chia sẻ bài viết
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 text-gray-500 dark:text-gray-300"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {previewTopic && (
          <div className="px-4 py-3 border-b dark:border-neutral-600">
            <SharedPostCard topic={previewTopic} compact />
          </div>
        )}

        {currentUser ? (
          <>
            <div className="px-4 py-3 border-b dark:border-neutral-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                Gửi qua tin nhắn
              </p>
              <UserMultiSelect
                selectedUserIds={selectedUserIds}
                onChange={setSelectedUserIds}
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredConversations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                  Chưa có cuộc trò chuyện nào
                </p>
              ) : (
                filteredConversations.map((conversation) => (
                  <label
                    key={conversation.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-neutral-600 cursor-pointer border-b dark:border-neutral-600 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedConversationIds.includes(
                        conversation.id
                      )}
                      onChange={() => toggleConversation(conversation.id)}
                    />
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage
                        src={getThreadAvatar(conversation)}
                        alt={getThreadDisplayName(conversation)}
                      />
                      <AvatarFallback>
                        {getThreadDisplayName(conversation)?.[0]?.toUpperCase() ||
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm dark:text-white truncate min-w-0 flex-1">
                      {getThreadDisplayName(conversation)}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t dark:border-neutral-600">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                placeholder="Thêm lời nhắn (không bắt buộc)"
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-neutral-500 bg-white dark:bg-neutral-600 dark:text-white outline-none focus:border-[#319527]"
              />
              <Button
                type="primary"
                onClick={handleSendToChat}
                loading={sending}
                icon={<Send className="w-4 h-4" />}
                className="w-full mt-2 bg-[#319527] hover:bg-[#3dbb31] flex items-center justify-center"
              >
                Gửi{totalSelected > 0 ? ` (${totalSelected})` : ""}
              </Button>
            </div>
          </>
        ) : (
          <div className="px-4 py-4 border-b dark:border-neutral-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đăng nhập để chia sẻ bài viết qua tin nhắn với bạn bè.
            </p>
          </div>
        )}

        <div className="px-4 py-3 border-t dark:border-neutral-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Chia sẻ đến ứng dụng khác
          </p>
          <div className="flex flex-wrap gap-2">
            {canUseNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-gray-100 dark:bg-neutral-600 hover:bg-gray-200 dark:hover:bg-neutral-500 text-gray-700 dark:text-gray-100"
              >
                <Share2 className="w-4 h-4" />
                Chia sẻ...
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-gray-100 dark:bg-neutral-600 hover:bg-gray-200 dark:hover:bg-neutral-500 text-gray-700 dark:text-gray-100"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#319527]" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              {copied ? "Đã sao chép" : "Sao chép liên kết"}
            </button>
            {externalTargets.map((target) => (
              <a
                key={target.key}
                href={target.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-gray-100 dark:bg-neutral-600 hover:bg-gray-200 dark:hover:bg-neutral-500 text-gray-700 dark:text-gray-100"
              >
                {target.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
