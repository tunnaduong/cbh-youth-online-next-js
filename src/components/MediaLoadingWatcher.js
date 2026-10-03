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

    const events = ["load", "loadeddata", "loadedmetadata", "error"];
    events.forEach((name) => document.addEventListener(name, done, true));

    // Media that finished loading before this ran (cached, or server-rendered
    // and loaded during hydration) never fires those events again.
    document.querySelectorAll("img.media-loading").forEach((img) => {
      if (img.complete) img.classList.remove("media-loading");
    });
    document.querySelectorAll("video.media-loading").forEach((video) => {
      if (video.readyState >= 1) video.classList.remove("media-loading");
    });
    return () => events.forEach((name) => document.removeEventListener(name, done, true));
  }, []);

  return null;
}
