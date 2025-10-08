"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getHomeData,
  getForumCategories,
  getPostDetail,
  getSubforumPosts,
} from "../../app/Api";
import ForumDataContext from "../ForumDataContext";

// Cache durations (vẫn giữ để hạn chế fetch quá nhiều nếu muốn)
const CACHE_DURATIONS = {
  home: 5 * 60 * 1000,
  forum: 10 * 60 * 1000,
  post: 3 * 60 * 1000,
  subforum: 5 * 60 * 1000,
};

export const ForumDataProvider = ({ children }) => {
  // --- State ---
  const [latestPosts, setLatestPosts] = useState({});
  const [mainCategories, setMainCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [forumCategories, setForumCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [postDetails, setPostDetails] = useState({});
  const [postComments, setPostComments] = useState({});
  const [subforumTopics, setSubforumTopics] = useState({});
  const [homeDataLoading, setHomeDataLoading] = useState(false);

  const [loading, setLoading] = useState({
    home: false,
    forum: false,
    post: false,
    subforum: false,
  });

  const [error, setError] = useState({
    home: null,
    forum: null,
    post: null,
    subforum: null,
  });

  const [lastFetch, setLastFetch] = useState({
    home: {},
    forum: null,
    post: {},
    subforum: {},
  });

  // --- Helper fetch function with caching ---
  const fetchWithCache = useCallback(
    async (key, fetcher, cacheDuration, forceRefresh = false) => {
      const now = Date.now();
      if (
        !forceRefresh &&
        lastFetch[key] &&
        now - lastFetch[key] < cacheDuration
      ) {
        return;
      }
      setLoading((prev) => ({ ...prev, [key]: true }));
      setError((prev) => ({ ...prev, [key]: null }));
      try {
        const response = await fetcher();
        return response?.data;
      } catch (err) {
        console.error(`Error fetching ${key}:`, err);
        setError((prev) => ({
          ...prev,
          [key]: err.message || `Lỗi tải ${key}`,
        }));
        return null;
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
        setLastFetch((prev) => ({ ...prev, [key]: now }));
      }
    },
    [lastFetch]
  );

  // --- Specific fetchers ---
  const fetchHomeData = useCallback(
    async (sort = "latest", forceRefresh = false) => {
      setHomeDataLoading(true);
      const now = Date.now();
      if (
        !forceRefresh &&
        latestPosts[sort]?.length > 0 &&
        lastFetch.home[sort] &&
        now - lastFetch.home[sort] < CACHE_DURATIONS.home
      ) {
        return;
      }

      setLoading((prev) => ({ ...prev, home: true }));
      setError((prev) => ({ ...prev, home: null }));

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
          setLastFetch((prev) => ({
            ...prev,
            home: { ...prev.home, [sort]: now },
          }));
        }
      } catch (err) {
        setError((prev) => ({
          ...prev,
          home: err.message || "Lỗi tải bảng tin",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, home: false }));
        setHomeDataLoading(false);
      }
    },
    [latestPosts, lastFetch]
  );

  const fetchForumCategories = useCallback(
    (forceRefresh = false) => {
      return fetchWithCache(
        "forum",
        getForumCategories,
        CACHE_DURATIONS.forum,
        forceRefresh
      ).then((categories) => {
        if (!categories) return;
        setForumCategories(Array.isArray(categories) ? categories : []);
      });
    },
    [fetchWithCache]
  );

  const fetchPostDetail = useCallback(
    (postId, forceRefresh = false) => {
      return fetchWithCache(
        `post_${postId}`,
        () => getPostDetail(postId),
        CACHE_DURATIONS.post,
        forceRefresh
      ).then((data) => {
        if (!data) return null;
        setPostDetails((prev) => ({ ...prev, [postId]: data }));
        setPostComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
        return data;
      });
    },
    [fetchWithCache]
  );

  const fetchSubforumTopics = useCallback(
    (subforumId, forceRefresh = false) => {
      return fetchWithCache(
        `subforum_${subforumId}`,
        () => getSubforumPosts(subforumId),
        CACHE_DURATIONS.subforum,
        forceRefresh
      ).then((data) => {
        const topics = data?.topics || [];
        setSubforumTopics((prev) => ({
          ...prev,
          [subforumId]: Array.isArray(topics) ? topics : [],
        }));
        return topics;
      });
    },
    [fetchWithCache]
  );

  // --- Initial fetch ---
  useEffect(() => {
    if (Object.keys(latestPosts).length === 0) fetchHomeData();
    if (forumCategories.length === 0) fetchForumCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Cache clearing ---
  const clearCache = useCallback(() => {
    setLatestPosts({});
    setMainCategories([]);
    setStats(null);
    setForumCategories([]);
    setCurrentCategory(null);
    setPostDetails({});
    setPostComments({});
    setSubforumTopics({});
    setLastFetch({ home: {}, forum: null, post: {}, subforum: {} });
    setError({ home: null, forum: null, post: null, subforum: null });
  }, []);

  // --- Context value ---
  const value = {
    latestPosts,
    mainCategories,
    stats,
    forumCategories,
    currentCategory,
    setCurrentCategory,
    postDetails,
    postComments,
    subforumTopics,
    loading,
    error,
    fetchHomeData,
    fetchForumCategories,
    fetchPostDetail,
    fetchSubforumTopics,
    clearCache,
    homeDataLoading,
    setHomeDataLoading,
  };

  return (
    <ForumDataContext.Provider value={value}>
      {children}
    </ForumDataContext.Provider>
  );
};
