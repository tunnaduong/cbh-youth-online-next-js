"use client";

import React, { createContext, useState, useContext } from "react";

// Create the context
const CreatePostContext = createContext({
  handleCreatePost: null,
  setHandleCreatePost: () => {},
});

// Create a provider component
export const CreatePostProvider = ({ children }) => {
  const [handleCreatePost, setHandleCreatePost] = useState(null);

  return (
    <CreatePostContext.Provider
      value={{ handleCreatePost, setHandleCreatePost }}
    >
      {children}
    </CreatePostContext.Provider>
  );
};

// Create a custom hook to use the context
export const useCreatePost = () => useContext(CreatePostContext);
