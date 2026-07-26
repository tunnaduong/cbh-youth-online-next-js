"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatContext } from "@/contexts/Support";
import moment from "moment";
import "moment/locale/vi";
import ChatMessageInput from "./ChatMessageInput";
import MessageReactions from "./MessageReactions";
import ChatMediaLightbox from "./ChatMediaLightbox";
import { FileText, Download, PlayCircle } from "lucide-react";

const LONG_PRESS_MS = 450;

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveFileUrl(url) {
  if (!url) return url;
  return url.startsWith("http") || url.startsWith("blob:")
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

const IMAGE_EXTENSION_RE = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i;

const URL_RE = /(https?:\/\/[^\s]+)/g;

// Plain text wraps at word boundaries (break-words) so Vietnamese diacritics
// never get split mid-character. URLs have no word boundaries to wrap at, so
// they alone get break-all — otherwise they'd overflow the bubble instead of
// wrapping.
function linkifyText(text, linkClassName) {
  if (!text) return text;
  const parts = text.split(URL_RE);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline break-all ${linkClassName || ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      <span key={i} className="break-words">
        {part}
      </span>
    )
  );
}

// Some attachments got persisted with type: "file" even though they're really
// images (e.g. the browser's file picker reported a blank/generic MIME type
// on upload). Fall back to sniffing the name/URL so old messages like that
// still preview inline instead of showing a download card forever.
function looksLikeImage(message) {
  return IMAGE_EXTENSION_RE.test(message.file_name || message.content || "") ||
    IMAGE_EXTENSION_RE.test(message.file_url || "");
}

