"use client";

import { useContext } from "react";
import { AuthContext } from "./";
import TopUsersContext from "./TopUsersContext";

export const useAuthContext = () => useContext(AuthContext);
export const useTopUsersContext = () => useContext(TopUsersContext);
