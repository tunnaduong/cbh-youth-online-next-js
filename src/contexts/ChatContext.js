"use client";

import { createContext } from "react";

const ChatContext = createContext({
  // State
  isOpen: false,
  isMinimized: false,
  conversations: [],
  selectedConversationId: null,
  messages: {},
  loading: false,
  sending: false,
  typingUsers: {},
  highlightMessageId: null,

  // Actions
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  minimizeChat: () => {},
  maximizeChat: () => {},
  loadConversations: () => {},
  selectConversation: () => {},
  loadMessages: () => {},
  sendMessage: () => {},
  sendFileMessage: () => {},
  markAsRead: () => {},
  createConversation: () => {},
  sendTyping: () => {},
  reactToMessage: () => {},
  removeMessageReaction: () => {},
  setHighlightMessageId: () => {},
});

export default ChatContext;

