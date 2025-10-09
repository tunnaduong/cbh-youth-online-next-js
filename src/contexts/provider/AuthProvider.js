"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "..";
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
    }
  }, []);

  // Update currentUser in localStorage whenever it changes
  useEffect(() => {
    if (currentUser && Object.keys(currentUser).length > 0) {
      localStorage.setItem("CURRENT_USER", JSON.stringify(currentUser));
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
        showToast,
        setCurrentUser,
        setUserToken,
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
