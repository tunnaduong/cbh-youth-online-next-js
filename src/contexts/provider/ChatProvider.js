"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import ChatContext from "../ChatContext";
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
  markAsRead as markAsReadApi,
  createPrivateConversation,
} from "@/app/Api";
import { useAuthContext } from "../Support";
import {
  unsubscribeFromPushNotifications,
  formatSubscriptionForServer,
  subscribeToPushNotifications as subscribePush,
  getPushSubscription,
} from "@/utils/pushNotifications";
import {
  subscribeToPushNotifications as subscribePushApi,
  unsubscribeFromPushNotifications as unsubscribePushApi,
} from "@/app/Api";

const ChatProvider = ({ children }) => {
  const { loggedIn } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState({}); // { conversationId: [messages] }
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const conversationsPollIntervalRef = useRef(null);
  const messagesPollIntervalRef = useRef(null);
  const previousConversationsRef = useRef([]); // Track previous conversations to detect new messages
  const notificationPermissionRequestedRef = useRef(false);
  const pushSubscriptionRef = useRef(null); // Track push subscription
  const subscriptionSentToServerRef = useRef(false); // Track if subscription has been sent to server

  // Check for new messages and show notifications
  const checkForNewMessages = useCallback(
    (newConversations, isOpen, isMinimized, selectedConversationId) => {
      if (!Array.isArray(newConversations) || newConversations.length === 0) {
        return;
      }

      if (typeof window === "undefined" || !("Notification" in window)) {
        console.log("[ChatProvider] Browser doesn't support notifications");
        return;
      }

      // Don't show notification if permission is not granted
      if (Notification.permission !== "granted") {
        console.log(
          "[ChatProvider] Notification permission not granted:",
          Notification.permission
        );
        return;
      }

      const previousConversations = previousConversationsRef.current;

      newConversations.forEach((conversation) => {
        // Find previous conversation
        const previousConversation = previousConversations.find(
          (c) => c.id === conversation.id
        );

        // Skip if no latest_message at all
        if (!conversation.latest_message) {
          // If we had a message before but now don't, skip
          return;
        }

        // Skip if latest_message doesn't have created_at (used for comparison)
        if (!conversation.latest_message.created_at) {
          console.log(
            "[ChatProvider] Latest message has no created_at:",
            conversation.latest_message
          );
          return;
        }

        // Check if there's a new message
        // We need previous conversation to exist AND have a latest_message to compare
        // Since API doesn't return message id in latest_message, we compare created_at
        const hasNewMessage =
          previousConversation &&
          previousConversation.latest_message &&
          previousConversation.latest_message.created_at &&
          previousConversation.latest_message.created_at !==
            conversation.latest_message.created_at;

        if (hasNewMessage) {
          const message = conversation.latest_message;

          // Don't show notification if message is from current user
          if (message.is_myself) {
            console.log("[ChatProvider] Skipping notification - own message");
            return;
          }

          // Don't show notification if this conversation is currently selected and chat is open
          if (
            isOpen &&
            !isMinimized &&
            selectedConversationId === conversation.id
          ) {
            console.log(
              "[ChatProvider] Skipping notification - conversation is open"
            );
            return;
          }

          // Get sender name - API returns sender as string (username or guest_name)
          // For private conversations, get name from participants
          const senderName = message.is_myself
            ? "Bạn"
            : conversation.type === "group"
            ? typeof message.sender === "string"
              ? message.sender
              : message.sender?.profile_name ||
                message.sender?.username ||
                "Người dùng"
            : conversation.participants?.[0]?.profile_name ||
              conversation.participants?.[0]?.username ||
              "Người dùng";
          const conversationName =
            conversation.type === "group"
              ? conversation.name || "Nhóm"
              : conversation.participants?.[0]?.profile_name ||
                conversation.participants?.[0]?.username ||
                "Người dùng";

          // Get message preview
          const messagePreview =
            message.content?.length > 50
              ? message.content.substring(0, 50) + "..."
              : message.content || "";

          // Get avatar URL from participants for private conversations
          const avatarUrl =
            conversation.type === "group"
              ? "/images/placeholder-user.jpg"
              : conversation.participants?.[0]?.avatar_url ||
                "/images/placeholder-user.jpg";

          console.log("[ChatProvider] Showing notification for:", {
            senderName,
            conversationName,
            messagePreview,
          });

          try {
            const notification = new Notification(
              conversation.type === "group"
                ? `${senderName} trong ${conversationName}`
                : senderName,
              {
                body: messagePreview,
                icon: avatarUrl,
                tag: `chat-${conversation.id}-${message.created_at}`, // Prevent duplicate notifications
                requireInteraction: false,
                silent: false,
              }
            );

            console.log("[ChatProvider] Notification created:", notification);

            // Close notification after 5 seconds
            setTimeout(() => {
              notification.close();
            }, 5000);

            // Handle click on notification
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch (error) {
            console.error("[ChatProvider] Error showing notification:", error);
          }
        } else {
          // Log for debugging - but only if we have a previous conversation to compare
          if (previousConversation && previousConversation.latest_message) {
            console.log("[ChatProvider] No new message detected", {
              conversationId: conversation.id,
              previousMessageCreatedAt:
                previousConversation.latest_message.created_at,
              currentMessageCreatedAt: conversation.latest_message?.created_at,
              messagesMatch:
                previousConversation.latest_message.created_at ===
                conversation.latest_message?.created_at,
            });
          } else if (!previousConversation) {
            // First time seeing this conversation - initialize for future comparisons
            console.log(
              "[ChatProvider] First time seeing conversation:",
              conversation.id,
              "latest_message created_at:",
              conversation.latest_message?.created_at || "none"
            );
          }
        }
      });

      // Update previous conversations - deep clone to preserve message created_at
      previousConversationsRef.current = newConversations.map((c) => {
        const cloned = {
          ...c,
          latest_message: c.latest_message
            ? {
                ...c.latest_message,
                created_at: c.latest_message.created_at,
                content: c.latest_message.content,
                is_myself: c.latest_message.is_myself,
              }
            : null,
        };
        return cloned;
      });

      // Debug: Log what we're storing
      console.log(
        "[ChatProvider] Updated previous conversations:",
        previousConversationsRef.current.map((c) => ({
          id: c.id,
          latest_message_created_at: c.latest_message?.created_at,
        }))
      );
    },
    []
  );

  // Polling: Load conversations every 10 seconds
  const loadConversations = useCallback(async () => {
    if (!loggedIn) return;

    try {
      const response = await getConversations();
      const data = response?.data || response;
      if (Array.isArray(data)) {
        // Check for new messages before updating state
        checkForNewMessages(data, isOpen, isMinimized, selectedConversationId);
        setConversations(data);
      }
    } catch (error) {
      console.error("[ChatProvider] Error loading conversations:", error);
    }
  }, [
    loggedIn,
    isOpen,
    isMinimized,
    selectedConversationId,
    checkForNewMessages,
  ]);

  // Polling: Load messages for selected conversation every 5 seconds
  const loadMessages = useCallback(
    async (conversationId, page = 1, append = false) => {
      if (!loggedIn || !conversationId) return { messages: [], pagination: {} };

      try {
        const response = await getMessages(conversationId, page);
        const responseData = response?.data || response;

        let messagesData = [];
        let paginationInfo = {};

        if (Array.isArray(responseData)) {
          messagesData = responseData;
        } else if (responseData?.data && Array.isArray(responseData.data)) {
          messagesData = responseData.data;
          paginationInfo = {
            current_page: responseData.current_page,
            has_more_pages: responseData.has_more_pages || false,
            last_page: responseData.last_page,
          };
        }

        setMessages((prev) => ({
          ...prev,
          [conversationId]: append
            ? [...messagesData, ...(prev[conversationId] || [])]
            : messagesData,
        }));

        return { messages: messagesData, pagination: paginationInfo };
      } catch (error) {
        console.error("[ChatProvider] Error loading messages:", error);
        return { messages: [], pagination: {} };
      }
    },
    [loggedIn]
  );

  // Send message
  const sendMessage = useCallback(
    async (conversationId, content, type = "text") => {
      if (!loggedIn || !conversationId || !content?.trim()) return;

      setSending(true);
      try {
        const response = await sendMessageApi(conversationId, {
          content: content.trim(),
          type,
        });

        const messageData = response?.data || response;

        // Add message to local state immediately
        setMessages((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), messageData],
        }));

        // Reload messages to get the latest (without pagination for polling)
        const result = await loadMessages(conversationId);
        if (result && result.messages) {
          setMessages((prev) => ({
            ...prev,
            [conversationId]: result.messages,
          }));
        }

        return messageData;
      } catch (error) {
        console.error("[ChatProvider] Error sending message:", error);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [loggedIn, loadMessages]
  );

  // Mark conversation as read
  const markAsRead = useCallback(
    async (conversationId) => {
      if (!loggedIn || !conversationId) return;

      try {
        await markAsReadApi(conversationId);
        // Update conversations to clear unread count
        await loadConversations();
      } catch (error) {
        console.error("[ChatProvider] Error marking as read:", error);
      }
    },
    [loggedIn, loadConversations]
  );

  // Create new conversation
  const createConversation = useCallback(
    async (userId) => {
      if (!loggedIn || !userId) return;

      try {
        const response = await createPrivateConversation({
          participant_id: userId,
        });
        const conversationData = response?.data || response;

        // Handle response format - API returns { conversation_id: ... }
        const conversation = conversationData.conversation_id
          ? { id: conversationData.conversation_id }
          : conversationData;

        // Reload conversations
        await loadConversations();

        // Select the new conversation
        if (conversation?.id) {
          setSelectedConversationId(conversation.id);
        }

        return conversation;
      } catch (error) {
        console.error("[ChatProvider] Error creating conversation:", error);
        throw error;
      }
    },
    [loggedIn, loadConversations]
  );

  // Select conversation
  const selectConversation = useCallback(
    async (conversationId) => {
      setSelectedConversationId(conversationId);

      // Load messages if not already loaded
      if (!messages[conversationId]) {
        const result = await loadMessages(conversationId);
        if (result && result.messages) {
          setMessages((prev) => ({
            ...prev,
            [conversationId]: result.messages,
          }));
        }
      }

      // Mark as read
      await markAsRead(conversationId);
    },
    [messages, loadMessages, markAsRead]
  );

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.log("[ChatProvider] Browser doesn't support notifications");
      return false;
    }

    console.log(
      "[ChatProvider] Current notification permission:",
      Notification.permission
    );

    // Check if permission was already requested
    if (notificationPermissionRequestedRef.current) {
      console.log(
        "[ChatProvider] Permission already requested, current status:",
        Notification.permission
      );
      return Notification.permission === "granted";
    }

    // Check if permission was already granted or denied
    if (Notification.permission === "granted") {
      notificationPermissionRequestedRef.current = true;
      console.log("[ChatProvider] Permission already granted");
      return true;
    }

    if (Notification.permission === "denied") {
      notificationPermissionRequestedRef.current = true;
      console.log("[ChatProvider] Permission already denied");
      return false;
    }

    // Request permission
    console.log("[ChatProvider] Requesting notification permission...");
    try {
      const permission = await Notification.requestPermission();
      notificationPermissionRequestedRef.current = true;

      if (permission === "granted") {
        console.log("[ChatProvider] Notification permission granted!");
        return true;
      } else {
        console.log(
          "[ChatProvider] Notification permission denied:",
          permission
        );
        return false;
      }
    } catch (error) {
      console.error(
        "[ChatProvider] Error requesting notification permission:",
        error
      );
      return false;
    }
  }, []);

  // Subscribe to push notifications for chat when logged in
  const subscribeToChatPush = useCallback(async () => {
    try {
      console.log(
        "[ChatProvider] Attempting to subscribe to chat push notifications"
      );

      // Check notification permission first
      if (!("Notification" in window)) {
        console.warn("[ChatProvider] Browser doesn't support notifications");
        return;
      }

      if (Notification.permission !== "granted") {
        console.log(
          "[ChatProvider] Notification permission not granted, requesting..."
        );
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn(
            "[ChatProvider] Notification permission denied:",
            permission
          );
          return;
        }
      }

      console.log(
        "[ChatProvider] Notification permission granted, subscribing to push..."
      );

      let subscription;
      try {
        console.log("[ChatProvider] Calling subscribePush()...");
        subscription = await subscribePush();
        console.log(
          "[ChatProvider] subscribePush() completed, subscription:",
          subscription ? "Yes" : "No"
        );
      } catch (error) {
        console.error("[ChatProvider] Error in subscribePush():", error);
        throw error; // Re-throw to be caught by outer try-catch
      }

      if (subscription) {
        console.log(
          "[ChatProvider] Push subscription created:",
          subscription.endpoint
        );
        pushSubscriptionRef.current = subscription;

        // Check if this endpoint was already sent to server (using localStorage)
        // This persists across page refreshes
        const storedEndpoint = localStorage.getItem('push_subscription_endpoint');
        const currentEndpoint = subscription.endpoint;
        
        // Only send to server if endpoint changed or not yet stored
        if (!subscriptionSentToServerRef.current && storedEndpoint !== currentEndpoint) {
          const formattedSubscription =
            formatSubscriptionForServer(subscription);

          if (formattedSubscription) {
            console.log(
              "[ChatProvider] Sending subscription to server...",
              formattedSubscription
            );

            try {
              const response = await subscribePushApi({
                ...formattedSubscription,
                type: "chat", // Mark as chat subscription (though server might ignore this)
              });

              console.log(
                "[ChatProvider] Successfully subscribed to chat push notifications",
                response
              );

              // Mark as sent and store endpoint in localStorage
              subscriptionSentToServerRef.current = true;
              localStorage.setItem('push_subscription_endpoint', currentEndpoint);
            } catch (error) {
              console.error(
                "[ChatProvider] Failed to subscribe to push notifications on server:",
                error
              );
              // Don't store endpoint if server call failed
            }
          } else {
            console.error(
              "[ChatProvider] Failed to format subscription for server"
            );
          }
        } else {
          if (storedEndpoint === currentEndpoint) {
            console.log(
              "[ChatProvider] Subscription with this endpoint already sent to server, skipping..."
            );
          } else {
            console.log(
              "[ChatProvider] Subscription already sent to server (ref), skipping..."
            );
          }
          // Mark as sent to prevent duplicate sends in same session
          subscriptionSentToServerRef.current = true;
        }
      } else {
        console.error("[ChatProvider] Failed to create push subscription");
      }
    } catch (error) {
      console.error("[ChatProvider] Error subscribing to chat push:", error);
      console.error("[ChatProvider] Error details:", {
        message: error.message,
        stack: error.stack,
      });
      // Continue even if push subscription fails
    }
  }, []);

  // Chat controls
  const openChat = useCallback(async () => {
    setIsOpen(true);
    setIsMinimized(false);

    // Request notification permission when chat is opened for the first time
    if (!notificationPermissionRequestedRef.current) {
      await requestNotificationPermission();
    }

    // Subscribe to push notifications when opening chat (if not already subscribed)
    if (loggedIn && !pushSubscriptionRef.current) {
      console.log(
        "[ChatProvider] Opening chat, attempting to subscribe to push..."
      );
      try {
        await subscribeToChatPush();
      } catch (error) {
        console.error(
          "[ChatProvider] Error subscribing when opening chat:",
          error
        );
      }
    }

    if (loggedIn) {
      await loadConversations();
    }
  }, [
    loggedIn,
    loadConversations,
    requestNotificationPermission,
    // subscribeToChatPush is stable (useCallback with empty deps), no need in array
  ]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setSelectedConversationId(null);
  }, []);

  const toggleChat = useCallback(() => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }, [isOpen, openChat, closeChat]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeChat = useCallback(() => {
    setIsMinimized(false);
  }, []);

  // Setup polling for messages when chat is open and conversation is selected
  useEffect(() => {
    if (loggedIn && isOpen && !isMinimized && selectedConversationId) {
      // Poll messages for selected conversation every 5 seconds
      messagesPollIntervalRef.current = setInterval(() => {
        loadMessages(selectedConversationId).then((result) => {
          if (result && result.messages) {
            setMessages((prev) => ({
              ...prev,
              [selectedConversationId]: result.messages,
            }));
          }
        });
      }, 5000);
    }

    return () => {
      if (messagesPollIntervalRef.current) {
        clearInterval(messagesPollIntervalRef.current);
      }
    };
  }, [loggedIn, isOpen, isMinimized, selectedConversationId, loadMessages]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId && loggedIn) {
      loadMessages(selectedConversationId).then((result) => {
        if (result && result.messages) {
          setMessages((prev) => ({
            ...prev,
            [selectedConversationId]: result.messages,
          }));
        }
      });
      markAsRead(selectedConversationId);
    }
  }, [selectedConversationId, loggedIn, loadMessages, markAsRead]);

  // Unsubscribe from push notifications when logged out
  const unsubscribeFromChatPush = useCallback(async () => {
    try {
      const subscription = await getPushSubscription();
      if (subscription) {
        // Try to unsubscribe from server if user is still authenticated
        // If user already logged out, this will fail silently
        try {
          await unsubscribePushApi(subscription.endpoint);
          console.log("[ChatProvider] Unsubscribed from server");
        } catch (serverError) {
          // If user already logged out, server will return 401/500
          // Just log and continue with local unsubscribe
          console.log(
            "[ChatProvider] Could not unsubscribe from server (user may have logged out):",
            serverError.message
          );
        }

             // Always unsubscribe locally (from browser push manager)
             await unsubscribeFromPushNotifications();
             pushSubscriptionRef.current = null;
             subscriptionSentToServerRef.current = false; // Reset flag when unsubscribing
             
             // Clear stored endpoint from localStorage
             localStorage.removeItem('push_subscription_endpoint');
             
             console.log(
               "[ChatProvider] Successfully unsubscribed from chat push notifications (local)"
             );
      }
    } catch (error) {
      console.error(
        "[ChatProvider] Error unsubscribing from chat push:",
        error
      );
    }
  }, []);

  // Initialize: Start polling conversations and subscribe to push when user is logged in
  useEffect(() => {
    console.log("[ChatProvider] useEffect triggered, loggedIn:", loggedIn);

    if (loggedIn) {
      console.log(
        "[ChatProvider] User is logged in, initializing chat push subscription..."
      );

      // Subscribe to push notifications for chat
      // Use setTimeout to ensure service worker is ready
      const subscribeTimer = setTimeout(() => {
        console.log(
          "[ChatProvider] Timer expired, calling subscribeToChatPush..."
        );
        subscribeToChatPush().catch((error) => {
          console.error("[ChatProvider] Error in subscribeToChatPush:", error);
        });
      }, 2000); // Increase timeout to 2 seconds

      // Initial load - but don't check for notifications on first load
      // Just populate previousConversationsRef for future comparisons
      loadConversations().then(() => {
        // After initial load, set previous conversations for comparison
        // This will be updated after first load completes
      });

      // Start polling conversations every 10 seconds (to detect new messages for notifications)
      conversationsPollIntervalRef.current = setInterval(() => {
        loadConversations();
      }, 10000);

      return () => {
        clearTimeout(subscribeTimer);
        if (conversationsPollIntervalRef.current) {
          clearInterval(conversationsPollIntervalRef.current);
        }
      };
    } else {
      console.log(
        "[ChatProvider] User is not logged in, unsubscribing from chat push..."
      );
      // Unsubscribe when logged out
      unsubscribeFromChatPush();

    return () => {
      if (conversationsPollIntervalRef.current) {
        clearInterval(conversationsPollIntervalRef.current);
      }
    };
    }
  }, [
    loggedIn,
    loadConversations,
    // Note: subscribeToChatPush and unsubscribeFromChatPush are useCallback,
    // so they're stable and don't need to be in dependencies
  ]);

  const value = {
    // State
    isOpen,
    isMinimized,
    conversations,
    selectedConversationId,
    messages,
    loading,
    sending,

    // Actions
    openChat,
    closeChat,
    toggleChat,
    minimizeChat,
    maximizeChat,
    loadConversations,
    selectConversation,
    loadMessages,
    sendMessage,
    markAsRead,
    createConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ChatProvider;
