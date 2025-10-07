"use client";

import React, { createContext, useContext } from "react";

// Create the context
const ForumDataContext = createContext({
  // Home data
  latestPosts: [],
  setLatestPosts: () => {},
  mainCategories: [],
  setMainCategories: () => {},
  stats: null,
  setStats: () => {},

  // Forum category data
  forumCategories: [],
  setForumCategories: () => {},
  currentCategory: null,
  setCurrentCategory: () => {},

  // Post detail data
  postDetails: {},
  setPostDetails: () => {},
  postComments: {},
  setPostComments: () => {},

  // Loading states
  homeDataLoading: false,
  setHomeDataLoading: () => {},
  forumDataLoading: false,
  setForumDataLoading: () => {},
  postDataLoading: false,
  setPostDataLoading: () => {},

  // Error states
  homeDataError: null,
  setHomeDataError: () => {},
  forumDataError: null,
  setForumDataError: () => {},
  postDataError: null,
  setPostDataError: () => {},

  // Cache management
  lastHomeDataFetch: null,
  setLastHomeDataFetch: () => {},
  lastForumDataFetch: null,
  setLastForumDataFetch: () => {},
  lastPostDataFetch: {},
  setLastPostDataFetch: () => {},

  // Actions
  fetchHomeData: () => {},
  fetchForumCategories: () => {},
  fetchPostDetail: () => {},
  clearCache: () => {},
  refreshData: () => {},
});

// Create a custom hook to use the context
export const useForumData = () => {
  const context = useContext(ForumDataContext);
  if (!context) {
    throw new Error("useForumData must be used within a ForumDataProvider");
  }
  return context;
};

export default ForumDataContext;
