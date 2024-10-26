"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "..";

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({});
  const [userToken, _setUserToken] = useState("");
  const [toast, setToast] = useState({ message: "", show: false });

  const setUserToken = (token) => {
    token //WHEN: token is already exists
      ? localStorage.setItem("TOKEN", token)
      : localStorage.removeItem("TOKEN");
    _setUserToken(token);
  };

  const showToast = (message) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: "", show: false });
    }, 5000);
  };

  // Set CURRENT_USER in localStorage only once
  useEffect(() => {
    _setUserToken(localStorage.getItem("TOKEN") || "");
    if (
      localStorage.getItem("CURRENT_USER") == "{}" ||
      !localStorage.getItem("CURRENT_USER")
    ) {
      localStorage.setItem("CURRENT_USER", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userToken,
        toast,
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
