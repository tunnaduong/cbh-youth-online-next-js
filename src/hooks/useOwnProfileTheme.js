"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/app/Api";

/**
 * The signed-in user's own profile theme (name style, avatar frame, name
 * icon, username style), for places that draw them from `currentUser`: the
 * navbar, the home profile card, the composer.
 *
 * Source, in order:
 *   1. the module cache - filled by a fetch or by the appearance editor on
 *      save (`setOwnProfileTheme`), so the header follows a change at once;
 *   2. `currentUser.profile_theme` from the login payload;
 *   3. one request to the profile endpoint, for sessions that logged in
 *      before the login payload carried the theme.
 */
const cache = new Map(); // username -> theme | null
const pending = new Set();
const listeners = new Set();

const notify = () => listeners.forEach((listener) => listener());

export function setOwnProfileTheme(username, theme) {
  if (!username) return;
  cache.set(username, theme || null);
  notify();
}

export default function useOwnProfileTheme(currentUser) {
  const username = currentUser?.username;
  const fromLogin = currentUser?.profile_theme;
  const [, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => setVersion((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!username || fromLogin !== undefined) return;
    if (cache.has(username) || pending.has(username)) return;

    pending.add(username);
    getProfile(username)
      .then((response) => {
        cache.set(username, response?.data?.profile?.theme || null);
      })
      .catch(() => {
        // Remember the miss so a failing request isn't repeated on every mount.
        cache.set(username, null);
      })
      .finally(() => {
        pending.delete(username);
        notify();
      });
  }, [username, fromLogin]);

  if (!username) return null;
  if (cache.has(username)) return cache.get(username);
  return fromLogin || null;
}
