"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { message as antdMessage } from "antd";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatContext } from "@/contexts/Support";
import moment from "moment";
import "moment/locale/vi";
import ChatMessageInput from "./ChatMessageInput";
import MessageReactions from "./MessageReactions";
import ReplyPreviewBubble from "./ReplyPreviewBubble";
import ChatMediaLightbox from "./ChatMediaLightbox";
import ForwardMessageModal from "./ForwardMessageModal";
import Modal from "@/components/ui/Modal";
import { CornerUpLeft, FileText, Download, PlayCircle, Forward, Loader2, AlertCircle, RotateCw, X } from "lucide-react";
import NextLink from "next/link";
import { recallMessage, editMessage, getGroupSeenReceipts, getNotificationSettings } from "@/app/Api";

// How often to refresh read receipts for the "seen by" avatars while a group
// chat is open, to catch another participant reading without necessarily
// sending a new message (which would otherwise be the only other trigger).
const SEEN_POLL_MS = 15000;

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

async function downloadMessageMedia(url) {
  const absoluteUrl = resolveFileUrl(url);
  const response = await fetch(absoluteUrl);
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.setAttribute("download", absoluteUrl.split("/").pop().split("?")[0] || "download");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

const IMAGE_EXTENSION_RE = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i;

const URL_RE = /(https?:\/\/[^\s]+)/g;
const MENTION_RE = /(@[\w.-]+)/g;

// Plain text wraps at word boundaries (break-words) so Vietnamese diacritics
// never get split mid-character. URLs have no word boundaries to wrap at, so
// they alone get break-all — otherwise they'd overflow the bubble instead of
// wrapping.
// validMentions: Set of lowercase usernames confirmed by the server.
function linkifyText(text, linkClassName, isOwn = false, validMentions = null) {
  if (!text) return text;
  // On own (green) bubbles use white so the mention is visible; otherwise green.
  const mentionClass = isOwn
    ? "font-medium underline underline-offset-2 text-white/90 hover:text-white break-words"
    : "font-medium underline underline-offset-2 text-[#319527] dark:text-[#6bcf60] hover:opacity-75 break-words";

  const parts = text.split(URL_RE);
  return parts.flatMap((part, i) => {
    if (i % 2 === 1) {
      return (
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
      );
    }
    // Within plain-text segments, also linkify @mentions if they are valid
    const mentionParts = part.split(MENTION_RE);
    return mentionParts.map((mp, j) => {
      if (j % 2 === 1) {
        const username = mp.slice(1); // strip '@'
        const isAll = username.toLowerCase() === "all";
        const isValid = validMentions != null && !isAll
          ? validMentions.has(username.toLowerCase())
          : false; // no server data → treat as plain text
        if (isAll) {
          // "@all" is highlighted like a mention but never links to a profile.
          return (
            <span key={`${i}-${j}`} className={mentionClass}>
              {mp}
            </span>
          );
        }
        if (isValid) {
          return (
            <NextLink
              key={`${i}-${j}`}
              href={`/${username}`}
              className={mentionClass}
              onClick={(e) => e.stopPropagation()}
            >
              {mp}
            </NextLink>
          );
        }
        return (
          <span key={`${i}-${j}`} className="break-words">
            {mp}
          </span>
        );
      }
      return (
        <span key={`${i}-${j}`} className="break-words">
          {mp}
        </span>
      );
    });
  });
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
    highlightMessageId,
    setHighlightMessageId,
    updateMessageLocally,
    removeMessageLocally,
  } = useChatContext();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true); // Start as true to allow loading
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [openReactionMessageId, setOpenReactionMessageId] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null); // { id, content }
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [seenParticipants, setSeenParticipants] = useState([]);
  const [seenModalParticipants, setSeenModalParticipants] = useState(null);
  const isSelectingTextRef = useRef(false);
  const messagesContainerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const conversationMessages = conversationId
    ? messages[conversationId] || []
    : [];
  const isGroupChat = conversation?.type === "group";
  const typingUser = conversationId ? typingUsers[conversationId] : null;
  const messageCount = conversationMessages.length;

  // Chat background (Messenger-style): defaults to the conversation's stored
  // background_url, but a live "background_changed" system message (from
  // another participant, or this tab after changing it) overrides it
  // immediately without waiting for a conversations-list refetch.
  const [backgroundOverride, setBackgroundOverride] = useState(undefined);
  useEffect(() => {
    setBackgroundOverride(undefined);
  }, [conversationId]);
  useEffect(() => {
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const m = conversationMessages[i];
      if (
        m.type === "system" &&
        (m.metadata?.event === "background_changed" || m.metadata?.event === "background_reset")
      ) {
        setBackgroundOverride(m.metadata.background_url || null);
        break;
      }
    }
  }, [conversationMessages]);
  const chatBackgroundUrl =
    backgroundOverride !== undefined ? backgroundOverride : conversation?.background_url || null;

  // Reset initial load flag when conversation changes
  useEffect(() => {
    if (conversationId) {
      setIsInitialLoad(true);
    }
  }, [conversationId]);

  // "Seen by" read receipts (group chats only). There's no per-message read
  // table on the backend — each participant just has a single last_read_at
  // timestamp for the conversation — so this refetches that on: opening the
  // conversation, whenever the message count changes (covers both new
  // messages arriving and the .message.read-triggered refresh that follows
  // someone else opening the chat), and a light poll as a fallback for reads
  // that happen without any message-list change.
  useEffect(() => {
    if (!conversationId || !isGroupChat) {
      setSeenParticipants([]);
      return undefined;
    }

    let cancelled = false;
    const fetchSeen = () => {
      getGroupSeenReceipts(conversationId)
        .then((res) => {
          if (!cancelled) setSeenParticipants(res?.data?.participants || []);
        })
        .catch(() => {});
    };

    fetchSeen();
    const interval = setInterval(fetchSeen, SEEN_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId, isGroupChat, messageCount]);

  // The "seen by" list is always empty while the user's own read receipts
  // are off (backend silently skips marking messages read / returns no seen
  // participants in that case) — track the setting so opening "Lượt xem" can
  // explain why, instead of just showing an empty list every time.
  const [readReceiptsOff, setReadReceiptsOff] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getNotificationSettings()
      .then((res) => {
        const settings = res?.data || res;
        if (!cancelled) setReadReceiptsOff(settings?.chat_read_receipts === false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Who has read at least up through a given message - reused both for the
  // inline "seen by" indicator (own last message only, see below) and the
  // on-demand "Lượt xem" menu action (any own message, not just the last one).
  const getSeenBy = (message) => {
    if (!message?.created_at) return [];
    const createdAt = new Date(message.created_at).getTime();
    return seenParticipants.filter(
      (p) => p.last_read_at && new Date(p.last_read_at).getTime() >= createdAt
    );
  };

  // The inline avatar stack only ever appears under your OWN truly-last
  // message in the conversation, exactly like Messenger - never under
  // someone else's message (if they sent the last message, nothing shows),
  // and never scattered across earlier messages of yours (use the "Lượt
  // xem" menu action on those instead).
  const realMessages = conversationMessages.filter((m) => m.type !== "system");
  const lastRealMessage = realMessages[realMessages.length - 1];
  const inlineSeenAvatars =
    isGroupChat && lastRealMessage?.is_myself ? getSeenBy(lastRealMessage) : [];

  // Hide hover buttons while the user is selecting text
  useEffect(() => {
    const onMouseDown = () => { isSelectingTextRef.current = true; };
    const onMouseUp = () => {
      const sel = window.getSelection();
      // Keep suppressed only if text is actually selected after release
      if (!sel || sel.toString().length === 0) {
        isSelectingTextRef.current = false;
      }
    };
    const onSelectionChange = () => {
      const sel = window.getSelection();
      const hasSelection = sel && sel.toString().length > 0;
      if (!hasSelection) isSelectingTextRef.current = false;
      if (hasSelection) setHoveredMessageId(null);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, []);

  // Scroll to and highlight the target message when highlightMessageId is set
  useEffect(() => {
    if (!highlightMessageId || !conversationMessages.length) return;
    const el = document.getElementById(`chat-message-${highlightMessageId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("chat-message-highlight");
    const timer = setTimeout(() => {
      el.classList.remove("chat-message-highlight");
      setHighlightMessageId(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [highlightMessageId, conversationMessages]);

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

  const handleStartReply = (message) => {
    setReplyingTo({
      id: message.id,
      content: message.content,
      type: message.type,
      file_url: message.file_url || null,
      sender: message.sender,
      isSelf: message.is_myself,
    });
    setOpenReactionMessageId(null);
  };

  const handleCancelReply = () => setReplyingTo(null);

  const scrollToAndHighlightElement = (el) => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("chat-message-highlight");
    setTimeout(() => el.classList.remove("chat-message-highlight"), 2000);
  };

  // Scroll to a replied-to message. If it isn't in the currently loaded page
  // of history, keep paginating backward (like scroll-to-top does) until it's
  // found or there's nothing more to load.
  const handleScrollToMessage = async (messageId) => {
    let el = document.getElementById(`chat-message-${messageId}`);
    if (el) {
      scrollToAndHighlightElement(el);
      return;
    }

    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      let page = currentPage;
      let more = hasMorePages;
      const MAX_PAGES_TO_TRY = 30;
      let attempts = 0;

      while (!el && more && attempts < MAX_PAGES_TO_TRY) {
        attempts++;
        const nextPage = page + 1;
        const container = messagesContainerRef.current;
        const currentScrollHeight = container?.scrollHeight || 0;

        const result = await loadMessages(conversationId, nextPage, true);
        page = nextPage;
        more = !!result?.pagination?.has_more_pages;
        setCurrentPage(page);
        setHasMorePages(more);

        if (container) {
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - currentScrollHeight;
          });
        }

        // Give React a tick to flush the newly prepended messages into the DOM.
        await new Promise((resolve) => setTimeout(resolve, 50));
        el = document.getElementById(`chat-message-${messageId}`);
      }
    } catch (error) {
      console.error("[ChatConversation] Error loading older messages to scroll to reply:", error);
    } finally {
      setIsLoadingMore(false);
    }

    if (!el) return;
    scrollToAndHighlightElement(el);
  };

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;
    const replyId = replyingTo?.id || null;

    // If this is a preview conversation, create it first
    if (previewParticipant && !conversationId) {
      try {
        const conversation = await createConversation(previewParticipant.id);
        if (conversation?.id) {
          await loadConversations();
          await selectConversation(conversation.id);
          if (onConversationCreated) onConversationCreated(conversation.id);
          await sendMessage(conversation.id, content, "text", replyId);
        }
      } catch (error) {
        console.error("[ChatConversation] Error creating conversation:", error);
      }
      return;
    }

    if (conversationId) {
      await sendMessage(conversationId, content, "text", replyId);
      setReplyingTo(null);
    }
  };

  const handleSendFile = async (fileOrFiles) => {
    if (!fileOrFiles || (Array.isArray(fileOrFiles) && fileOrFiles.length === 0)) return;

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
          await sendFileMessage(conversation.id, fileOrFiles);
        }
      } catch (error) {
        console.error("[ChatConversation] Error creating conversation:", error);
      }
      return;
    }

    if (conversationId) {
      try {
        await sendFileMessage(conversationId, fileOrFiles);
      } catch (error) {
        antdMessage.error(error?.chatFailReason || "Gửi tệp thất bại, vui lòng thử lại");
      }
    }
  };

  const handleRetryFile = async (message) => {
    if (!message?._retryFiles?.length) return;
    removeMessageLocally?.(conversationId, message.id);
    await handleSendFile(
      message._retryFiles.length === 1 ? message._retryFiles[0] : message._retryFiles
    );
  };

  const handleDismissFailed = (message) => {
    removeMessageLocally?.(conversationId, message.id);
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

  const handleRecall = async (messageId) => {
    try {
      await recallMessage(messageId);
      if (conversationId) {
        updateMessageLocally(conversationId, messageId, {
          is_recalled: true,
          content: null,
          file_url: null,
          metadata: null,
        });
      }
    } catch (error) {
      console.error("[ChatConversation] Error recalling message:", error);
    }
  };

  const handleStartEdit = (message) => {
    setEditingMessage({ id: message.id, content: message.content || "" });
    setOpenReactionMessageId(null);
  };

  const handleSaveEdit = async (newContent) => {
    if (!editingMessage || !newContent.trim()) return;
    try {
      await editMessage(editingMessage.id, { content: newContent.trim() });
      updateMessageLocally(conversationId, editingMessage.id, {
        content: newContent.trim(),
        is_edited: true,
      });
    } catch (error) {
      console.error("[ChatConversation] Error editing message:", error);
    } finally {
      setEditingMessage(null);
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

  const longPressMessageRef = useRef(null);

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
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          conversationId={conversationId}
          allowAllMention={isGroupChat}
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
        <div className="relative flex-1 overflow-hidden">
          {chatBackgroundUrl && (
            <>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: `url(${chatBackgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <div className="absolute inset-0 bg-white/55 dark:bg-black/55 pointer-events-none" />
            </>
          )}
          <div className="relative h-full overflow-y-auto p-4 flex items-center justify-center">
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
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          conversationId={conversationId}
          allowAllMention={isGroupChat}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages container — the background image/overlay is a fixed sibling layer
          behind this so it stays put while only the message list scrolls over it. */}
      <div className="relative flex-1 overflow-hidden">
        {chatBackgroundUrl && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: `url(${chatBackgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            <div className="absolute inset-0 bg-white/55 dark:bg-black/55 pointer-events-none" />
          </>
        )}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="relative h-full overflow-y-auto overflow-x-hidden p-4 space-y-4"
        >
        {isLoadingMore && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Đang tải thêm...
            </p>
          </div>
        )}

        {conversationMessages.map((message, index) => {
          if (message.type === "system") {
            return (
              <div key={message.id} className="flex justify-center my-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-neutral-800 rounded-full px-3 py-1">
                  {message.content}
                </span>
              </div>
            );
          }

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

          const replyBtn = !message.is_sending && (
            <div className={`flex items-center flex-shrink-0 transition-opacity ${hoveredMessageId === message.id ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <button
                type="button"
                title="Trả lời"
                onClick={() => handleStartReply(message)}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-500 dark:text-gray-400"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
              {!message.is_recalled && (
                <button
                  type="button"
                  title="Chuyển tiếp"
                  onClick={() => setForwardingMessage(message)}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-500 dark:text-gray-400"
                >
                  <Forward className="w-3.5 h-3.5" />
                </button>
              )}
              {!message.is_recalled &&
                message.file_url &&
                (message.type === "image" || message.type === "video") && (
                <button
                  type="button"
                  title="Tải xuống"
                  onClick={() => downloadMessageMedia(message.file_url)}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-500 dark:text-gray-400"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );

          return (
          <div
            key={message.id}
            id={`chat-message-${message.id}`}
            className="flex flex-col transition-colors duration-700"
            onMouseEnter={() => { if (!isSelectingTextRef.current) setHoveredMessageId(message.id); }}
            onMouseLeave={() => setHoveredMessageId(null)}
            onContextMenu={(e) => e.stopPropagation()}
          >
            {storyReplyCaption && (
              <div className={`text-[11px] text-gray-400 dark:text-gray-500 mb-1 px-1 ${message.is_myself ? "text-right" : "text-left"}`}>
                {storyReplyCaption}
              </div>
            )}
            {/* Row: avatar + bubble */}
            <div className={`flex items-end gap-1 ${message.is_myself ? "justify-end" : "justify-start"}`}>

              {/* Avatar (others only) */}
              {!message.is_myself && (
                <Avatar className="w-8 h-8 flex-shrink-0 self-end mb-2">
                  <AvatarImage src={message.sender?.avatar_url} alt={message.sender?.profile_name || message.sender?.username} />
                  <AvatarFallback>{message.sender?.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
              )}

              {/* Bubble column */}
              <div className={`flex flex-col min-w-0 max-w-[260px] ${message.is_myself ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1 min-w-0 max-w-full overflow-hidden">
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
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 flex items-center gap-1">
                  {message.created_at_human || formatTimestamp(message.created_at)}
                  {message.is_edited && !message.is_recalled && (
                    <span className="italic">(Đã sửa)</span>
                  )}
                </span>
              </div>
              {message.is_forwarded && (
                <div className="flex items-center gap-1 text-[11px] italic text-gray-400 dark:text-gray-500 mb-0.5">
                  <Forward className="w-3 h-3" />
                  Đã chuyển tiếp
                  {message.metadata?.forwarded_from?.sender_name && (
                    <span> từ {message.metadata.forwarded_from.sender_name}</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1 min-w-0">
              {message.is_myself && replyBtn}
              <div className="relative mb-2 min-w-0">
                {message.reply_to && (
                  <ReplyPreviewBubble
                    replyTo={message.reply_to}
                    isOwn={message.is_myself}
                    onClick={() => handleScrollToMessage(message.reply_to.id)}
                  />
                )}
                {message.is_recalled ? (
                  <div className={`rounded-lg px-3 py-2 text-sm italic ${
                    message.is_myself
                      ? "bg-[#319527]/60 text-white/70"
                      : "bg-gray-200 dark:bg-neutral-600 text-gray-500 dark:text-gray-400"
                  }`}>
                    Tin nhắn đã bị thu hồi
                  </div>
                ) : (message.type === "image" || message.type === "video") &&
                  message.file_urls?.length >= 2 ? (
                  <div
                    className={`relative grid gap-1 rounded-lg overflow-hidden max-w-[240px] ${
                      message.file_urls.length === 2 ? "grid-cols-2" : "grid-cols-3"
                    }`}
                    onMouseDown={(e) => { if (e.button === 0) startLongPress(message.id); }}
                    onMouseMove={clearLongPressTimer}
                    onMouseUp={clearLongPressTimer}
                    onMouseLeave={clearLongPressTimer}
                    onTouchStart={() => startLongPress(message.id)}
                    onTouchEnd={clearLongPressTimer}
                    onTouchMove={clearLongPressTimer}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {message.file_urls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square cursor-pointer overflow-hidden bg-black/5"
                        onClick={() =>
                          !message.is_sending &&
                          setLightboxMedia({
                            type: message.type,
                            url: resolveFileUrl(url),
                            poster:
                              message.type === "video"
                                ? resolveFileUrl(message.metadata?.thumbnail_url)
                                : undefined,
                            index: idx,
                            list: message.file_urls.map((u) => ({
                              type: message.type,
                              url: resolveFileUrl(u),
                              poster:
                                message.type === "video"
                                  ? resolveFileUrl(message.metadata?.thumbnail_url)
                                  : undefined,
                            })),
                          })
                        }
                      >
                        {message.type === "video" ? (
                          <video
                            src={resolveFileUrl(url)}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={resolveFileUrl(url)}
                            alt={message.content || "image"}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {message.type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                            <PlayCircle className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                    ))}
                    {message.is_sending && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-xs text-white">Đang gửi...</span>
                      </div>
                    )}
                  </div>
                ) : message.type === "image" ||
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
                    onMouseDown={(e) => { if (e.button === 0) startLongPress(message.id); }}
                    onMouseMove={clearLongPressTimer}
                    onMouseUp={clearLongPressTimer}
                    onMouseLeave={clearLongPressTimer}
                    onTouchStart={() => startLongPress(message.id)}
                    onTouchEnd={clearLongPressTimer}
                    onTouchMove={clearLongPressTimer}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <img
                      src={resolveFileUrl(message.metadata?.thumbnail_url) || resolveFileUrl(message.file_url)}
                      alt={message.content || "image"}
                      className="w-full h-auto max-h-[300px] object-cover"
                    />
                    {message.is_sending && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30">
                        <span className="text-xs text-white">
                          Đang gửi...
                          {typeof message.upload_progress === "number"
                            ? ` (${message.upload_progress}%)`
                            : ""}
                        </span>
                      </div>
                    )}
                    {message.is_failed && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 pointer-events-auto">
                        <span className="text-xs text-white text-center px-2">
                          {message.fail_reason || "Gửi ảnh thất bại"}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-xs text-white font-medium underline flex items-center gap-0.5"
                            onClick={(e) => { e.stopPropagation(); handleRetryFile(message); }}
                          >
                            <RotateCw className="w-3 h-3" /> Gửi lại
                          </button>
                          <button
                            type="button"
                            className="text-white"
                            onClick={(e) => { e.stopPropagation(); handleDismissFailed(message); }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
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
                    onMouseDown={(e) => { if (e.button === 0) startLongPress(message.id); }}
                    onMouseMove={clearLongPressTimer}
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30">
                        <span className="text-xs text-white">
                          Đang gửi...
                          {typeof message.upload_progress === "number"
                            ? ` (${message.upload_progress}%)`
                            : ""}
                        </span>
                      </div>
                    )}
                    {message.is_failed && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 pointer-events-auto">
                        <span className="text-xs text-white text-center px-2">
                          {message.fail_reason || "Gửi video thất bại"}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-xs text-white font-medium underline flex items-center gap-0.5"
                            onClick={(e) => { e.stopPropagation(); handleRetryFile(message); }}
                          >
                            <RotateCw className="w-3 h-3" /> Gửi lại
                          </button>
                          <button
                            type="button"
                            className="text-white"
                            onClick={(e) => { e.stopPropagation(); handleDismissFailed(message); }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : message.type === "file" ? (
                  <a
                    href={
                      message.is_sending || message.is_failed
                        ? undefined
                        : resolveFileUrl(message.file_url)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={message.is_sending || message.is_failed || undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm max-w-[240px] ${
                      message.is_failed
                        ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                        : message.is_myself
                        ? "bg-[#319527] text-white"
                        : "bg-gray-200 dark:bg-neutral-600 dark:text-white"
                    } ${
                      message.is_sending || message.is_failed
                        ? "pointer-events-none opacity-90"
                        : ""
                    }`}
                    onClick={(e) => {
                      if (message.is_sending || message.is_failed) e.preventDefault();
                    }}
                    onMouseDown={(e) => { if (e.button === 0) startLongPress(message.id); }}
                    onMouseMove={clearLongPressTimer}
                    onMouseUp={clearLongPressTimer}
                    onMouseLeave={clearLongPressTimer}
                    onTouchStart={() => startLongPress(message.id)}
                    onTouchEnd={clearLongPressTimer}
                    onTouchMove={clearLongPressTimer}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {message.is_sending ? (
                      <Loader2 className="w-6 h-6 flex-shrink-0 animate-spin" />
                    ) : message.is_failed ? (
                      <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    ) : (
                      <FileText className="w-6 h-6 flex-shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate font-medium">
                        {message.content || message.file_name || "Tệp đính kèm"}
                      </span>
                      {message.is_sending ? (
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-xs opacity-80">
                            Đang tải lên{message.file_size ? ` · ${formatFileSize(message.file_size)}` : ""}
                            {typeof message.upload_progress === "number"
                              ? ` (${message.upload_progress}%)`
                              : ""}
                          </span>
                          <div className="w-full h-1 rounded-full bg-black/20 overflow-hidden">
                            <div
                              className="h-full bg-white/90 transition-all duration-150"
                              style={{
                                width: `${Math.max(
                                  4,
                                  message.upload_progress || 0
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : message.is_failed ? (
                        <div className="flex items-center gap-2 mt-1 pointer-events-auto">
                          <span className="text-xs">
                            {message.fail_reason || "Gửi tệp thất bại"}
                          </span>
                          <button
                            type="button"
                            className="text-xs font-medium underline flex items-center gap-0.5 hover:opacity-80"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRetryFile(message);
                            }}
                          >
                            <RotateCw className="w-3 h-3" /> Gửi lại
                          </button>
                          <button
                            type="button"
                            className="hover:opacity-80"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDismissFailed(message);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : message.file_size ? (
                        <span className="text-xs opacity-80">
                          {formatFileSize(message.file_size)}
                        </span>
                      ) : (
                        <span className="text-xs opacity-80 flex items-center gap-1">
                          <Download className="w-3 h-3" /> Tải xuống
                        </span>
                      )}
                    </div>
                  </a>
                ) : (
                  <div
                    className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] w-fit max-w-[260px] min-w-0 ${
                      message.is_myself
                        ? "bg-[#319527] text-white"
                        : "bg-gray-200 dark:bg-neutral-600 dark:text-white"
                    }`}
                    onMouseDown={(e) => { if (e.button === 0) startLongPress(message.id); }}
                    onMouseMove={clearLongPressTimer}
                    onMouseUp={clearLongPressTimer}
                    onMouseLeave={clearLongPressTimer}
                    onTouchStart={() => startLongPress(message.id)}
                    onTouchEnd={clearLongPressTimer}
                    onTouchMove={clearLongPressTimer}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {linkifyText(
                      message.content,
                      "",
                      message.is_myself,
                      Array.isArray(message.mentions)
                        ? new Set(message.mentions.map((m) => m.username.toLowerCase()))
                        : null
                    )}
                  </div>
                )}
                {!message.is_sending && !message.is_recalled && (
                  <MessageReactions
                    reactions={message.reactions}
                    isOwn={message.is_myself}
                    open={openReactionMessageId === message.id}
                    onOpenChange={(isOpen) =>
                      setOpenReactionMessageId(isOpen ? message.id : null)
                    }
                    onReact={(type) => handleReact(message.id, type)}
                    onRemove={() => handleRemoveReaction(message.id)}
                    onReply={!message.is_recalled ? () => handleStartReply(message) : undefined}
                    onForward={!message.is_recalled ? () => setForwardingMessage(message) : undefined}
                    onCopy={message.type === "text" && !message.is_recalled ? () => {
                      navigator.clipboard.writeText(message.content);
                      antdMessage.success("Đã sao chép tin nhắn");
                    } : undefined}
                    onRecall={message.is_myself && !message.is_recalled ? () => handleRecall(message.id) : undefined}
                    onEdit={message.is_myself && message.type === "text" && !message.is_recalled ? () => handleStartEdit(message) : undefined}
                    onViewSeenBy={
                      isGroupChat && message.is_myself && !message.is_sending
                        ? () => {
                            if (readReceiptsOff) {
                              antdMessage.info(
                                "Trạng thái đã xem đang tắt. Bạn sẽ không thấy khi người khác đã xem tin nhắn của mình trong đoạn chat này."
                              );
                              return;
                            }
                            setSeenModalParticipants(getSeenBy(message));
                          }
                        : undefined
                    }
                  />
                )}
              </div>
              {!message.is_myself && replyBtn}
              </div>
              {!isGroupChat && isLastOwnMessage && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {message.read_at ? "Đã xem" : "Đã gửi"}
                </span>
              )}
              {isGroupChat && message.id === lastRealMessage?.id && inlineSeenAvatars.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSeenModalParticipants(inlineSeenAvatars)}
                  className={`flex mt-0.5 ${message.is_myself ? "justify-end" : "justify-start"}`}
                  title="Đã xem"
                >
                  <div className="flex -space-x-1.5">
                    {inlineSeenAvatars.slice(0, 3).map((p) => (
                      <Avatar
                        key={p.id}
                        className="w-3.5 h-3.5 border border-white dark:border-neutral-800"
                      >
                        <AvatarImage src={p.avatar_url} alt={p.profile_name || p.username} />
                        <AvatarFallback className="text-[7px]">
                          {(p.profile_name || p.username)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </button>
              )}
              </div>
            </div>
          </div>
          );
        })}
        </div>
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
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        editingMessage={editingMessage}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setEditingMessage(null)}
        conversationId={conversationId}
        allowAllMention={isGroupChat}
      />

      <ChatMediaLightbox
        media={lightboxMedia}
        onClose={() => setLightboxMedia(null)}
      />

      <ForwardMessageModal
        message={forwardingMessage}
        onClose={() => setForwardingMessage(null)}
      />

      <Modal
        show={seenModalParticipants != null}
        onClose={() => setSeenModalParticipants(null)}
        maxWidth="sm"
      >
        <div className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Đã xem</h3>
          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
            {(seenModalParticipants || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có ai xem tin nhắn này.</p>
            ) : (
              seenModalParticipants.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={p.avatar_url} alt={p.profile_name || p.username} />
                    <AvatarFallback>{(p.profile_name || p.username)?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {p.profile_name || p.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(p.last_read_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
