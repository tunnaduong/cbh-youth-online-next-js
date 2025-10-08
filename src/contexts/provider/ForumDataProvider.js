"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getHomeData,
  getForumCategories,
  getPostDetail,
  getSubforumPosts,
} from "../../app/Api";
import ForumDataContext from "../ForumDataContext";
import { usePostRefresh } from "../PostRefreshContext";

export const ForumDataProvider = ({ children }) => {
  // Home data states - now sort-specific
  const [latestPosts, setLatestPosts] = useState({});
  const [mainCategories, setMainCategories] = useState([]);
  const [stats, setStats] = useState(null);

  // Forum category data states
  const [forumCategories, setForumCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);

  // Post detail data states
  const [postDetails, setPostDetails] = useState({});
  const [postComments, setPostComments] = useState({});

  // Subforum data states
  const [subforumTopics, setSubforumTopics] = useState({});

  // Loading states
  const [homeDataLoading, setHomeDataLoading] = useState(false);
  const [forumDataLoading, setForumDataLoading] = useState(false);
  const [postDataLoading, setPostDataLoading] = useState(false);
  const [subforumDataLoading, setSubforumDataLoading] = useState(false);

  // Error states
  const [homeDataError, setHomeDataError] = useState(null);
  const [forumDataError, setForumDataError] = useState(null);
  const [postDataError, setPostDataError] = useState(null);
  const [subforumDataError, setSubforumDataError] = useState(null);

  // Cache management
  const [lastHomeDataFetch, setLastHomeDataFetch] = useState({});
  const [lastForumDataFetch, setLastForumDataFetch] = useState(null);
  const [lastPostDataFetch, setLastPostDataFetch] = useState({});
  const [lastSubforumDataFetch, setLastSubforumDataFetch] = useState({});

  // Cache duration: 5 minutes for home data, 10 minutes for forum categories, 3 minutes for post details, 5 minutes for subforum topics
  const HOME_CACHE_DURATION = 5 * 60 * 1000;
  const FORUM_CACHE_DURATION = 10 * 60 * 1000;
  const POST_CACHE_DURATION = 3 * 60 * 1000;
  const SUBFORUM_CACHE_DURATION = 5 * 60 * 1000;

  // Fetch home data with caching
  const fetchHomeData = useCallback(
    async (sort = "latest", forceRefresh = false) => {
      const now = Date.now();

      // Check if we have cached data for this specific sort and it's still fresh
      if (
        !forceRefresh &&
        lastHomeDataFetch[sort] &&
        now - lastHomeDataFetch[sort] < HOME_CACHE_DURATION &&
        latestPosts[sort] &&
        latestPosts[sort].length > 0
      ) {
        return;
      }

      // On force refresh, don't show a jarring loading skeleton, let data update in background
      if (!forceRefresh) {
        setHomeDataLoading(true);
      }
      setHomeDataError(null);

      try {
        const response = await getHomeData(sort);
        const data = response.data;

        if (data) {
          setLatestPosts((prev) => ({
            ...prev,
            [sort]: data.latestPosts || [],
          }));
          setMainCategories(data.mainCategories || []);
          setStats(data.stats || null);
          setLastHomeDataFetch((prev) => ({
            ...prev,
            [sort]: now,
          }));
        }
      } catch (err) {
        console.error("Error fetching home data:", err);
        setHomeDataError(err.message || "Lỗi tải dữ liệu trang chủ");
      } finally {
        setHomeDataLoading(false);
      }
    },
    [lastHomeDataFetch, latestPosts]
  );

  // Fetch forum categories with caching
  const fetchForumCategories = useCallback(
    async (forceRefresh = false) => {
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
    },
    [lastForumDataFetch, forumCategories]
  );

  // Fetch post detail with caching
  const fetchPostDetail = useCallback(
    async (postId, forceRefresh = false) => {
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
    },
    [lastPostDataFetch, postDetails]
  );

  // Fetch subforum topics with caching
  const fetchSubforumTopics = useCallback(
    async (subforumId, forceRefresh = false) => {
      const now = Date.now();

      // Check if we have cached data and it's still fresh
      if (
        !forceRefresh &&
        lastSubforumDataFetch[subforumId] &&
        now - lastSubforumDataFetch[subforumId] < SUBFORUM_CACHE_DURATION &&
        subforumTopics[subforumId]
      ) {
        return subforumTopics[subforumId];
      }

      try {
        setSubforumDataLoading(true);
        setSubforumDataError(null);
        const response = await getSubforumPosts(subforumId);
        const data = response.data?.topics || [];

        if (data) {
          setSubforumTopics((prev) => ({
            ...prev,
            [subforumId]: Array.isArray(data) ? data : [],
          }));
          setLastSubforumDataFetch((prev) => ({
            ...prev,
            [subforumId]: now,
          }));
          return Array.isArray(data) ? data : [];
        }
      } catch (err) {
        console.error("Error fetching subforum topics:", err);
        setSubforumDataError(err.message || "Lỗi tải dữ liệu chủ đề");
        throw err;
      } finally {
        setSubforumDataLoading(false);
      }
    },
    [lastSubforumDataFetch, subforumTopics]
  );

  // Clear all cached data
  const clearCache = useCallback(() => {
    setLatestPosts({});
    setMainCategories([]);
    setStats(null);
    setForumCategories([]);
    setCurrentCategory(null);
    setPostDetails({});
    setPostComments({});
    setSubforumTopics({});
    setLastHomeDataFetch({});
    setLastForumDataFetch(null);
    setLastPostDataFetch({});
    setLastSubforumDataFetch({});
    setHomeDataError(null);
    setForumDataError(null);
    setPostDataError(null);
    setSubforumDataError(null);
  }, []);

  // Refresh all data
  const refreshData = useCallback(
    async (sort = "latest") => {
      await Promise.all([
        fetchHomeData(sort, true),
        fetchForumCategories(true),
      ]);
    },
    [fetchHomeData, fetchForumCategories]
  );

  // Find category by slug
  const findCategoryBySlug = useCallback(
    (slug) => {
      return forumCategories.find((cat) => cat.slug === slug);
    },
    [forumCategories]
  );

  // Set current category
  const setCategoryBySlug = useCallback(
    (slug) => {
      const category = findCategoryBySlug(slug);
      setCurrentCategory(category || null);
      return category;
    },
    [findCategoryBySlug]
  );

  // Listen for external refresh triggers
  const { refreshTrigger } = usePostRefresh();
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Refresh home data when a new post is made
      refreshData();
    }
  }, [refreshTrigger, refreshData]);

  // Initial data fetch on mount
  useEffect(() => {
    // Only fetch if we don't have any cached data
    if (Object.keys(latestPosts).length === 0 && mainCategories.length === 0) {
      fetchHomeData();
    }
    if (forumCategories.length === 0) {
      fetchForumCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Subforum data
    subforumTopics,
    setSubforumTopics,

    // Loading states
    homeDataLoading,
    setHomeDataLoading,
    forumDataLoading,
    setForumDataLoading,
    postDataLoading,
    setPostDataLoading,
    subforumDataLoading,
    setSubforumDataLoading,

    // Error states
    homeDataError,
    setHomeDataError,
    forumDataError,
    setForumDataError,
    postDataError,
    setPostDataError,
    subforumDataError,
    setSubforumDataError,

    // Cache management
    lastHomeDataFetch,
    setLastHomeDataFetch,
    lastForumDataFetch,
    setLastForumDataFetch,
    lastPostDataFetch,
    setLastPostDataFetch,
    lastSubforumDataFetch,
    setLastSubforumDataFetch,

    // Actions
    fetchHomeData,
    fetchForumCategories,
    fetchPostDetail,
    fetchSubforumTopics,
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
