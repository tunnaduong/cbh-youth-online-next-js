"use client";

import { useState, useCallback, useRef } from "react";
import { getMentionSuggestions, getConversationMentionSuggestions } from "@/app/Api";

/**
 * Hook that wires up @mention detection, suggestion fetching, and insertion
 * for a controlled text input.
 *
 * @param {object} opts
 * @param {string} opts.value - current text value
 * @param {function} opts.onChange - called with new text after insertion
 * @param {string|null} opts.conversationId - if set, uses conversation-scoped endpoint
 * @param {React.RefObject} opts.inputRef - ref to the textarea/input DOM element
 */
export function useMentionInput({ value, onChange, conversationId = null, inputRef }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1); // index of '@' in value
  const debounceTimer = useRef(null);

  const handleChange = useCallback(
    (newValue, cursorPos) => {
      onChange(newValue);

      // cursorPos is passed from the event handler (e.target.selectionStart)
      // so it's always the correct position before React re-renders.
      const el =
        inputRef?.current?.resizableTextArea?.textArea || inputRef?.current;
      const cursor = cursorPos ?? (el ? el.selectionStart : newValue.length);
      const textBeforeCursor = newValue.slice(0, cursor);

      // Walk back from cursor to find an unbroken @word
      const match = textBeforeCursor.match(/@([\wÀ-ɏ]*)$/u);

      if (match) {
        const query = match[1];
        const atIndex = cursor - query.length - 1;
        setMentionStart(atIndex);
        setMentionQuery(query);

        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
          try {
            const fetcher = conversationId
              ? getConversationMentionSuggestions(conversationId, query)
              : getMentionSuggestions(query);
            const res = await fetcher;
            setSuggestions(res?.data?.suggestions || []);
            setShowSuggestions(true);
          } catch {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }, 200);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
        setMentionStart(-1);
      }
    },
    [onChange, conversationId, inputRef]
  );

  const insertMention = useCallback(
    (user) => {
      if (mentionStart < 0) return;
      const el =
        inputRef?.current?.resizableTextArea?.textArea || inputRef?.current;
      const cursor = el ? el.selectionStart : value.length;
      // Replace from '@' up to cursor with '@username '
      const before = value.slice(0, mentionStart);
      const after = value.slice(cursor);
      const inserted = `@${user.username} `;
      const newValue = before + inserted + after;
      onChange(newValue);

      // Restore focus and move cursor after the inserted mention
      requestAnimationFrame(() => {
        if (el) {
          el.focus();
          const pos = mentionStart + inserted.length;
          el.setSelectionRange(pos, pos);
        }
      });

      setShowSuggestions(false);
      setSuggestions([]);
      setMentionStart(-1);
    },
    [value, onChange, mentionStart, inputRef]
  );

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  return {
    handleChange,
    insertMention,
    showSuggestions,
    suggestions,
    mentionQuery,
    closeSuggestions,
  };
}
