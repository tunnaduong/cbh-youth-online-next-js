"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/Support";
import {
  getPublicChatMessages,
  sendPublicMessage,
  sendPublicMessageWithFile,
  getPublicChatParticipants,
} from "@/app/Api";
import MessageInput from "./MessageInput";
import ParticipantsList from "./ParticipantsList";
import ChatMediaLightbox from "./ChatMediaLightbox";
import { Menu, FileText, Download, PlayCircle, CornerUpLeft, Undo2, Pencil } from "lucide-react";
import MessageReactions from "./MessageReactions";
import ReplyPreviewBubble from "./ReplyPreviewBubble";
import { reactToMessage, removeMessageReaction, recallMessage, editMessage } from "@/app/Api";
import { Popover, message as antdMessage } from "antd";

const URL_RE = /(https?:\/\/[^\s]+)/g;
const MENTION_RE = /(@[\w-]+)/g;

// Fallback: resolve @mentions in freshly-sent/edited content against the known
// participants list, in case the server response doesn't include a resolved
// `mentions` array yet (it would otherwise only appear after the next poll/refresh).
function resolveMentionsFromParticipants(content, participants) {
  if (!content || !Array.isArray(participants) || participants.length === 0) {
    return [];
  }
  const byUsername = new Map(
    participants
      .filter((p) => p?.username)
      .map((p) => [p.username.toLowerCase(), p])
  );
  const seen = new Set();
  const resolved = [];
  const tokens = content.match(MENTION_RE) || [];
  for (const token of tokens) {
    const username = token.slice(1).toLowerCase();
    if (seen.has(username)) continue;
    const participant = byUsername.get(username);
    if (participant) {
      seen.add(username);
      resolved.push(participant);
    }
  }
  return resolved;
}

const IMAGE_EXTENSION_RE = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i;
const VIDEO_EXTENSION_RE = /\.(mp4|mov|avi|webm|mkv)$/i;
const LONG_PRESS_MS = 450;

