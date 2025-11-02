"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatContext } from "@/contexts/Support";
import moment from "moment";
import "moment/locale/vi";
import ChatMessageInput from "./ChatMessageInput";

export default function ChatConversation({
  conversationId,
  previewParticipant,
  onConversationCreated,
}) {
  const {
    messages,
    sendMessage,
    sending,
    selectedConversationId,
    loadMessages,
    createConversation,
    loadConversations,
    selectConversation,
  } = useChatContext();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true); // Start as true to allow loading
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesContainerRef = useRef(null);
  const conversationMessages = conversationId ? (messages[conversationId] || []) : [];

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
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
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
                container.scrollTop = container.scrollHeight - currentScrollHeight;
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
        <ChatMessageInput onSend={handleSendMessage} sending={sending} />
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
        <ChatMessageInput onSend={handleSendMessage} sending={sending} />
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
        
        {conversationMessages.map((message) => (
          <div
            key={message.id}
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
              className={`flex flex-col max-w-[70%] ${
                message.is_myself ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 min-w-0">
                {!message.is_myself && (
                  message.sender?.username ? (
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
                  )
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {message.created_at_human || formatTimestamp(message.created_at)}
                </span>
              </div>
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.is_myself
                    ? "bg-[#319527] text-white"
                    : "bg-gray-200 dark:bg-neutral-600 dark:text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <ChatMessageInput onSend={handleSendMessage} sending={sending} />
    </div>
  );
}

