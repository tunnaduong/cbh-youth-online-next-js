"use client";

import { useState, useEffect, createContext } from "react";
import { getTopUsers } from "../../app/Api";
import TopUsersContext from "../TopUsersContext";

export const TopUsersProvider = ({ children }) => {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchTopUsers = async (forceRefresh = false) => {
    const now = Date.now();

    // Check if we have cached data and it's still fresh
    if (
      !forceRefresh &&
      lastFetched &&
      now - lastFetched < CACHE_DURATION &&
      topUsers.length > 0
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getTopUsers(8);
      const usersData = response.data || response;
      setTopUsers(Array.isArray(usersData) ? usersData : []);
      setLastFetched(now);
    } catch (err) {
      console.error("Error fetching top users:", err);
      setError(err.message || "Lỗi tải dữ liệu xếp hạng");
      setTopUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount if not already cached
  useEffect(() => {
    if (topUsers.length === 0 || !lastFetched) {
      fetchTopUsers();
    }
  }, []);

  const value = {
    topUsers,
    loading,
    error,
    lastFetched,
    setTopUsers,
    setLoading,
    setError,
    setLastFetched,
    fetchTopUsers,
  };

  return (
    <TopUsersContext.Provider value={value}>
      {children}
    </TopUsersContext.Provider>
  );
};
