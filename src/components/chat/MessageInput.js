"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button, Popover } from "antd";
import { Send, Paperclip, Pencil, X, FileText, Video } from "lucide-react";
import { RiEmojiStickerLine } from "react-icons/ri";
import Picker from "@emoji-mart/react";
import { useTheme } from "@/contexts/themeContext";
import MentionSuggestionsDropdown from "@/components/ui/MentionSuggestionsDropdown";
import { useMentionInput } from "@/hooks/useMentionInput";
import { buildHtml, getCaretOffset, setCaretOffset, getContentText, makeProxyRef } from "@/utils/richInput";

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

export default function MessageInput({
  onSend, onSendFile, sending, loggedIn,
  replyingTo, onCancelReply,
  editingMessage, onSaveEdit, onCancelEdit,
  conversationId,
}) {
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showGuestNameInput, setShowGuestNameInput] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const divRef = useRef(null);
  const fileInputRef = useRef(null);
  const { theme } = useTheme();

  // Proxy ref compatible with useMentionInput
  const textareaRef = useRef(makeProxyRef(() => divRef.current, setMessage));

  const {
    handleChange: handleMentionChange,
    insertMention,
    showSuggestions,
    suggestions,
    closeSuggestions,
  } = useMentionInput({
    value: message,
    onChange: setMessage,
    conversationId: loggedIn ? conversationId : null,
    inputRef: textareaRef,
  });

  // Sync div when message changes externally (edit mode, submit clear)
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const current = getContentText(el);
    if (current !== message) {
      el.innerHTML = buildHtml(message);
      if (message) setCaretOffset(el, message.length);
    }
  }, [message]);

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content || "");
      setTimeout(() => divRef.current?.focus(), 0);
    } else {
      setMessage("");
    }
  }, [editingMessage?.id]);

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

  const handleSubmit = useCallback(async () => {
    if (!message.trim()) return;
    try {
      if (editingMessage) {
        await onSaveEdit(message.trim());
        setMessage("");
        return;
      }
      if (loggedIn) {
        await onSend(message, null, replyingTo?.id || null);
        onCancelReply?.();
      } else {
        if (!guestName?.trim()) {
          setShowGuestNameInput(true);
          alert("Vui lòng nhập tên hiển thị");
          return;
        }
        localStorage.setItem("chat_guest_name", guestName.trim());
        await onSend(message, guestName.trim());
      }
      setMessage("");
      if (!loggedIn && guestName) setShowGuestNameInput(false);
    } catch (error) {
      console.error("[MessageInput] Error in handleSubmit:", error);
    }
  }, [message, editingMessage, loggedIn, replyingTo, guestName, onSend, onSaveEdit, onCancelReply]);

  const handleInput = useCallback((e) => {
    const el = e.currentTarget;
    const offset = getCaretOffset(el);
    const text = getContentText(el);
    el.innerHTML = buildHtml(text);
    setCaretOffset(el, offset);
    setMessage(text);
    handleMentionChange(text, offset);
  }, [handleMentionChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handlePaste = useCallback(async (e) => {
    if (!onSendFile || !loggedIn) return;
    const items = Array.from(e.clipboardData?.items || []);
    const fileItem = items.find((item) => item.kind === "file");
    if (!fileItem) return;
    e.preventDefault();
    const file = fileItem.getAsFile();
    if (!file) return;
    try {
      await onSendFile(file);
    } catch (error) {
      console.error("[MessageInput] Error sending pasted file:", error);
    }
  }, [onSendFile, loggedIn]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onSendFile || !loggedIn) return;
    try { await onSendFile(file); } catch (error) {
      console.error("[MessageInput] Error sending file:", error);
    }
  };

  const insertEmoji = useCallback((emoji) => {
    const el = divRef.current;
    if (!el) {
      setMessage((prev) => prev + emoji);
      return;
    }
    el.focus();
    const offset = getCaretOffset(el);
    const text = getContentText(el);
    const newText = text.slice(0, offset) + emoji + text.slice(offset);
    el.innerHTML = buildHtml(newText);
    const newOffset = offset + emoji.length;
    setCaretOffset(el, newOffset);
    setMessage(newText);
    handleMentionChange(newText, newOffset);
  }, [handleMentionChange]);

  return (
    <div className="space-y-2">
      <EditComposerBar editingMessage={editingMessage} onCancel={onCancelEdit} />
      <ReplyComposerBar replyingTo={replyingTo} onCancel={onCancelReply} />

      {!loggedIn && showGuestNameInput && (
        <div className="mb-2">
          <input
            type="text"
            placeholder="Nhập tên hiển thị của bạn..."
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && guestName.trim()) {
                setShowGuestNameInput(false);
                localStorage.setItem("chat_guest_name", guestName.trim());
              }
            }}
            className="border border-gray-300 dark:border-neutral-600 rounded px-3 py-1.5 text-sm w-full max-w-[calc(100%-60px)] bg-white dark:bg-neutral-600 text-gray-900 dark:text-gray-100 focus:outline-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tên này sẽ được hiển thị khi bạn gửi tin nhắn
          </p>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <div
            ref={divRef}
            contentEditable={!sending}
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            data-placeholder="Viết một tin nhắn..."
            className="
              ce-input
              w-full min-h-[38px]
              px-3 py-2
              text-sm leading-[1.375rem]
              text-gray-900 dark:text-gray-100
              bg-white dark:bg-neutral-600
              border border-gray-300 dark:border-[#585857]
              rounded-lg
              focus:outline-none focus:border-[#4096ff] focus:shadow-[0_0_0_2px_rgba(5,145,255,0.1)]
              whitespace-pre-wrap break-words overflow-y-auto
            "
            style={{ maxHeight: "144px" }}
          />
          {showSuggestions && (
            <MentionSuggestionsDropdown
              suggestions={suggestions}
              onSelect={insertMention}
              onClose={closeSuggestions}
              anchorRef={divRef}
            />
          )}
        </div>

        {loggedIn && (
          <>
            <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: "none" }} />
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

        <Popover
          trigger="click"
          placement="topLeft"
          open={showEmoji}
          onOpenChange={(open) => setShowEmoji(open)}
          content={
            <div>
              <Picker
                data={async () => (await import("@emoji-mart/data")).default}
                onEmojiSelect={(emoji) => insertEmoji(emoji.native)}
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
