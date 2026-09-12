"use client";

import { useState, useCallback } from "react";

export const AI_COMMANDS = [
  { command: "/ai", description: "Hỏi CYO AI về tin nhắn này" },
  { command: "/summary", description: "Tóm tắt cuộc trò chuyện gần đây" },
];

/**
 * Hook that shows the CYO AI command palette whenever the composer content
 * starts with "/" and nothing else has been typed yet. Local/static list,
 * so no debounced network fetch is needed like @mentions.
 *
 * @param {object} opts
 * @param {string} opts.value
 * @param {function} opts.onChange
 */
export function useSlashCommandInput({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = useCallback(
    (newValue) => {
      onChange(newValue);

      if (!newValue.startsWith("/") || /\s/.test(newValue)) {
        setShowSuggestions(false);
        setSuggestions([]);
        return;
      }

      const query = newValue.slice(1).toLowerCase();
      const matches = AI_COMMANDS.filter((c) => c.command.slice(1).startsWith(query));
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    },
    [onChange]
  );

  const selectCommand = useCallback(
    (item) => {
      onChange(`${item.command} `);
      setShowSuggestions(false);
      setSuggestions([]);
    },
    [onChange]
  );

  const closeSuggestions = useCallback(() => setShowSuggestions(false), []);

  return { handleChange, selectCommand, showSuggestions, suggestions, closeSuggestions };
}
