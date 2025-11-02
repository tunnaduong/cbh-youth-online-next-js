"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Popover, Input } from "antd";
import { Send } from "lucide-react";
import { RiEmojiStickerLine } from "react-icons/ri";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import CustomInput from "@/components/ui/input";
import { useTheme } from "@/contexts/themeContext";

const { TextArea } = Input;

export default function MessageInput({ onSend, sending, loggedIn }) {
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showGuestNameInput, setShowGuestNameInput] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef(null);
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
            className="w-full max-w-[50%] bg-white dark:!bg-neutral-600"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tên này sẽ được hiển thị khi bạn gửi tin nhắn
          </p>
        </div>
      )}

      {/* Text Input Area with Emoji button */}
      <div className="flex items-end gap-2">
        <TextArea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Viết một tin nhắn..."
          rows={3}
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="flex-1"
          classNames={{
            textarea:
              "dark:!bg-neutral-600 bg-white dark:!text-gray-100 dark:!placeholder-gray-400 dark:!border-[#585857]",
          }}
        />
        <div className="flex flex-col gap-2">
          {/* Emoji button above send button */}
          <Popover
            trigger="click"
            placement="topLeft"
            open={showEmoji}
            onOpenChange={(open) => setShowEmoji(open)}
            content={
              <div>
                <Picker
                  data={data}
                  onEmojiSelect={(emoji) => {
                    insertEmoji(emoji.native);
                    // Don't close popover when emoji is selected
                    // Only close when clicking outside
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
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || sending}
            loading={sending}
            type="primary"
            className="h-10 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
