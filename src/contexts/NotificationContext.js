"use client";

import { createContext } from "react";

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pushSubscribed: false,
  pushSupported: false,
  fetchNotifications: () => {},
  fetchUnreadCount: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  subscribePush: () => {},
  unsubscribePushNotifications: () => {},
});

export default NotificationContext;

