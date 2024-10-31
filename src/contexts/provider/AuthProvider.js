"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "..";

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userToken, _setUserToken] = useState("");
  const [toast, setToast] = useState({ message: "", show: false });
  const [loggedIn, setLoggedIn] = useState(false);

  const setUserToken = (token) => {
    if (token) {
      localStorage.setItem("TOKEN", token);
    } else {
      localStorage.removeItem("TOKEN");
    }
    _setUserToken(token);
  };

  const showToast = (message) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: "", show: false });
    }, 5000);
  };

  // Retrieve initial values from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("CURRENT_USER");
    const storedToken = localStorage.getItem("TOKEN");

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
