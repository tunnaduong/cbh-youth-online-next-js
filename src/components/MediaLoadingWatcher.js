"use client";

import { useEffect } from "react";

/**
 * Images and videos marked with the `media-loading` class show a shimmer
 * (globals.css) while they load. This removes the class as soon as the
 * element has loaded or failed, so the animation stops and nothing shows
 * through transparent images afterwards.
 *
 * One listener for the whole page: `load` and `loadeddata` don't bubble, so
 * it listens in the capture phase.
 */
export default function MediaLoadingWatcher() {
  useEffect(() => {
    const done = (event) => {
      const target = event.target;
      if (target instanceof Element && target.classList.contains("media-loading")) {
        target.classList.remove("media-loading");
      }
    };

    const events = ["load", "loadeddata", "error"];
    events.forEach((name) => document.addEventListener(name, done, true));
    return () => events.forEach((name) => document.removeEventListener(name, done, true));
  }, []);

  return null;
}