export default function ChatConversation({
  conversationId,
  conversation,
  previewParticipant,
  onConversationCreated,
}) {
  const {
    messages,
    sendMessage,
    sendFileMessage,
    sending,
    selectedConversationId,
    loadMessages,
    createConversation,
    loadConversations,
    selectConversation,
    typingUsers,
    sendTyping,
    reactToMessage,
    removeMessageReaction,
  } = useChatContext();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true); // Start as true to allow loading
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [openReactionMessageId, setOpenReactionMessageId] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const messagesContainerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const conversationMessages = conversationId
    ? messages[conversationId] || []
    : [];
  const isGroupChat = conversation?.type === "group";
  const typingUser = conversationId ? typingUsers[conversationId] : null;

  // Reset initial load flag when conversation changes
  useEffect(() => {
    if (conversationId) {
      setIsInitialLoad(true);
    }
  }, [conversationId]);

  // Auto-scroll to bottom on initial load or new messages
  useEffect(() => {
    if (messagesContainerRef.current && conversationMessages.length > 0) {
      const container = messagesContainerRef.current;

      // On initial load, always scroll to bottom
      if (isInitialLoad) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight;
            setIsInitialLoad(false);
          }
        }, 100);
      } else {
        // On subsequent updates, only scroll if near bottom
        const isNearBottom =
          container.scrollHeight - container.scrollTop <=
          container.clientHeight + 100;

        if (isNearBottom) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
  }, [conversationMessages, isInitialLoad]);

  // Load more messages when scrolling to top
  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !hasMorePages) return;

    if (container.scrollTop === 0) {
      setIsLoadingMore(true);
      try {
        const nextPage = currentPage + 1;
        const result = await loadMessages(conversationId, nextPage, true);

        // Check if there are more pages
        if (result && result.pagination && result.pagination.has_more_pages) {
          setCurrentPage(nextPage);
          setHasMorePages(result.pagination.has_more_pages);

          // Preserve scroll position when prepending older messages
          if (result.messages && result.messages.length > 0) {
            const currentScrollHeight = container.scrollHeight;
            setTimeout(() => {
              if (container) {
                container.scrollTop =
                  container.scrollHeight - currentScrollHeight;
              }
            }, 0);
          }
        } else {
          setHasMorePages(false);
        }
      } catch (error) {
        console.error("[ChatConversation] Error loading more messages:", error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    try {
      moment.locale("vi");
      return moment(timestamp).fromNow();
    } catch {
      return "";
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;

    // If this is a preview conversation, create it first
    if (previewParticipant && !conversationId) {
      try {
        const conversation = await createConversation(previewParticipant.id);
        if (conversation?.id) {
          // Reload conversations to get the new one
          await loadConversations();
          // Select the newly created conversation
          await selectConversation(conversation.id);
          // Clear preview
          if (onConversationCreated) {
            onConversationCreated(conversation.id);
          }
          // Now send the message to the newly created conversation
          await sendMessage(conversation.id, content);
        }
      } catch (error) {
        console.error("[ChatConversation] Error creating conversation:", error);
        // Error will be shown in the UI if needed
      }
      return;
    }

    // Normal conversation - just send message
    if (conversationId) {
      await sendMessage(conversationId, content);
    }
  };

  const handleSendFile = async (file) => {
    if (!file) return;

    // If this is a preview conversation, create it first
    if (previewParticipant && !conversationId) {
      try {
        const conversation = await createConversation(previewParticipant.id);
        if (conversation?.id) {
          await loadConversations();
          await selectConversation(conversation.id);
          if (onConversationCreated) {
            onConversationCreated(conversation.id);
          }
          await sendFileMessage(conversation.id, file);
        }
      } catch (error) {
        console.error("[ChatConversation] Error creating conversation:", error);
      }
      return;
    }

    if (conversationId) {
      await sendFileMessage(conversationId, file);
    }
  };

  const handleReact = async (messageId, reactionType) => {
    if (!conversationId) return;
    try {
      if (reactionType) {
        await reactToMessage(conversationId, messageId, reactionType);
      } else {
        await removeMessageReaction(conversationId, messageId);
      }
    } catch (error) {
      console.error("[ChatConversation] Error reacting to message:", error);
    } finally {
      setOpenReactionMessageId(null);
    }
  };

  const handleRemoveReaction = async (messageId) => {
    if (!conversationId) return;
    try {
      await removeMessageReaction(conversationId, messageId);
    } catch (error) {
      console.error("[ChatConversation] Error removing reaction:", error);
    } finally {
      setOpenReactionMessageId(null);
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = (messageId) => {
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      setOpenReactionMessageId(messageId);
    }, LONG_PRESS_MS);
  };

  // Show preview state
  if (previewParticipant && !conversationId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
            </p>
          </div>
        </div>
        <ChatMessageInput
          onSend={handleSendMessage}
          onSendFile={handleSendFile}
          sending={sending}
          onTyping={() => sendTyping(conversationId)}
        />
      </div>
    );
  }

  if (!conversationId && !previewParticipant) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Chọn một cuộc trò chuyện để bắt đầu
        </p>
      </div>
    );
  }

  if (conversationMessages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Chưa có tin nhắn nào
            </p>
          </div>
        </div>
        <ChatMessageInput
          onSend={handleSendMessage}
          onSendFile={handleSendFile}
          sending={sending}
          onTyping={() => sendTyping(conversationId)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoadingMore && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Đang tải thêm...
            </p>
          </div>
        )}

        {conversationMessages.map((message, index) => {
          const isLastOwnMessage =
            message.is_myself &&
            !conversationMessages
              .slice(index + 1)
              .some((m) => m.is_myself);

          const isStoryReply = message.type === "story_reply";
          const storyReplyCaption = isStoryReply
            ? message.is_myself
              ? `Bạn đã bình luận về tin của ${
                  message.story_owner?.profile_name ||
                  message.story_owner?.username ||
                  "người dùng"
                }`
              : `${
                  message.sender?.profile_name ||
                  message.sender?.username ||
                  "Ai đó"
                } đã bình luận về tin của bạn`
            : null;

          return (
          <div key={message.id} className="flex flex-col">
            {storyReplyCaption && (
              <div
                className={`text-[11px] text-gray-400 dark:text-gray-500 mb-1 px-1 ${
                  message.is_myself ? "text-right" : "text-left"
                }`}
              >
                {storyReplyCaption}
              </div>
            )}
            <div
              className={`flex gap-2 ${
                message.is_myself ? "flex-row-reverse" : "flex-row"
              }`}
            >
            {!message.is_myself && (
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage
                  src={message.sender?.avatar_url}
                  alt={message.sender?.profile_name || message.sender?.username}
                />
                <AvatarFallback>
                  {message.sender?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`flex flex-col max-w-[70%] min-w-0 ${
                message.is_myself ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 min-w-0">
                {!message.is_myself &&
                  (message.sender?.username ? (
                    <Link
                      href={`/${message.sender.username}`}
                      className="text-xs font-medium dark:text-white truncate hover:underline"
                    >
                      {message.sender?.profile_name || message.sender?.username}
                    </Link>
                  ) : (
                    <span className="text-xs font-medium dark:text-white truncate">
                      {message.sender?.profile_name || message.sender?.username}
                    </span>
                  ))}
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {message.created_at_human ||
                    formatTimestamp(message.created_at)}
                </span>
              </div>
              <div className="relative mb-2">
                {message.type === "image" ||
                (message.type === "file" && looksLikeImage(message)) ? (
                  <div
                    className="relative rounded-lg overflow-hidden max-w-[240px] cursor-pointer"
                    onClick={() =>
                      !message.is_sending &&
                      setLightboxMedia({
                        type: "image",
                        url: resolveFileUrl(message.file_url),
                      })
                    }
                    onMouseDown={() => startLongPress(message.id)}
                    onMouseUp={clearLongPressTimer}
                    onMouseLeave={clearLongPressTimer}
                    onTouchStart={() => startLongPress(message.id)}
                    onTouchEnd={clearLongPressTimer}
                    onTouchMove={clearLongPressTimer}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <img
                      src={resolveFileUrl(message.file_url)}
                      alt={message.content || "image"}
                      className="w-full h-auto max-h-[300px] object-cover"
                    />
                    {message.is_sending && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-xs text-white">Đang gửi...</span>
                      </div>
                    )}
                  </div>
                ) : message.type === "video" ? (
                  <div
                    className="relative rounded-lg overflow-hidden max-w-[240px] cursor-pointer"
                    onClick={() =>
                      !message.is_sending &&
                      setLightboxMedia({
                        type: "video",
                        url: resolveFileUrl(message.file_url),
                        poster: resolveFileUrl(message.metadata?.thumbnail_url),
                      })
                    }
                    onMouseDown={() => startLongPress(message.id)}
                    onMouseUp={clearLongPressTimer}
                    onMouseLeave={clearLongPressTimer}
                    onTouchStart={() => startLongPress(message.id)}
                    onTouchEnd={clearLongPressTimer}
                    onTouchMove={clearLongPressTimer}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <video
                      src={resolveFileUrl(message.file_url)}
                      poster={resolveFileUrl(message.metadata?.thumbnail_url)}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-full h-auto max-h-[300px] object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                      <PlayCircle className="w-10 h-10 text-white drop-shadow" />
                    </div>
                    {message.is_sending && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-xs text-white">Đang gửi...</span>
                      </div>
                    )}
                  </div>
                ) : message.type === "file" ? (
                  <a
                    href={resolveFileUrl(message.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm max-w-[240px] ${
                      message.is_myself
                        ? "bg-[#319527] text-white"
                        : "bg-gray-200 dark:bg-neutral-600 dark:text-white"
                    }`}
                    onMouseDown={() => startLongPress(message.id)}
                    onMouseUp={clearLongPressTimer}
                    onMouseLeave={clearLongPressTimer}
                    onTouchStart={() => startLongPress(message.id)}
                    onTouchEnd={clearLongPressTimer}
                    onTouchMove={clearLongPressTimer}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <FileText className="w-6 h-6 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium">
                        {message.content || message.file_name || "Tệp đính kèm"}
                      </span>
                      {message.file_size ? (
                        <span className="text-xs opacity-80">
                          {formatFileSize(message.file_size)}
                        </span>
                      ) : (
                        !message.is_sending && (
                          <span className="text-xs opacity-80 flex items-center gap-1">
                            <Download className="w-3 h-3" /> Tải xuống
                          </span>
                        )
                      )}
                    </div>
                  </a>
                ) : (
                  <div
                    className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      message.is_myself
                        ? "bg-[#319527] text-white"
                        : "bg-gray-200 dark:bg-neutral-600 dark:text-white"
                    }`}
                    onMouseDown={() => startLongPress(message.id)}
                    onMouseUp={clearLongPressTimer}
                    onMouseLeave={clearLongPressTimer}
                    onTouchStart={() => startLongPress(message.id)}
                    onTouchEnd={clearLongPressTimer}
                    onTouchMove={clearLongPressTimer}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {linkifyText(message.content)}
                  </div>
                )}
                {!message.is_sending && (
                  <MessageReactions
                    reactions={message.reactions}
                    isOwn={message.is_myself}
                    open={openReactionMessageId === message.id}
                    onOpenChange={(isOpen) =>
                      setOpenReactionMessageId(isOpen ? message.id : null)
                    }
                    onReact={(type) => handleReact(message.id, type)}
                    onRemove={() => handleRemoveReaction(message.id)}
                  />
                )}
              </div>
              {isLastOwnMessage && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {message.read_at ? "Đã xem" : "Đã gửi"}
                </span>
              )}
            </div>
            </div>
          </div>
          );
        })}
      </div>

      {typingUser && (
        <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 italic">
          {isGroupChat
            ? `${typingUser.name || "Ai đó"} đang nhập...`
            : "Đang nhập..."}
        </div>
      )}

      {/* Input */}
      <ChatMessageInput
        onSend={handleSendMessage}
        onSendFile={handleSendFile}
        sending={sending}
        onTyping={() => sendTyping(conversationId)}
      />

      <ChatMediaLightbox
        media={lightboxMedia}
        onClose={() => setLightboxMedia(null)}
      />
    </div>
  );
}
