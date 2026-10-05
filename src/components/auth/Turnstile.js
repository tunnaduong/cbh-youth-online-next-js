"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * Cloudflare Turnstile on the login forms: tells people from bots without
 * asking anything of most people.
 *
 * It is "interaction-only": the check runs in the background while the
 * person types, and the widget takes no space on the page unless Cloudflare
 * wants a click (a suspicious network, a browser it can't judge).
 *
 * Off - nothing rendered, nothing sent - until NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is set; the API checks the token once its TURNSTILE_SECRET_KEY is set.
 *
 * Usage:
 *   const turnstile = useRef(null);
 *   <Turnstile ref={turnstile} />
 *   const token = await turnstile.current?.take();   // send as turnstile_token
 *   turnstile.current?.reset();                      // after a failed attempt
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// How long a submit waits for a check that is still running.
const WAIT_MS = 10000;

export const turnstileEnabled = !!SITE_KEY;

let scriptPromise = null;

function loadScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
      script.onerror = () => {
        // Blocked or offline: let a later mount try again.
        scriptPromise = null;
        reject(new Error("turnstile"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

const Turnstile = forwardRef(function Turnstile({ className = "" }, ref) {
  const container = useRef(null);
  const widgetId = useRef(null);
  const token = useRef(null);
  const waiters = useRef([]);

  const settle = (value) => {
    token.current = value;
    const pending = waiters.current;
    waiters.current = [];
    pending.forEach((resolve) => resolve(value));
  };

  useEffect(() => {
    if (!turnstileEnabled) return undefined;
    let cancelled = false;

    loadScript()
      .then((turnstile) => {
        if (cancelled || !container.current || widgetId.current !== null) return;
        widgetId.current = turnstile.render(container.current, {
          sitekey: SITE_KEY,
          appearance: "interaction-only",
          theme: "auto",
          language: "vi",
          "refresh-expired": "auto",
          callback: (value) => settle(value),
          "expired-callback": () => {
            token.current = null;
          },
          // Waiting submits go on without a token; the API answers with a
          // message asking to try again.
          "error-callback": () => settle(null),
        });
      })
      .catch(() => settle(null));

    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {}
      }
      widgetId.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    /**
     * The token for this attempt, waiting for a check that is still running.
     * Resolves to null when there is none (Turnstile off, blocked or failed).
     * A token is good for one request: call reset() before the next one.
     */
    take() {
      if (!turnstileEnabled) return Promise.resolve(null);
      if (token.current) return Promise.resolve(token.current);

      return new Promise((resolve) => {
        let done = false;
        const finish = (value) => {
          if (done) return;
          done = true;
          resolve(value);
        };
        waiters.current.push(finish);
        setTimeout(() => finish(null), WAIT_MS);
      });
    },
    /** Throw the used token away and run a new check. */
    reset() {
      token.current = null;
      if (widgetId.current !== null && window.turnstile) {
        try {
          window.turnstile.reset(widgetId.current);
        } catch {}
      }
    },
  }));

  if (!turnstileEnabled) return null;

  // Empty (no height) unless Cloudflare shows its checkbox.
  return <div ref={container} className={`flex justify-center empty:hidden ${className}`} />;
});

export default Turnstile;
