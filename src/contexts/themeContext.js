"use client";

// theme-context.js
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Initialize theme from localStorage if available, otherwise default to light
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) return savedTheme;
    }
    return "light";
  });
  const [mounted, setMounted] = useState(false);
  // What is actually shown: "auto" resolved to light or dark. Components that
  // can't read the body's `dark` class (antd's theme) use this.
  // Starts as "light" on both server and client (so hydration matches) and
  // is set for real by the effect below once mounted.
  const [resolvedTheme, setResolvedTheme] = useState("light");

  // Handle hydration - just mark as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle system theme changes when theme is "auto"
  useEffect(() => {
    if (!mounted) return;

    // Saved first: the "auto" branch below returns early (its cleanup), which
    // used to skip this and lose the "auto" choice on reload.
    localStorage.setItem("theme", theme);

    if (theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const updateTheme = (e) => {
        if (e.matches) {
          document.body.classList.add("dark");
        } else {
          document.body.classList.remove("dark");
        }
        setResolvedTheme(e.matches ? "dark" : "light");
      };

      // Apply initial theme based on system preference
      updateTheme(mediaQuery);
      mediaQuery.addEventListener("change", updateTheme);

      return () => mediaQuery.removeEventListener("change", updateTheme);
    } else if (theme === "dark") {
      document.body.classList.add("dark");
      setResolvedTheme("dark");
    } else {
      // light theme
      document.body.classList.remove("dark");
      setResolvedTheme("light");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
