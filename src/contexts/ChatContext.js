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
  markAsRead: () => {},
  createConversation: () => {},
  sendTyping: () => {},
});

export default ChatContext;

