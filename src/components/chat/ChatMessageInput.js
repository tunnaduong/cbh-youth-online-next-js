"use client";

import { useState, useRef } from "react";
import Input from "@/components/ui/input";
import { Paperclip, Send } from "lucide-react";

export default function ChatMessageInput({
  onSend,
  onSendFile,
  sending,
  onTyping,
}) {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onSendFile) return;

    try {
      await onSendFile(file);
    } catch (error) {
      console.error("[ChatMessageInput] Error sending file:", error);
    }
  };

  const handlePaste = async (e) => {
    if (!onSendFile) return;

    const items = Array.from(e.clipboardData?.items || []);
    const fileItem = items.find((item) => item.kind === "file");
    if (!fileItem) return; // Let normal text paste proceed

    e.preventDefault();
    const file = fileItem.getAsFile();
    if (!file) return;

    try {
      await onSendFile(file);
    } catch (error) {
      console.error("[ChatMessageInput] Error sending pasted file:", error);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t dark:border-neutral-600 bg-white dark:bg-neutral-700 rounded-b-lg overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-colors flex-shrink-0"
        title="Đính kèm file"
        disabled={sending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>
      <Input
        ref={inputRef}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          onTyping?.();
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="Gửi tin nhắn..."
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
