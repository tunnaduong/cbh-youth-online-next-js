"use client";

import React, { useState, useEffect, createContext } from "react";
import { getHomeData, getForumCategories, getPostDetail } from "../../app/Api";
import ForumDataContext from "../ForumDataContext";

export const ForumDataProvider = ({ children }) => {
  // Home data states
  const [latestPosts, setLatestPosts] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [stats, setStats] = useState(null);

  // Forum category data states
  const [forumCategories, setForumCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);

  // Post detail data states
  const [postDetails, setPostDetails] = useState({});
  const [postComments, setPostComments] = useState({});

  // Loading states
  const [homeDataLoading, setHomeDataLoading] = useState(false);
  const [forumDataLoading, setForumDataLoading] = useState(false);
  const [postDataLoading, setPostDataLoading] = useState(false);

  // Error states
  const [homeDataError, setHomeDataError] = useState(null);
  const [forumDataError, setForumDataError] = useState(null);
  const [postDataError, setPostDataError] = useState(null);

  // Cache management
  const [lastHomeDataFetch, setLastHomeDataFetch] = useState(null);
  const [lastForumDataFetch, setLastForumDataFetch] = useState(null);
  const [lastPostDataFetch, setLastPostDataFetch] = useState({});

  // Cache duration: 5 minutes for home data, 10 minutes for forum categories, 3 minutes for post details
  const HOME_CACHE_DURATION = 5 * 60 * 1000;
  const FORUM_CACHE_DURATION = 10 * 60 * 1000;
  const POST_CACHE_DURATION = 3 * 60 * 1000;

  // Fetch home data with caching
  const fetchHomeData = async (sort = "latest", forceRefresh = false) => {
    const now = Date.now();

    // Check if we have cached data and it's still fresh
    if (
      !forceRefresh &&
      lastHomeDataFetch &&
      now - lastHomeDataFetch < HOME_CACHE_DURATION &&
      (latestPosts.length > 0 || mainCategories.length > 0)
    ) {
      return;
    }

    try {
      setHomeDataLoading(true);
      setHomeDataError(null);
      const response = await getHomeData(sort);
      const data = response.data;

      if (data) {
        setLatestPosts(data.latestPosts || []);
        setMainCategories(data.mainCategories || []);
        setStats(data.stats || null);
        setLastHomeDataFetch(now);
      }
    } catch (err) {
      console.error("Error fetching home data:", err);
      setHomeDataError(err.message || "Lỗi tải dữ liệu trang chủ");
    } finally {
      setHomeDataLoading(false);
    }
  };

  // Fetch forum categories with caching
  const fetchForumCategories = async (forceRefresh = false) => {
    const now = Date.now();

    // Check if we have cached data and it's still fresh
    if (
      !forceRefresh &&
      lastForumDataFetch &&
      now - lastForumDataFetch < FORUM_CACHE_DURATION &&
      forumCategories.length > 0
    ) {
      return;
    }

    try {
      setForumDataLoading(true);
      setForumDataError(null);
      const response = await getForumCategories();
      const categories = response.data;

      if (categories) {
        setForumCategories(Array.isArray(categories) ? categories : []);
        setLastForumDataFetch(now);
      }
    } catch (err) {
      console.error("Error fetching forum categories:", err);
      setForumDataError(err.message || "Lỗi tải dữ liệu diễn đàn");
    } finally {
      setForumDataLoading(false);
    }
  };

  // Fetch post detail with caching
  const fetchPostDetail = async (postId, forceRefresh = false) => {
    const now = Date.now();

    // Check if we have cached data and it's still fresh
    if (
      !forceRefresh &&
      lastPostDataFetch[postId] &&
      now - lastPostDataFetch[postId] < POST_CACHE_DURATION &&
      postDetails[postId]
    ) {
      return postDetails[postId];
    }

    try {
      setPostDataLoading(true);
      setPostDataError(null);
      const response = await getPostDetail(postId);
      const data = response.data;

      if (data) {
        setPostDetails((prev) => ({
          ...prev,
          [postId]: data,
        }));
        setPostComments((prev) => ({
          ...prev,
          [postId]: data.comments || [],
        }));
        setLastPostDataFetch((prev) => ({
          ...prev,
          [postId]: now,
        }));
        return data;
      }
    } catch (err) {
      console.error("Error fetching post detail:", err);
      setPostDataError(err.message || "Lỗi tải dữ liệu bài viết");
      throw err;
    } finally {
      setPostDataLoading(false);
    }
  };

  // Clear all cached data
  const clearCache = () => {
    setLatestPosts([]);
    setMainCategories([]);
    setStats(null);
    setForumCategories([]);
    setCurrentCategory(null);
    setPostDetails({});
    setPostComments({});
    setLastHomeDataFetch(null);
    setLastForumDataFetch(null);
    setLastPostDataFetch({});
    setHomeDataError(null);
    setForumDataError(null);
    setPostDataError(null);
  };

  // Refresh all data
  const refreshData = async (sort = "latest") => {
    await Promise.all([fetchHomeData(sort, true), fetchForumCategories(true)]);
  };

  // Find category by slug
  const findCategoryBySlug = (slug) => {
    return forumCategories.find((cat) => cat.slug === slug);
  };

  // Set current category
  const setCategoryBySlug = (slug) => {
    const category = findCategoryBySlug(slug);
    setCurrentCategory(category || null);
    return category;
  };

  // Initial data fetch on mount
  useEffect(() => {
    // Only fetch if we don't have any cached data
    if (latestPosts.length === 0 && mainCategories.length === 0) {
      fetchHomeData();
    }
    if (forumCategories.length === 0) {
      fetchForumCategories();
    }
  }, []);

  const value = {
    // Home data
    latestPosts,
    setLatestPosts,
    mainCategories,
    setMainCategories,
    stats,
    setStats,

    // Forum category data
    forumCategories,
    setForumCategories,
    currentCategory,
    setCurrentCategory,

    // Post detail data
    postDetails,
    setPostDetails,
    postComments,
    setPostComments,

    // Loading states
    homeDataLoading,
    setHomeDataLoading,
    forumDataLoading,
    setForumDataLoading,
    postDataLoading,
    setPostDataLoading,

    // Error states
    homeDataError,
    setHomeDataError,
    forumDataError,
    setForumDataError,
    postDataError,
    setPostDataError,

    // Cache management
    lastHomeDataFetch,
    setLastHomeDataFetch,
    lastForumDataFetch,
    setLastForumDataFetch,
    lastPostDataFetch,
    setLastPostDataFetch,

    // Actions
    fetchHomeData,
    fetchForumCategories,
    fetchPostDetail,
    clearCache,
    refreshData,
    findCategoryBySlug,
    setCategoryBySlug,
  };

  return (
    <ForumDataContext.Provider value={value}>
      {children}
    </ForumDataContext.Provider>
  );
};
