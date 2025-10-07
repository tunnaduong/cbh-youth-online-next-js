"use client";

import React, { createContext, useState, useContext } from "react";

// Create the context
const PostRefreshContext = createContext({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

// Create a provider component
export const PostRefreshProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <PostRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </PostRefreshContext.Provider>
  );
};

// Create a custom hook to use the global state
export const usePostRefresh = () => useContext(PostRefreshContext);
