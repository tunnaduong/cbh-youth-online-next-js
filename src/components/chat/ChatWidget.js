"use client";

import { useState } from "react";
import { useChatContext } from "@/contexts/Support";
import ChatHeader from "./ChatHeader";
import ChatThreadsList from "./ChatThreadsList";
import ChatConversation from "./ChatConversation";
import NewChatDialog from "./NewChatDialog";

export default function ChatWidget() {
  const {
    isOpen,
    isMinimized,
    conversations,
    selectedConversationId,
    toggleChat,
    minimizeChat,
    maximizeChat,
    closeChat,
    selectConversation,
    loadConversations,
  } = useChatContext();

  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [previewParticipant, setPreviewParticipant] = useState(null); // For new conversation preview

  if (!isOpen) return null;

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const handleNewChat = () => {
    setShowNewChatDialog(true);
  };

  const handleCloseNewChatDialog = () => {
    setShowNewChatDialog(false);
  };

  const handleConversationCreated = async (conversation) => {
    // If conversation already exists (has id), select it
    if (conversation.id) {
      await loadConversations();
      selectConversation(conversation.id);
      setPreviewParticipant(null);
    } else if (conversation.participant) {
      // This is a preview - just show the preview
      setPreviewParticipant(conversation.participant);
    }

    // Close dialog
    setShowNewChatDialog(false);
  };

  const handleSettings = () => {
    // TODO: Implement settings functionality
    console.log("Settings clicked");
  };

  const handleMinimize = () => {
    if (isMinimized) {
      maximizeChat();
    } else {
      minimizeChat();
    }
  };

  const handleClose = () => {
    closeChat();
  };

  const handleSelectConversation = (conversationId) => {
    selectConversation(conversationId);
  };

  const handleBackToThreads = () => {
    selectConversation(null);
  };

  return (
    <div
      className={`fixed bottom-4 right-4 w-[90vw] max-w-[384px] bg-white dark:bg-neutral-700 rounded-lg overflow-hidden shadow-2xl z-50 flex flex-col transition-all duration-300 ${
        isMinimized ? "h-auto" : "h-[600px] max-h-[65vh]"
      }`}
    >
      {/* Header */}
      <ChatHeader
        conversation={
          previewParticipant
            ? {
                id: null,
                participants: [{ ...previewParticipant }],
                type: "private",
              }
            : selectedConversation
        }
        onNewChat={handleNewChat}
        onSettings={handleSettings}
        onMinimize={handleMinimize}
        onClose={handleClose}
        onBack={
          showNewChatDialog
            ? handleCloseNewChatDialog
            : previewParticipant || selectedConversationId
            ? () => {
                setPreviewParticipant(null);
                handleBackToThreads();
              }
            : null
        }
        isMinimized={isMinimized}
        showNewChatDialog={showNewChatDialog}
      />

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 border-t dark:border-neutral-600">
          {showNewChatDialog ? (
            <NewChatDialog
              onClose={handleCloseNewChatDialog}
              onConversationCreated={handleConversationCreated}
            />
          ) : previewParticipant ? (
            <ChatConversation
              conversationId={null}
              previewParticipant={previewParticipant}
              onConversationCreated={(conversationId) => {
                // Clear preview when conversation is created
                setPreviewParticipant(null);
              }}
            />
          ) : selectedConversationId ? (
            <ChatConversation conversationId={selectedConversationId} />
          ) : (
            <ChatThreadsList onSelectConversation={handleSelectConversation} />
          )}
        </div>
      )}
    </div>
  );
}
