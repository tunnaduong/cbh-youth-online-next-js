"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Popover, Input } from "antd";
import { Send, Paperclip, Pencil, X, FileText, Video } from "lucide-react";
import { RiEmojiStickerLine } from "react-icons/ri";
import Picker from "@emoji-mart/react";
import CustomInput from "@/components/ui/input";
import { useTheme } from "@/contexts/themeContext";
import MentionSuggestionsDropdown from "@/components/ui/MentionSuggestionsDropdown";
import { useMentionInput } from "@/hooks/useMentionInput";

const { TextArea } = Input;

function EditComposerBar({ editingMessage, onCancel }) {
  if (!editingMessage) return null;
  return (
    <div className="flex items-center gap-2 px-1 py-1.5 mb-1 rounded border-l-[3px] border-blue-500 bg-gray-100 dark:bg-neutral-700">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-blue-500 flex items-center gap-1 truncate">
          <Pencil className="w-3 h-3" /> Đang sửa tin nhắn
        </p>
        <p className="text-[12px] truncate text-gray-600 dark:text-gray-300 overflow-hidden whitespace-nowrap">
          {editingMessage.content}
        </p>
      </div>
      <button type="button" onClick={onCancel} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-500 flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ReplyComposerBar({ replyingTo, onCancel }) {
  if (!replyingTo) return null;
  const name = replyingTo.sender?.profile_name || replyingTo.sender?.username || "Ai đó";
  const resolveUrl = (url) =>
    !url ? url : url.startsWith("http") || url.startsWith("blob:") ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`;

  const preview =
    replyingTo.type === "image" ? (
      <span className="flex items-center gap-1.5">
        {replyingTo.file_url && <img src={resolveUrl(replyingTo.file_url)} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />}
        <span className="truncate opacity-70">Hình ảnh</span>
      </span>
    ) : replyingTo.type === "video" ? (
      <span className="flex items-center gap-1 opacity-70"><Video className="w-3.5 h-3.5" /> Video</span>
    ) : replyingTo.type === "file" ? (
      <span className="flex items-center gap-1 opacity-70"><FileText className="w-3.5 h-3.5" /> Tệp đính kèm</span>
    ) : (
      <span className="truncate opacity-70">{replyingTo.content}</span>
    );

  return (
    <div className="flex items-center gap-2 px-1 py-1.5 mb-1 rounded border-l-[3px] border-[#319527] bg-gray-100 dark:bg-neutral-700">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-[#319527] truncate">
          Đang trả lời {replyingTo.isSelf ? "chính bạn" : name}
        </p>
        <div className="text-[12px] whitespace-nowrap overflow-hidden">{preview}</div>
      </div>
      <button type="button" onClick={onCancel} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-500 flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function MessageInput({ onSend, onSendFile, sending, loggedIn, replyingTo, onCancelReply, editingMessage, onSaveEdit, onCancelEdit, conversationId }) {
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showGuestNameInput, setShowGuestNameInput] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { theme } = useTheme();

  const {
    handleChange: handleMentionChange,
    insertMention,
    showSuggestions,
    suggestions,
    closeSuggestions,
  } = useMentionInput({ value: message, onChange: setMessage, conversationId: loggedIn ? conversationId : null, inputRef: textareaRef });

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content || "");
      setTimeout(() => textareaRef.current?.focus(), 0);
    } else {
      setMessage("");
    }
  }, [editingMessage?.id]);

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

    try {
      if (editingMessage) {
        await onSaveEdit(message.trim());
        setMessage("");
        return;
      }

      // If logged in, send message without guest name
      if (loggedIn) {
        await onSend(message, null, replyingTo?.id || null);
        onCancelReply?.();
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
      <EditComposerBar editingMessage={editingMessage} onCancel={onCancelEdit} />
      <ReplyComposerBar replyingTo={replyingTo} onCancel={onCancelReply} />
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

      {/* Input row: textarea + attach + emoji + send all inline */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TextArea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleMentionChange(e.target.value, e.target.selectionStart)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Viết một tin nhắn..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            classNames={{
              textarea:
                "dark:!bg-neutral-600 bg-white dark:!text-gray-100 dark:!placeholder-gray-400 dark:!border-[#585857]",
            }}
          />
          {showSuggestions && (
            <MentionSuggestionsDropdown
              suggestions={suggestions}
              onSelect={insertMention}
              onClose={closeSuggestions}
              anchorRef={textareaRef}
            />
          )}
        </div>

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
              className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition flex items-center justify-center flex-shrink-0"
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
            className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition flex items-center justify-center flex-shrink-0"
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
          className="h-9 px-4 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
