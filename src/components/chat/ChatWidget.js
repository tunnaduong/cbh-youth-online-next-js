"use client";

import { useState } from "react";
import { useChatContext } from "@/contexts/Support";
import ChatHeader from "./ChatHeader";
import ChatThreadsList from "./ChatThreadsList";
import ChatConversation from "./ChatConversation";
import NewChatDialog from "./NewChatDialog";
import NewGroupDialog from "./NewGroupDialog";
import GroupInfoModal from "./GroupInfoModal";
import ChatBackgroundModal from "./ChatBackgroundModal";

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
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
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

  const handleNewGroup = () => {
    setShowNewGroupDialog(true);
  };

  const handleCloseNewGroupDialog = () => {
    setShowNewGroupDialog(false);
  };

  const handleGroupCreated = async (group) => {
    await loadConversations();
    if (group?.id) {
      selectConversation(group.id);
    }
    setShowNewGroupDialog(false);
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
    if (selectedConversation?.type === "group") {
      setShowGroupInfo(true);
    }
  };

  const handleGroupUpdated = () => {
    loadConversations();
  };

  const handleBackgroundChanged = () => {
    loadConversations();
  };

  const handleLeftGroup = () => {
    loadConversations();
    selectConversation(null);
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
        onNewGroup={handleNewGroup}
        onSettings={handleSettings}
        onBackground={() => setShowBackgroundModal(true)}
        onMinimize={handleMinimize}
        onClose={handleClose}
        onBack={
          showNewChatDialog
            ? handleCloseNewChatDialog
            : showNewGroupDialog
            ? handleCloseNewGroupDialog
            : previewParticipant || selectedConversationId
            ? () => {
                setPreviewParticipant(null);
                handleBackToThreads();
              }
            : null
        }
        isMinimized={isMinimized}
        showNewChatDialog={showNewChatDialog}
        showNewGroupDialog={showNewGroupDialog}
      />

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 border-t dark:border-neutral-600">
          {showNewChatDialog ? (
            <NewChatDialog
              onClose={handleCloseNewChatDialog}
              onConversationCreated={handleConversationCreated}
            />
          ) : showNewGroupDialog ? (
            <NewGroupDialog
              onClose={handleCloseNewGroupDialog}
              onGroupCreated={handleGroupCreated}
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
            <ChatConversation
              conversationId={selectedConversationId}
              conversation={selectedConversation}
            />
          ) : (
            <ChatThreadsList onSelectConversation={handleSelectConversation} />
          )}
        </div>
      )}

      <GroupInfoModal
        conversationId={selectedConversationId}
        show={showGroupInfo && selectedConversation?.type === "group"}
        onClose={() => setShowGroupInfo(false)}
        onGroupUpdated={handleGroupUpdated}
        onLeftGroup={handleLeftGroup}
      />

      <ChatBackgroundModal
        conversationId={selectedConversationId}
        show={showBackgroundModal && !!selectedConversationId}
        onClose={() => setShowBackgroundModal(false)}
        onBackgroundChanged={handleBackgroundChanged}
      />
    </div>
  );
}
