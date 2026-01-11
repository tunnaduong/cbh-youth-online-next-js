"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "..";
import * as Api from "@/app/Api";
import {
  setAuthCookie,
  getAuthCookie,
  removeAuthCookie,
  migrateTokenToCookies,
  getTokenFromAnywhere,
} from "@/utils/cookies";

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userToken, _setUserToken] = useState("");
  const [toast, setToast] = useState({ message: "", show: false });
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const setUserToken = (token) => {
    if (token) {
      // Set in both localStorage (for backward compatibility) and cookies
      localStorage.setItem("TOKEN", token);
      setAuthCookie(token);
    } else {
      // Remove from both localStorage and cookies
      localStorage.removeItem("TOKEN");
      removeAuthCookie();
    }
    _setUserToken(token);
  };

  const showToast = (message) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: "", show: false });
    }, 5000);
  };

  const refreshUser = async () => {
    try {
      const response = await Api.getCurrentUser();
      const userData = response?.data || response;
      if (userData) {
        setCurrentUser(userData);
      }
      return userData;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      return null;
    }
  };

  // Retrieve initial values from cookies/localStorage on mount
  useEffect(() => {
    // Migrate token from localStorage to cookies if needed
    migrateTokenToCookies();

    const storedUser = localStorage.getItem("CURRENT_USER");
    const storedToken = getTokenFromAnywhere(); // Try cookies first, then localStorage

    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    if (storedToken) {
      _setUserToken(storedToken);
      // Fetch fresh user data (including points/rank) from DB on initial load
      Api.getCurrentUser()
        .then((response) => {
          const userData = response?.data || response;
          if (userData) {
            setCurrentUser(userData);
          }
        })
        .catch((err) => {
          console.error("Initial user refresh failed:", err);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Update currentUser in localStorage whenever it changes
  useEffect(() => {
    if (currentUser && Object.keys(currentUser).length > 0) {
      // Exclude points and rank from localStorage to ensure they are fetched fresh from DB
      const { total_points, rank, ...persistentUser } = currentUser;
      localStorage.setItem("CURRENT_USER", JSON.stringify(persistentUser));
    } else {
      // localStorage.removeItem("CURRENT_USER");
    }
  }, [currentUser]);

  // Update loggedIn state based on token or currentUser
  useEffect(() => {
    setLoggedIn(!!userToken || !!currentUser); // Set loggedIn if either token or user exists
  }, [userToken, currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userToken,
        toast,
        loggedIn,
        authLoading,
        showToast,
        setCurrentUser,
        setUserToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
