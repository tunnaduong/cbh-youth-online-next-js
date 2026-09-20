"use client";

import { useEffect, useState } from "react";

/**
 * Whether dark mode is currently in effect.
 *
 * ThemeProvider is the single source of truth here: it resolves all three
 * settings ("light" / "dark" / "auto", the last following the OS) down to one
 * observable fact - whether <body> carries the `dark` class. Watching that
 * class directly keeps consumers in sync with the rest of the site without
 * re-implementing the auto/system-preference handling, and it keeps working if
 * that resolution logic ever changes.
 *
 * Starts `false` so server and first client render agree, then corrects itself
 * on mount.
 */
export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const read = () => setIsDark(document.body.classList.contains("dark"));
    read();

    const observer = new MutationObserver(read);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
