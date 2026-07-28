"use client";

import { useState, useRef, useEffect } from "react";
import Input from "@/components/ui/input";
import { FileText, Paperclip, Pencil, Send, Video, X } from "lucide-react";
import MentionSuggestionsDropdown from "@/components/ui/MentionSuggestionsDropdown";
import { useMentionInput } from "@/hooks/useMentionInput";

function EditComposerBar({ editingMessage, onCancel }) {
  if (!editingMessage) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700">
      <div className="flex-1 min-w-0 border-l-[3px] border-blue-500 pl-2">
        <p className="text-[11px] font-semibold text-blue-500 flex items-center gap-1 truncate">
          <Pencil className="w-3 h-3" /> Đang sửa tin nhắn
        </p>
        <p className="text-[12px] truncate text-gray-600 dark:text-gray-300 overflow-hidden whitespace-nowrap">
          {editingMessage.content}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-500 dark:text-gray-400 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ReplyComposerBar({ replyingTo, onCancel }) {
  if (!replyingTo) return null;

  const senderName =
    replyingTo.sender?.profile_name || replyingTo.sender?.username || "Ai đó";

  const renderPreview = () => {
    if (replyingTo.type === "image") {
      return (
        <span className="flex items-center gap-1.5">
          {replyingTo.file_url && (
            <img
              src={
                replyingTo.file_url.startsWith("http") ||
                replyingTo.file_url.startsWith("blob:")
                  ? replyingTo.file_url
                  : `${process.env.NEXT_PUBLIC_API_URL}${replyingTo.file_url}`
              }
              alt=""
              className="w-8 h-8 rounded object-cover flex-shrink-0"
            />
          )}
          <span className="truncate text-gray-500 dark:text-gray-400">
            Hình ảnh
          </span>
        </span>
      );
    }
    if (replyingTo.type === "video") {
      return (
        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
          <Video className="w-4 h-4 flex-shrink-0" />
          Video
        </span>
      );
    }
    if (replyingTo.type === "file") {
      return (
        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
          <FileText className="w-4 h-4 flex-shrink-0" />
          Tệp đính kèm
        </span>
      );
    }
    return (
      <span className="truncate text-gray-500 dark:text-gray-400">
        {replyingTo.content}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700">
      <div className="flex-1 min-w-0 border-l-[3px] border-[#319527] pl-2">
        <p className="text-[11px] font-semibold text-[#319527] truncate">
          Đang trả lời{" "}
          {replyingTo.isSelf ? "chính bạn" : replyingTo.sender?.profile_name || replyingTo.sender?.username || "Ai đó"}
        </p>
        <div className="text-[12px] overflow-hidden whitespace-nowrap">
          {renderPreview()}
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-500 dark:text-gray-400 flex-shrink-0"
        title="Hủy trả lời"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ChatMessageInput({
  onSend,
  onSendFile,
  sending,
  onTyping,
  replyingTo,
  onCancelReply,
  editingMessage,
  onSaveEdit,
  onCancelEdit,
  conversationId,
}) {
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    handleChange: handleMentionChange,
    insertMention,
    showSuggestions,
    suggestions,
    closeSuggestions,
  } = useMentionInput({ value: message, onChange: setMessage, conversationId, inputRef });

  // Pre-fill input when entering edit mode
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content || "");
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setMessage("");
    }
  }, [editingMessage?.id]);

  const handleSubmit = async () => {
    if (!message.trim() || sending) return;

    try {
      if (editingMessage) {
        await onSaveEdit(message.trim());
      } else {
        await onSend(message.trim());
      }
      setMessage("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error("[ChatMessageInput] Error:", error);
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
    if (!fileItem) return;

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
    <div className="flex flex-col">
      <EditComposerBar editingMessage={editingMessage} onCancel={onCancelEdit} />
      <ReplyComposerBar replyingTo={replyingTo} onCancel={onCancelReply} />
      <div className="flex items-center gap-2 px-4 py-3 border-t dark:border-neutral-600 bg-white dark:bg-neutral-700 rounded-b-lg">
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
        <div className="flex-1">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => {
              handleMentionChange(e.target.value, e.target.selectionStart);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Gửi tin nhắn..."
            disabled={sending}
            className="w-full"
          />
          {showSuggestions && (
            <MentionSuggestionsDropdown
              suggestions={suggestions}
              onSelect={insertMention}
              onClose={closeSuggestions}
              anchorRef={inputRef}
            />
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || sending}
          className="p-2 bg-[#319527] hover:bg-[#3dbb31] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex-shrink-0"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