function resolveFileUrl(url) {
  if (!url) return url;
  return url.startsWith("http") || url.startsWith("blob:")
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

function looksLikeImage(message) {
  return (
    IMAGE_EXTENSION_RE.test(message.file_name || message.content || "") ||
    IMAGE_EXTENSION_RE.test(message.file_url || "")
  );
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Plain text wraps at word boundaries (break-words) so Vietnamese diacritics
// never get split mid-character. URLs have no word boundaries to wrap at, so
// they alone get break-all — otherwise they'd overflow the bubble instead of
// wrapping.
function linkifyText(text, validMentions = null) {
  if (!text) return text;
  const parts = text.split(URL_RE);
  return parts.flatMap((part, i) => {
    if (i % 2 === 1) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    const mentionParts = part.split(MENTION_RE);
    return mentionParts.map((mp, j) => {
      if (j % 2 === 1) {
        const username = mp.slice(1);
        const isValid = validMentions != null
          ? validMentions.has(username.toLowerCase())
          : false;
        if (isValid) {
          return (
            <a
              key={`${i}-${j}`}
              href={`/${username}`}
              className="font-medium underline underline-offset-2 text-[#319527] dark:text-[#6bcf60] hover:opacity-75 break-words"
              onClick={(e) => e.stopPropagation()}
            >
              {mp}
            </a>
          );
        }
        return <span key={`${i}-${j}`} className="break-words">{mp}</span>;
      }
      return <span key={`${i}-${j}`} className="break-words">{mp}</span>;
    });
  });
}

export default function PublicChat() {
  const { currentUser, loggedIn } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false); // Default: hide on mobile, can toggle on desktop
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [openReactionMessageId, setOpenReactionMessageId] = useState(null);
  const [localReactions, setLocalReactions] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const messagesContainerRef = useRef(null);
  const longPressTimerRef = useRef(null);

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

  // Initialize showParticipants based on screen size (desktop: true, mobile: false)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Set initial state based on screen size
      if (window.innerWidth >= 1024) {
        setShowParticipants(true); // Desktop: show by default
      } else {
        setShowParticipants(false); // Mobile: hide by default
      }
    }
  }, []);

  // Disable browser scroll restoration
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  // Function to scroll chat container to bottom
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll to bottom only on initial load
  useEffect(() => {
    if (isInitialLoad && messages.length > 0 && !loading) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
        setIsInitialLoad(false);
      }, 100);
    }
  }, [messages, loading, isInitialLoad]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
    loadParticipants();

    // Poll for new messages every 5 seconds (reduced frequency to prevent duplicates)
    const pollInterval = setInterval(() => {
      loadMessages(1, true); // Always check page 1 for new messages
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const loadMessages = async (page = 1, appendNew = false) => {
    try {
      const response = await getPublicChatMessages(page);
      console.log("[PublicChat] loadMessages response:", response);

      // Handle both direct array response and paginated response
      let newMessages = [];
      if (Array.isArray(response.data)) {
        newMessages = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        newMessages = response.data.data;
      } else if (Array.isArray(response)) {
        newMessages = response;
      }

      console.log("[PublicChat] newMessages:", newMessages);

      if (appendNew && page === 1) {
        // Only append messages that are newer than what we have
        // Use functional update to ensure we're using the latest state
        setMessages((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(prevArray.map((m) => m.id));

          // Filter new messages and validate sender info
          const trulyNew = newMessages
            .filter((m) => {
              if (existingIds.has(m.id)) {
                return false; // Skip if already exists
              }

              // Validate sender info - must have sender with username or guest_name
              if (!m.sender && !m.guest_name) {
                console.warn(
                  "[PublicChat] Polling: Skipping message with invalid sender info:",
                  m
                );
                return false;
              }

              return true;
            })
            .map((m) => {
              // Ensure sender info is correct
              if (!m.sender && m.guest_name) {
                // If missing sender but has guest_name, reconstruct it
                m.sender = {
                  id: null,
                  username: m.guest_name,
                  profile_name: m.guest_name,
                  avatar_url: null,
                };
              }
              return m;
            });

          if (trulyNew.length > 0) {
            console.log(
              "[PublicChat] Polling: Adding",
              trulyNew.length,
              "new messages"
            );
            // Merge and deduplicate by ID, maintaining order (newest last)
            const merged = [...prevArray, ...trulyNew];
            // Remove duplicates by keeping only the first occurrence of each ID
            const seen = new Set();
            const unique = merged.filter((m) => {
              if (seen.has(m.id)) {
                return false;
              }
              seen.add(m.id);
              return true;
            });
            return unique;
          }
          return prevArray;
        });
        // Don't auto-scroll when polling - let user scroll naturally
      } else {
        // For initial load or page navigation, replace all messages
        // Also deduplicate to be safe
        const seen = new Set();
        const unique = newMessages.filter((m) => {
          if (seen.has(m.id)) {
            return false;
          }
          seen.add(m.id);
          return true;
        });
        setMessages(unique);
        setHasMorePages(
          response.next_page_url !== null ||
            (response.data && response.data.next_page_url !== null)
        );
        setCurrentPage(page);

        // Don't auto-scroll on initial page load - let user stay at top of page
        // Only scroll when user explicitly sends a message or interacts with chat
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]); // Ensure messages is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      console.log("[PublicChat] loadParticipants called");
      const response = await getPublicChatParticipants();
      console.log("[PublicChat] loadParticipants response:", response);
      console.log("[PublicChat] response.data:", response?.data);
      // Handle response structure: could be response.data or response.data.participants
      let participants = [];
      if (
        response?.data?.participants &&
        Array.isArray(response.data.participants)
      ) {
        participants = response.data.participants;
      } else if (response?.data && Array.isArray(response.data)) {
        participants = response.data;
      } else if (
        response?.participants &&
        Array.isArray(response.participants)
      ) {
        participants = response.participants;
      } else if (Array.isArray(response)) {
        participants = response;
      }
      console.log("[PublicChat] participants array:", participants);
      console.log("[PublicChat] participants length:", participants.length);
      setParticipants(participants);
    } catch (error) {
      console.error("[PublicChat] Error loading participants:", error);
      console.error("[PublicChat] Error details:", error?.response?.data);
      setParticipants([]);
    }
  };

  const handleScrollToMessage = (messageId) => {
    const el = document.getElementById(`public-msg-${messageId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("chat-message-highlight");
    setTimeout(() => el.classList.remove("chat-message-highlight"), 2000);
  };

  const handleSendMessage = async (content, guestName = null, replyToId = null) => {
    if (!content.trim()) return;

    console.log(
      "[PublicChat] handleSendMessage - loggedIn:",
      loggedIn,
      "guestName:",
      guestName,
      "currentUser:",
      currentUser?.username
    );

    // If logged in, ignore guestName completely
    if (loggedIn) {
      guestName = null;
    } else if (!guestName) {
      // Not logged in and no guest name provided
      console.warn("[PublicChat] Not logged in and no guest name provided");
      alert("Vui lòng nhập tên hiển thị");
      throw new Error("Guest name required for unauthenticated users");
    }

    setSending(true);
    try {
      const params = {
        content: content.trim(),
        type: "text",
      };

      if (!loggedIn && guestName) {
        params.guest_name = guestName.trim();
      }

      if (replyToId) {
        params.reply_to_message_id = replyToId;
      }
      setReplyingTo(null);

      console.log("[PublicChat] Sending message with params:", params);
      const response = await sendPublicMessage(params);
      console.log("[PublicChat] sendPublicMessage response:", response);

      // Extract message from response (could be response.data or response.data.data)
      let newMessage = null;
      if (response.data) {
        // If response.data is the message object directly
        if (response.data.id && response.data.content !== undefined) {
          newMessage = response.data;
        } else if (response.data.data && response.data.data.id) {
          // If wrapped in another data property
          newMessage = response.data.data;
        }
      }

      if (!newMessage) {
        console.error("[PublicChat] Invalid response structure:", response);
        throw new Error("Invalid response from server");
      }

      console.log("[PublicChat] Message sent successfully:", newMessage);
      console.log("[PublicChat] newMessage.sender:", newMessage.sender);

      // Server response may not include resolved mentions yet (would otherwise
      // only appear after a poll/refresh). Resolve them locally so @tags render
      // as links immediately.
      if (!Array.isArray(newMessage.mentions) || newMessage.mentions.length === 0) {
        const resolved = resolveMentionsFromParticipants(
          newMessage.content,
          participants
        );
        if (resolved.length > 0) {
          newMessage = { ...newMessage, mentions: resolved };
        }
      }

      // Validate sender info before adding to state
      if (!newMessage.sender || !newMessage.sender.username) {
        console.error(
          "[PublicChat] Missing sender info in response:",
          newMessage
        );
        // Don't add message with invalid sender info, wait for polling to get correct data
        console.warn(
          "[PublicChat] Skipping message with invalid sender, will be added via polling"
        );
      } else {
        // Add to messages list (deduplicate by ID to prevent duplicates)
        setMessages((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          // Check if message already exists (shouldn't happen, but be safe)
          const exists = prevArray.some((m) => m.id === newMessage.id);
          if (exists) {
            return prevArray;
          }
          return [...prevArray, newMessage];
        });
      }

      // Reload participants to include the new sender
      loadParticipants();

      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể gửi tin nhắn";
      alert(errorMessage);
      throw error; // Re-throw to prevent clearing message in MessageInput
    } finally {
      setSending(false);
    }
  };

  const handleSendFile = async (file) => {
    // Only registered users may send attachments; guests are text-only.
    if (!loggedIn || !file) return;

    const isImage =
      file.type?.startsWith("image/") ||
      (!file.type && IMAGE_EXTENSION_RE.test(file.name || ""));
    const isVideo =
      !isImage &&
      (file.type?.startsWith("video/") ||
        (!file.type && VIDEO_EXTENSION_RE.test(file.name || "")));
    const type = isImage ? "image" : isVideo ? "video" : "file";

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("content", file.name);

      const response = await sendPublicMessageWithFile(formData);

      let newMessage = null;
      if (response.data) {
        if (response.data.id && response.data.content !== undefined) {
          newMessage = response.data;
        } else if (response.data.data && response.data.data.id) {
          newMessage = response.data.data;
        }
      }

      if (newMessage && newMessage.sender && newMessage.sender.username) {
        setMessages((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const exists = prevArray.some((m) => m.id === newMessage.id);
          if (exists) return prevArray;
          return [...prevArray, newMessage];
        });
      }

      loadParticipants();

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("Error sending file message:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể gửi tệp đính kèm";
      alert(errorMessage);
      throw error;
    } finally {
      setSending(false);
    }
  };

  const getMessageReactions = (message) => {
    return localReactions[message.id] ?? message.reactions ?? null;
  };

  const handleReact = async (messageId, reactionType, currentRxns) => {
    if (!loggedIn || !reactionType) return;
    try {
      setLocalReactions((prev) => {
        const cur = prev[messageId] ?? currentRxns ?? { summary: [], total: 0, my_reactions: [] };
        const myReactions = [...(cur.my_reactions || []), reactionType];
        let summary = [...(cur.summary || [])];
        const existing = summary.find((s) => s.type === reactionType);

        const uId = currentUser?.id;
        const uUsername = currentUser?.username;
        const uProfileName = currentUser?.profile_name || currentUser?.username;

        if (existing) {
          summary = summary.map((s) => {
            if (s.type !== reactionType) return s;
            let users = [...(s.users || [])];
            const existingUser = users.find((u) => u.id === uId || u.username === uUsername);
            if (existingUser) {
              users = users.map((u) => (u.id === uId || u.username === uUsername) ? { ...u, count: (u.count || 1) + 1 } : u);
            } else {
              users = [...users, { id: uId, username: uUsername, profile_name: uProfileName, count: 1 }];
            }
            return { ...s, count: s.count + 1, users };
          });
        } else {
          summary = [...summary, {
            type: reactionType,
            count: 1,
            users: [{ id: uId, username: uUsername, profile_name: uProfileName, count: 1 }]
          }];
        }
        return { ...prev, [messageId]: { ...cur, summary, total: (cur.total || 0) + 1, my_reactions: myReactions } };
      });
      await reactToMessage(messageId, reactionType);
    } catch (error) {
      console.error("[PublicChat] Error reacting:", error);
    }
    setOpenReactionMessageId(null);
  };

  const handleRemovePublicReaction = async (messageId, currentRxns) => {
    if (!loggedIn) return;
    try {
      setLocalReactions((prev) => {
        const cur = prev[messageId] ?? currentRxns ?? null;
        if (!cur) return prev;
        const myReactions = cur.my_reactions || [];
        let summary = [...(cur.summary || [])];
        const uId = currentUser?.id;
        const uUsername = currentUser?.username;

        myReactions.forEach((type) => {
          summary = summary
            .map((s) => {
              if (s.type !== type) return s;
              let users = [...(s.users || [])];
              users = users
                .map((u) => (u.id === uId || u.username === uUsername) ? { ...u, count: Math.max(0, (u.count || 1) - 1) } : u)
                .filter((u) => u.count > 0);
              return { ...s, count: s.count - 1, users };
            })
            .filter((s) => s.count > 0);
        });
        return { ...prev, [messageId]: { ...cur, summary, total: Math.max(0, (cur.total || 0) - myReactions.length), my_reactions: [] } };
      });
      await removeMessageReaction(messageId);
    } catch (error) {
      console.error("[PublicChat] Error removing reaction:", error);
    }
    setOpenReactionMessageId(null);
  };

  const handleRecallPublic = async (messageId) => {
    try {
      await recallMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_recalled: true, content: null, file_url: null, metadata: null }
            : m
        )
      );
    } catch (error) {
      console.error("[PublicChat] Error recalling message:", error);
    }
  };

  const handleSaveEditPublic = async (newContent) => {
    if (!editingMessage || !newContent.trim()) return;
    try {
      const response = await editMessage(editingMessage.id, { content: newContent.trim() });
      const serverMentions = response?.data?.mentions;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== editingMessage.id) return m;
          const mentions = Array.isArray(serverMentions)
            ? serverMentions
            : resolveMentionsFromParticipants(newContent.trim(), participants);
          return {
            ...m,
            content: newContent.trim(),
            is_edited: true,
            mentions: mentions.length > 0 ? mentions : m.mentions,
          };
        })
      );
    } catch (error) {
      console.error("[PublicChat] Error editing message:", error);
    } finally {
      setEditingMessage(null);
    }
  };

  const getAvatarInitial = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name) return "#gray";
    const colors = [
      "#ef4444",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#6366f1",
      "#14b8a6",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    const days = [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];

    // If message is older than 1 week (7 days), show date format: dd/mm/yyyy
    if (diffDays >= 7) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1)
      return `Hôm qua, lúc ${date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    if (diffDays < 7)
      return `${days[date.getDay()]}, lúc ${date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="border dark:!border-[#585857] rounded-lg long-shadow bg-white dark:bg-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:!border-[#585857] bg-gray-50 dark:!bg-[var(--main-white)]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tán gẫu linh tinh
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-2 rounded-lg transition ${
              showParticipants
                ? "bg-gray-200 dark:bg-neutral-700"
                : "hover:bg-gray-200 dark:hover:bg-neutral-700"
            }`}
          >
            <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col lg:flex-row">
        {/* Messages Area - hidden on mobile when participants is shown */}
        <div
          className={`${
            showParticipants ? "hidden" : "flex"
          } lg:flex flex-1 flex-col`}
          style={{ minHeight: "300px", maxHeight: "400px" }}
        >
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <span>Đang tải tin nhắn...</span>
              </div>
            ) : !Array.isArray(messages) || messages.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <span>Chưa có tin nhắn nào. Hãy là người đầu tiên!</span>
              </div>
            ) : (
              messages.map((message) => {
                const isGuest = message.is_guest;
                // Determine sender name: prioritize sender info, fallback to guest_name, then "Ẩn danh"
                let senderName = "Ẩn danh";
                if (message.sender) {
                  senderName =
                    message.sender.profile_name ||
                    message.sender.username ||
                    "Ẩn danh";
                } else if (message.guest_name) {
                  // Fallback to guest_name if sender info is missing (shouldn't happen, but be safe)
                  senderName = message.guest_name;
                }
                const avatarInitial = getAvatarInitial(senderName);
                const avatarColor = getAvatarColor(senderName);

                const isOwn = !!(message.is_myself || (currentUser?.username && message.sender?.username === currentUser.username));

                return (
                  <div
                    key={message.id}
                    id={`public-msg-${message.id}`}
                    className="group relative flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800 px-2 py-1 -mx-2 rounded transition"
                    onMouseEnter={() => setHoveredMessageId(message.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                    onContextMenu={(e) => e.stopPropagation()}
                  >
                    {/* Avatar */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {message.sender?.avatar_url ? (
                        <img
                          src={message.sender.avatar_url}
                          alt={senderName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        avatarInitial
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          @{senderName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          {formatTime(message.created_at)}
                          {message.is_edited && !message.is_recalled && <span className="italic">(Đã sửa)</span>}
                        </span>
                        {/* Action buttons — visible on hover, registered users only */}
                        {loggedIn && !message.is_recalled && (
                          <>
                            <button
                              type="button"
                              title="Trả lời"
                              onClick={() => setReplyingTo({
                                id: message.id,
                                content: message.content,
                                type: message.type,
                                file_url: message.file_url || null,
                                sender: message.sender,
                                isSelf: isOwn,
                              })}
                              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-400 transition-opacity ${hoveredMessageId === message.id ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                            >
                              <CornerUpLeft className="w-3 h-3" />
                            </button>
                            {isOwn && message.type === "text" && (
                              <button
                                type="button"
                                title="Sửa tin nhắn"
                                onClick={() => setEditingMessage({ id: message.id, content: message.content || "" })}
                                className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-400 transition-opacity ${hoveredMessageId === message.id ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                            {isOwn && (
                              <button
                                type="button"
                                title="Thu hồi"
                                onClick={() => handleRecallPublic(message.id)}
                                className={`p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 transition-opacity ${hoveredMessageId === message.id ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                              >
                                <Undo2 className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      {message.reply_to && (
                        <ReplyPreviewBubble
                          replyTo={message.reply_to}
                          isOwn={false}
                          onClick={() => handleScrollToMessage(message.reply_to.id)}
                        />
                      )}
                      {message.is_recalled ? (
                        <p className="text-sm italic text-gray-400 dark:text-gray-500">Tin nhắn đã bị thu hồi</p>
                      ) : message.type === "image" ||
                      (message.type === "file" && looksLikeImage(message)) ? (
                        <div
                          className="relative rounded-lg overflow-hidden max-w-[240px] cursor-pointer"
                          onClick={() =>
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
                            src={resolveFileUrl(message.file_url)}
                            alt={message.content || "image"}
                            className="w-full h-auto max-h-[300px] object-cover"
                          />
                        </div>
                      ) : message.type === "video" ? (
                        <div
                          className="relative rounded-lg overflow-hidden max-w-[240px] cursor-pointer"
                          onClick={() =>
                            setLightboxMedia({
                              type: "video",
                              url: resolveFileUrl(message.file_url),
                              poster: resolveFileUrl(
                                message.metadata?.thumbnail_url
                              ),
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
                            poster={resolveFileUrl(
                              message.metadata?.thumbnail_url
                            )}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-auto max-h-[300px] object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                            <PlayCircle className="w-10 h-10 text-white drop-shadow" />
                          </div>
                        </div>
                      ) : message.type === "file" ? (
                        <a
                          href={resolveFileUrl(message.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm max-w-[240px] bg-gray-200 dark:bg-neutral-600 dark:text-white"
                          onMouseDown={(e) => { if (e.button === 0) startLongPress(message.id); }}
                          onMouseMove={clearLongPressTimer}
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
                              {message.content ||
                                message.file_name ||
                                "Tệp đính kèm"}
                            </span>
                            {message.file_size ? (
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
                          className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap"
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
                            Array.isArray(message.mentions)
                              ? new Set(message.mentions.map((m) => m.username.toLowerCase()))
                              : null
                          )}
                        </div>
                      )}

                      {/* Reactions */}
                      {loggedIn && (() => {
                        const rxns = getMessageReactions(message);
                        return (
                          <MessageReactions
                            reactions={rxns}
                            isOwn={isOwn}
                            open={openReactionMessageId === message.id}
                            onOpenChange={(v) => setOpenReactionMessageId(v ? message.id : null)}
                            onReact={(type) => handleReact(message.id, type, rxns)}
                            onRemove={() => handleRemovePublicReaction(message.id, rxns)}
                            onReply={() => setReplyingTo({
                              id: message.id,
                              content: message.content,
                              type: message.type,
                              file_url: message.file_url || null,
                              sender: message.sender,
                              isSelf: isOwn,
                            })}
                            onCopy={message.type === "text" && !message.is_recalled ? () => {
                              navigator.clipboard.writeText(message.content);
                              antdMessage.success("Đã sao chép tin nhắn");
                            } : undefined}
                            onRecall={isOwn && !message.is_recalled ? () => handleRecallPublic(message.id) : undefined}
                            onEdit={isOwn && message.type === "text" && !message.is_recalled ? () => setEditingMessage({ id: message.id, content: message.content || "" }) : undefined}
                            inline
                          />
                        );
                      })()}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Participants Sidebar - toggle on both desktop and mobile */}
        {/* Mobile: show when showParticipants is true, Desktop: show when showParticipants is true */}
        {showParticipants && (
          <div
            className="flex w-full lg:w-64 border-l dark:!border-[#585857] bg-gray-50 dark:!bg-[var(--main-white)] flex-col"
            style={{
              minHeight: "300px",
              maxHeight: "400px",
            }}
          >
            <div className="px-4 pt-4 pb-2 border-b dark:!border-[#585857] flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Người tham gia ({participants.length})
                </h3>
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{ minHeight: "calc(400px - 60px)" }}
            >
              <ParticipantsList participants={participants} />
            </div>
          </div>
        )}
      </div>

      {/* Message Input - Full width spanning both columns */}
      <div className="border-t dark:!border-[#585857] p-4 bg-gray-50 dark:!bg-[var(--main-white)]">
        <MessageInput
          onSend={handleSendMessage}
          onSendFile={handleSendFile}
          sending={sending}
          loggedIn={loggedIn}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          editingMessage={editingMessage}
          onSaveEdit={handleSaveEditPublic}
          onCancelEdit={() => setEditingMessage(null)}
        />
      </div>

      <ChatMediaLightbox
        media={lightboxMedia}
        onClose={() => setLightboxMedia(null)}
      />

    </div>
  );
}
