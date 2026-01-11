"use client";

import { createContext } from "react";

const AuthContext = createContext({
  currentUser: {},
  userToken: null,
  loggedIn: false,
  toast: {
    message: null,
    show: false,
  },
  setCurrentUser: () => { },
  setUserToken: () => { },
  refreshUser: () => { },
});

export default AuthContext;
