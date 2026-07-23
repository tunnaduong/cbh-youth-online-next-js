"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getTokenFromAnywhere } from "@/utils/cookies";

if (typeof window !== "undefined") {
  window.Pusher = Pusher;
}

let echoInstance = null;

const broadcastAuthEndpoint = () =>
  `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`;

/**
 * Lazily creates a singleton Laravel Echo client wired to the Reverb server.
 * The authorizer re-reads the bearer token on every channel subscription
 * attempt (rather than baking it in once) so it stays correct across login/logout.
 */
export function getEcho() {
  if (typeof window === "undefined") return null;

  if (echoInstance) return echoInstance;

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    // pusher-js unconditionally requires a `cluster` key even when wsHost/wsPort
    // point at a self-hosted Reverb server - it's unused here, just to satisfy validation.
    cluster: "",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 80,
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 443,
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || "https") === "https",
    enabledTransports: ["ws", "wss"],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        const token = getTokenFromAnywhere();

        fetch(broadcastAuthEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: new URLSearchParams({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Broadcast auth failed: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => callback(false, data))
          .catch((error) => callback(true, error));
      },
    }),
  });

  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}

/** The socket id of the sender, used as the `X-Socket-Id` header so `->toOthers()` excludes it. */
export function getSocketId() {
  return echoInstance?.socketId() || null;
}
