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
});

export default ChatContext;

