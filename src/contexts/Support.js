"use client";

import { useContext } from "react";
import { AuthContext } from "./";
import TopUsersContext from "./TopUsersContext";
import ChatContext from "./ChatContext";
import NotificationContext from "./NotificationContext";

export const useAuthContext = () => useContext(AuthContext);
export const useTopUsersContext = () => useContext(TopUsersContext);
export const useChatContext = () => useContext(ChatContext);
export const useNotificationContext = () => useContext(NotificationContext);
