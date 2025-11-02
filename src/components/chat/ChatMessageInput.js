"use client";

import { useState, useRef } from "react";
import Input from "@/components/ui/input";
import { Paperclip, Send } from "lucide-react";

export default function ChatMessageInput({ onSend, sending }) {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  const handleSubmit = async () => {
    if (!message.trim() || sending) return;

    try {
      await onSend(message.trim());
      setMessage("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error("[ChatMessageInput] Error sending message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t dark:border-neutral-600 bg-white dark:bg-neutral-700 rounded-b-lg overflow-hidden">
      <button
        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors flex-shrink-0"
        title="Attach file"
        disabled={sending}
      >
        <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>
      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message"
        disabled={sending}
        className="flex-1"
      />
      <button
        onClick={handleSubmit}
        disabled={!message.trim() || sending}
        className="p-2 bg-[#319527] hover:bg-[#3dbb31] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex-shrink-0"
        title="Send"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
