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

  // Polling: Load conversations every 10 seconds
  const loadConversations = useCallback(async () => {
    if (!loggedIn) return;
    
    try {
      const response = await getConversations();
      const data = response?.data || response;
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (error) {
      console.error("[ChatProvider] Error loading conversations:", error);
    }
  }, [loggedIn]);

  // Polling: Load messages for selected conversation every 5 seconds
  const loadMessages = useCallback(async (conversationId, page = 1, append = false) => {
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
  }, [loggedIn]);

  // Send message
  const sendMessage = useCallback(async (conversationId, content, type = 'text') => {
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
  }, [loggedIn, loadMessages]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId) => {
    if (!loggedIn || !conversationId) return;
    
    try {
      await markAsReadApi(conversationId);
      // Update conversations to clear unread count
      await loadConversations();
    } catch (error) {
      console.error("[ChatProvider] Error marking as read:", error);
    }
  }, [loggedIn, loadConversations]);

  // Create new conversation
  const createConversation = useCallback(async (userId) => {
    if (!loggedIn || !userId) return;
    
    try {
      const response = await createPrivateConversation({ participant_id: userId });
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
  }, [loggedIn, loadConversations]);

  // Select conversation
  const selectConversation = useCallback(async (conversationId) => {
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
  }, [messages, loadMessages, markAsRead]);

  // Chat controls
  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    if (loggedIn) {
      loadConversations();
    }
  }, [loggedIn, loadConversations]);

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

  // Setup polling when chat is open and user is logged in
  useEffect(() => {
    if (loggedIn && isOpen && !isMinimized) {
      // Initial load
      loadConversations();
      
      // Poll conversations every 10 seconds
      conversationsPollIntervalRef.current = setInterval(() => {
        loadConversations();
      }, 10000);
      
      // Poll messages for selected conversation every 5 seconds
      if (selectedConversationId) {
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
    }
    
    return () => {
      if (conversationsPollIntervalRef.current) {
        clearInterval(conversationsPollIntervalRef.current);
      }
      if (messagesPollIntervalRef.current) {
        clearInterval(messagesPollIntervalRef.current);
      }
    };
  }, [loggedIn, isOpen, isMinimized, selectedConversationId, loadConversations, loadMessages]);

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

