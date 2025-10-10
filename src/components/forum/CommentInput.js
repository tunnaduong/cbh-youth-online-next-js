"use client";

import { useEffect, useRef, useState, useContext } from "react";
import { Button, Popover, Dropdown } from "antd";
import { LuType, LuArrowUp, LuChevronDown } from "react-icons/lu";
import { RiEmojiStickerLine, RiAttachment2 } from "react-icons/ri";
import { useAuthContext } from "@/contexts/Support";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useTheme } from "@/contexts/themeContext";
import MarkdownToolbar from "@/components/ui/MarkdownToolbar";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

export function CommentInput({
  placeholder = "Nhập bình luận của bạn...",
  onSubmit,
  onCancel,
  focus = false,
}) {
  const [comment, setComment] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showMarkdownToolbarState, setShowMarkdownToolbarState] =
    useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const wrapperRef = useRef(null);
  const textareaRef = useRef(null);
  const { currentUser } = useAuthContext();
  const { theme } = useTheme();

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit?.(comment.trim(), isAnonymous);
      setComment("");
      setIsAnonymous(false);
      setIsPreviewMode(false);
    }
  };

  const handleCancel = () => {
    setComment("");
    setIsFocused(false);
    setIsAnonymous(false);
    setIsPreviewMode(false);
    onCancel?.();
  };

  const handleTogglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const identityMenuItems = [
    {
      key: "public",
      label: (
        <div className="flex items-center gap-2">
          <img
            src={`https://api.chuyenbienhoa.com/v1.0/users/${currentUser?.username}/avatar`}
            alt="Avatar của bạn"
            className="w-6 h-6 rounded-full"
          />
          <span>{currentUser?.profile_name || currentUser?.username}</span>
        </div>
      ),
      onClick: () => setIsAnonymous(false),
    },
    {
      key: "anonymous",
      label: (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#e9f1e9] dark:bg-[#1d281b] flex items-center justify-center">
            <span className="text-xs text-white">?</span>
          </div>
          <span>Ẩn danh</span>
        </div>
      ),
      onClick: () => setIsAnonymous(true),
    },
  ];

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const insertEmojiAtCursor = (emojiNative) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setComment((prev) => prev + emojiNative);
      return;
    }

    const start = textarea.selectionStart ?? comment.length;
    const end = textarea.selectionEnd ?? comment.length;
    const before = comment.substring(0, start);
    const after = comment.substring(end);
    const next = before + emojiNative + after;
    setComment(next);

    // Restore cursor after emoji
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + emojiNative.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      // If preview mode is on, ignore all clicks outside and keep focus
      if (isPreviewMode) return;

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        !document.querySelector(".ant-popover")?.contains(event.target)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPreviewMode]);

  // Auto-focus textarea when focus prop is true
  useEffect(() => {
    if (focus && textareaRef.current) {
      setIsFocused(true);
      textareaRef.current.focus();
    }
  }, [focus]);

  // Adjust textarea height when switching from preview mode
  useEffect(() => {
    if (!isPreviewMode && textareaRef.current) {
      const target = textareaRef.current;
      target.style.height = "auto";
      target.style.height = target.scrollHeight + "px";
    }
  }, [isPreviewMode]);

  return (
    <div className="w-full max-w-4xl mx-auto" ref={wrapperRef}>
      <div
        onClick={() => setIsFocused(true)}
        className={`
        relative border rounded-2xl
        transition-all duration-200 dark:!border-gray-600
        ${isFocused ? "ring-2 ring-ring/20" : ""}
      `}
      >
        <div className={`flex gap-3 p-4 pb-0 ${!isFocused ? "pb-3" : ""}`}>
          <div className="relative flex-none self-start">
            {isAnonymous ? (
              <div className="w-8 h-8 rounded-full bg-[#e9f1e9] dark:bg-[#1d281b] flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-white font-medium">?</span>
              </div>
            ) : (
              <img
                src={`https://api.chuyenbienhoa.com/v1.0/users/${currentUser?.username}/avatar`}
                alt="Avatar của bạn"
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            )}
            <Dropdown
              menu={{ items: identityMenuItems }}
              trigger={["click"]}
              placement="bottomLeft"
            >
              <Button
                size="small"
                className="absolute -bottom-1 -right-1 w-4 h-4 p-0 rounded-full !bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
              >
                <LuChevronDown className="w-3 h-3 text-gray-600" />
              </Button>
            </Dropdown>
          </div>
          <div className="flex-1">
            {isPreviewMode ? (
              <div className="min-h-[24px] p-2 text-sm bg-gray-50 dark:bg-gray-800 rounded border mb-3">
                <MarkdownRenderer content={comment} />
              </div>
            ) : (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                ref={textareaRef}
                placeholder={placeholder}
                rows={1}
                className="
                  w-full bg-transparent border-none outline-none resize-none
                  text-foreground placeholder:text-muted-foreground
                  text-sm min-h-[24px] leading-6 ring-transparent focus:ring-transparent focus:border-transparent
                  pl-0 pt-0 mt-1
                "
                style={{
                  height: "auto",
                  minHeight: "24px",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
                onInput={(e) => {
                  const target = e.target;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
            )}
          </div>
        </div>

        <div
          className={`flex items-center justify-between px-4 ${
            !showMarkdownToolbarState && "pb-4"
          } ml-11 ${isFocused ? "fade-in-bottom" : "hidden"}`}
        >
          {/* Left side controls */}
          <div className="flex items-center gap-2">
            <Popover
              open={showEmoji}
              onOpenChange={(open) => setShowEmoji(open)}
              trigger={["click"]}
              placement="topLeft"
              content={
                <div>
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji) => {
                      insertEmojiAtCursor(emoji.native);
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
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                onClick={() => setShowEmoji(!showEmoji)}
              >
                <RiEmojiStickerLine className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Popover>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
            >
              <RiAttachment2 className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-muted"
              onClick={() =>
                setShowMarkdownToolbarState(!showMarkdownToolbarState)
              }
            >
              <LuType className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!comment.trim()}
              className="!bg-primary-500 hover:!bg-primary-600 disabled:!bg-primary-200 disabled:!text-gray-400 text-white rounded-full h-8 w-8 p-0"
            >
              <LuArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Markdown Toolbar */}
        {isFocused && (
          <div
            className={`ml-11 ${
              showMarkdownToolbarState ? "fade-in-bottom" : "hidden"
            }`}
          >
            <MarkdownToolbar
              textareaRef={textareaRef}
              onTextChange={setComment}
              onTogglePreview={handleTogglePreview}
              isPreviewMode={isPreviewMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
