"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getHomeData,
  getForumCategories,
  getPostDetail,
  getSubforumPosts,
} from "../../app/Api";
import ForumDataContext from "../ForumDataContext";
import { usePostRefresh } from "../PostRefreshContext";

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

  // Get refresh trigger from PostRefreshContext
  const { refreshTrigger } = usePostRefresh();

  // Use refs for cache state to avoid stale closures
  const lastFetchRef = useRef({
    home: {},
    forum: null,
    post: {},
    subforum: {},
  });

  // Track in-flight requests to prevent duplicates
  const inFlightRequestsRef = useRef(new Set());

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

  // --- Helper fetch function with caching ---
  const fetchWithCache = useCallback(
    async (key, fetcher, cacheDuration, forceRefresh = false) => {
      const now = Date.now();

      // Check cache using ref to avoid stale closure
      if (
        !forceRefresh &&
        lastFetchRef.current[key] &&
        now - lastFetchRef.current[key] < cacheDuration
      ) {
        return;
      }

      // Check if request is already in flight
      if (inFlightRequestsRef.current.has(key)) {
        return;
      }

      // Mark as in flight
      inFlightRequestsRef.current.add(key);

      setLoading((prev) => ({ ...prev, [key]: true }));
      setError((prev) => ({ ...prev, [key]: null }));

      try {
        const response = await fetcher();
        lastFetchRef.current[key] = now;
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
        inFlightRequestsRef.current.delete(key);
      }
    },
    []
  );

  // --- Specific fetchers ---
  const fetchHomeData = useCallback(
    async (sort = "latest", forceRefresh = false) => {
      const requestKey = `home_${sort}`;

      // Check if request is already in flight
      if (inFlightRequestsRef.current.has(requestKey)) {
        return;
      }

      setHomeDataLoading(true);
      const now = Date.now();

      // Check cache using ref to avoid stale closure
      if (
        !forceRefresh &&
        latestPosts[sort]?.length > 0 &&
        lastFetchRef.current.home[sort] &&
        now - lastFetchRef.current.home[sort] < CACHE_DURATIONS.home
      ) {
        setHomeDataLoading(false);
        return;
      }

      // Mark as in flight
      inFlightRequestsRef.current.add(requestKey);

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
          lastFetchRef.current.home[sort] = now;
        }
      } catch (err) {
        setError((prev) => ({
          ...prev,
          home: err.message || "Lỗi tải bảng tin",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, home: false }));
        setHomeDataLoading(false);
        inFlightRequestsRef.current.delete(requestKey);
      }
    },
    [latestPosts] // Include latestPosts to check for existing data
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
    [] // Remove fetchWithCache dependency
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
    [] // Remove fetchWithCache dependency
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
    [] // Remove fetchWithCache dependency
  );

  // --- Initial fetch (reduced for SSR) ---
  useEffect(() => {
    // Only fetch if we don't have any data and we're not on a page that provides initial data
    // This prevents unnecessary fetches when data is already provided by SSR
    const hasHomeData = Object.keys(latestPosts).length > 0;
    const hasForumData = forumCategories.length > 0;

    // Only fetch if we truly have no data
    if (!hasHomeData && !hasForumData) {
      // Check if we're on a page that might have provided initial data
      const isHomePage =
        typeof window !== "undefined" && window.location.pathname === "/";
      const isForumPage =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/forum/");

      // Only fetch if we're not on pages that provide initial data
      if (!isHomePage && !isForumPage) {
        fetchHomeData();
        fetchForumCategories();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Listen for refresh triggers ---
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("🔄 ForumDataProvider: Refresh triggered, fetching data...");
      // Force refresh all data when triggered
      fetchHomeData("latest", true); // Force refresh (includes stats)
      fetchForumCategories(true); // Force refresh
    }
  }, [refreshTrigger]); // Only depend on refreshTrigger

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
    lastFetchRef.current = { home: {}, forum: null, post: {}, subforum: {} };
    inFlightRequestsRef.current.clear();
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
