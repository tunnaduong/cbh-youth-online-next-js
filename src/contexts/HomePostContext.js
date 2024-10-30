"use client";

import React, { createContext, useState, useContext } from "react";

// Create the context
const HomePostContext = createContext({
  posts: [],
  setPosts: () => {},
});

// Create a provider component
export const HomePostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);

  return (
    <HomePostContext.Provider value={{ posts, setPosts }}>
      {children}
    </HomePostContext.Provider>
  );
};

// Create a custom hook to use the global state
export const useHomePost = () => useContext(HomePostContext);
