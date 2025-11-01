"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/Support";
import {
  getPublicChatMessages,
  sendPublicMessage,
  getPublicChatParticipants,
} from "@/app/Api";
import MessageInput from "./MessageInput";
import ParticipantsList from "./ParticipantsList";
import { Menu } from "lucide-react";

export default function PublicChat() {
  const { currentUser, loggedIn } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true); // Default: show on desktop
  const messagesContainerRef = useRef(null);

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

  const handleSendMessage = async (content, guestName = null) => {
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

                return (
                  <div
                    key={message.id}
                    className="flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800 px-2 py-1 -mx-2 rounded transition"
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
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Participants Sidebar - toggle on both desktop and mobile */}
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
          sending={sending}
          loggedIn={loggedIn}
        />
      </div>
    </div>
  );
}
