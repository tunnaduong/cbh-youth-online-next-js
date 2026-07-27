"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Popover, Input } from "antd";
import { Send, Paperclip } from "lucide-react";
import { RiEmojiStickerLine } from "react-icons/ri";
import Picker from "@emoji-mart/react";
import CustomInput from "@/components/ui/input";
import { useTheme } from "@/contexts/themeContext";

const { TextArea } = Input;

export default function MessageInput({ onSend, onSendFile, sending, loggedIn }) {
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showGuestNameInput, setShowGuestNameInput] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { theme } = useTheme();

  // Load guest name from localStorage and update showGuestNameInput based on loggedIn
  useEffect(() => {
    console.log("[MessageInput] loggedIn:", loggedIn);
    if (!loggedIn) {
      const savedGuestName = localStorage.getItem("chat_guest_name");
      if (savedGuestName) {
        setGuestName(savedGuestName);
        setShowGuestNameInput(false);
      } else {
        setShowGuestNameInput(true);
      }
    } else {
      setShowGuestNameInput(false);
      setGuestName("");
    }
  }, [loggedIn]);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    console.log(
      "[MessageInput] handleSubmit - loggedIn:",
      loggedIn,
      "message:",
      message.substring(0, 20),
      "guestName:",
      guestName
    );

    try {
      // If logged in, send message without guest name
      if (loggedIn) {
        await onSend(message, null);
      } else {
        // If not logged in, must have guest name
        if (!guestName || !guestName.trim()) {
          setShowGuestNameInput(true);
          alert("Vui lòng nhập tên hiển thị");
          return;
        }

        // Save guest name to localStorage
        localStorage.setItem("chat_guest_name", guestName.trim());
        await onSend(message, guestName.trim());
      }

      // Only clear message if send was successful
      setMessage("");

      // Hide guest name input after successfully sending message
      if (!loggedIn && guestName) {
        setShowGuestNameInput(false);
      }
    } catch (error) {
      // Error is already handled in PublicChat.handleSendMessage
      // Don't clear message on error
      console.error("[MessageInput] Error in handleSubmit:", error);
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
    if (!file || !onSendFile || !loggedIn) return;

    try {
      await onSendFile(file);
    } catch (error) {
      console.error("[MessageInput] Error sending file:", error);
    }
  };

  const handlePaste = async (e) => {
    if (!onSendFile || !loggedIn) return;

    const items = Array.from(e.clipboardData?.items || []);
    const fileItem = items.find((item) => item.kind === "file");
    if (!fileItem) return; // Let normal text paste proceed

    e.preventDefault();
    const file = fileItem.getAsFile();
    if (!file) return;

    try {
      await onSendFile(file);
    } catch (error) {
      console.error("[MessageInput] Error sending pasted file:", error);
    }
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current?.resizableTextArea?.textArea;
    if (!textarea) {
      setMessage((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart || message.length;
    const before = message.substring(0, start);
    const after = message.substring(start);
    setMessage(before + emoji + after);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="space-y-2">
      {/* Guest Name Input (shown if not logged in and no saved name) */}
      {!loggedIn && showGuestNameInput && (
        <div className="mb-2">
          <CustomInput
            type="text"
            placeholder="Nhập tên hiển thị của bạn..."
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && guestName.trim()) {
                setShowGuestNameInput(false);
                localStorage.setItem("chat_guest_name", guestName.trim());
                // Don't auto-focus to avoid scrolling
              }
            }}
            className="w-full max-w-[calc(100%-60px)] md:max-w-[calc(733px*0.5)] bg-white dark:!bg-neutral-600"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tên này sẽ được hiển thị khi bạn gửi tin nhắn
          </p>
        </div>
      )}

      {/* Text Input Area */}
      <TextArea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="Viết một tin nhắn..."
        rows={3}
        autoSize={{ minRows: 3, maxRows: 6 }}
        className="w-full"
        classNames={{
          textarea:
            "dark:!bg-neutral-600 bg-white dark:!text-gray-100 dark:!placeholder-gray-400 dark:!border-[#585857]",
        }}
      />

      {/* Action Row: attach, emoji on left — send on right */}
      <div className="flex items-center gap-1 mt-2">
        {/* Attach file (registered users only) */}
        {loggedIn && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition flex items-center justify-center"
              title="Đính kèm ảnh, video hoặc tệp"
              disabled={sending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}

        {/* Emoji picker */}
        <Popover
          trigger="click"
          placement="topLeft"
          open={showEmoji}
          onOpenChange={(open) => setShowEmoji(open)}
          content={
            <div>
              <Picker
                data={async () => (await import("@emoji-mart/data")).default}
                onEmojiSelect={(emoji) => {
                  insertEmoji(emoji.native);
                }}
                previewPosition="none"
                searchPosition="none"
                navPosition="top"
                locale="vi"
                skinTonePosition="none"
                theme={theme}
              />
            </div>
          }
          styles={{ body: { padding: 0 } }}
        >
          <button
            className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition flex items-center justify-center"
            title="Emoji"
          >
            <RiEmojiStickerLine className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </Popover>

        <div className="flex-1" />

        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || sending}
          loading={sending}
          type="primary"
          className="h-9 px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
