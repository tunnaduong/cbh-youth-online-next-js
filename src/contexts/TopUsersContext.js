"use client";

import { createContext, useContext, useState, useEffect } from "react";

const TopUsersContext = createContext();

export const useTopUsers = () => {
  const context = useContext(TopUsersContext);
  if (!context) {
    throw new Error("useTopUsers must be used within a TopUsersProvider");
  }
  return context;
};

export const TopUsersProvider = ({ children }) => {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Mock data for now - replace with actual API call
        const mockUsers = [
          {
            uid: "1",
            username: "user1",
            profile_name: "User One",
            total_points: 1250,
            oauth_profile_picture: null,
          },
          {
            uid: "2",
            username: "user2",
            profile_name: "User Two",
            total_points: 1100,
            oauth_profile_picture: null,
          },
          {
            uid: "3",
            username: "user3",
            profile_name: "User Three",
            total_points: 950,
            oauth_profile_picture: null,
          },
          {
            uid: "4",
            username: "user4",
            profile_name: "User Four",
            total_points: 800,
            oauth_profile_picture: null,
          },
          {
            uid: "5",
            username: "user5",
            profile_name: "User Five",
            total_points: 750,
            oauth_profile_picture: null,
          },
        ];

        setTopUsers(mockUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, []);

  const value = {
    topUsers,
    loading,
    error,
  };

  return (
    <TopUsersContext.Provider value={value}>
      {children}
    </TopUsersContext.Provider>
  );
};

export default TopUsersContext;
