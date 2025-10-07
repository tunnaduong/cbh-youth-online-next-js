"use client";

import { createContext } from "react";

const TopUsersContext = createContext({
  topUsers: [],
  loading: false,
  error: null,
  lastFetched: null,
  setTopUsers: () => {},
  setLoading: () => {},
  setError: () => {},
  setLastFetched: () => {},
});

export default TopUsersContext;
