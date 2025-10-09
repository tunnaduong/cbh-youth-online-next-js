"use client";

import React from "react";
import { ConfigProvider, Tooltip } from "antd";
import {
  FaBold,
  FaItalic,
  FaLink,
  FaCode,
  FaQuoteLeft,
  FaListUl,
  FaListOl,
} from "react-icons/fa";
import { TbH1, TbH2, TbH3, TbH4 } from "react-icons/tb";

const MarkdownToolbar = ({
  textareaRef,
  onTextChange,
  isPreviewMode = false,
}) => {
  const insertMarkdown = (syntax, cursorPosition, wrapFunction) => {
    if (!textareaRef?.current) return;

    const textarea =
      textareaRef.current.resizableTextArea?.textArea || textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    let newText = "";
    let newCursorPos = start;

    if (selectedText) {
      // Wrap selected text using the provided wrap function
      const wrappedText = wrapFunction(selectedText);
      newText = before + wrappedText + after;
      newCursorPos = start + wrappedText.length;
    } else {
      // Insert at cursor
      newText = before + syntax + after;
      // Position cursor at the specified position within the syntax
      newCursorPos = start + cursorPosition;
    }

    // Update textarea value directly
    textarea.value = newText;

    // Use React's onChange handler instead of synthetic event
    if (onTextChange) {
      onTextChange(newText);
    }

    // Restore cursor position
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const handleHeading = (level) => {
    const syntax = `${"#".repeat(level)} `;
    const wrapFunction = (text) => `${"#".repeat(level)} ${text}`;
    insertMarkdown(syntax, syntax.length, wrapFunction);
  };

  const handleBold = () => {
    const syntax = "****";
    const wrapFunction = (text) => `**${text}**`;
    insertMarkdown(syntax, 2, wrapFunction); // Position cursor between the **
  };

  const handleItalic = () => {
    const syntax = "**";
    const wrapFunction = (text) => `*${text}*`;
    insertMarkdown(syntax, 1, wrapFunction); // Position cursor between the *
  };

  const handleLink = () => {
    const syntax = "[](url)";
    const wrapFunction = (text) => `[${text}](url)`;
    insertMarkdown(syntax, 1, wrapFunction); // Position cursor inside the []
  };

  const handleCode = () => {
    const syntax = "``";
    const wrapFunction = (text) => `\`${text}\``;
    insertMarkdown(syntax, 1, wrapFunction); // Position cursor between the `
  };

  const handleQuote = () => {
    const syntax = "> ";
    const wrapFunction = (text) => `> ${text}`;
    insertMarkdown(syntax, syntax.length, wrapFunction);
  };

  const handleBulletList = () => {
    const syntax = "- ";
    const wrapFunction = (text) => `- ${text}`;
    insertMarkdown(syntax, syntax.length, wrapFunction);
  };

  const handleNumberedList = () => {
    const syntax = "1. ";
    const wrapFunction = (text) => `1. ${text}`;
    insertMarkdown(syntax, syntax.length, wrapFunction);
  };

  const configProviderProps = {
    theme: {
      token: {
        controlHeight: 30,
      },
    },
  };

  if (isPreviewMode) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 text-gray-500 dark:text-neutral-400">
      <ConfigProvider {...configProviderProps}>
        <Tooltip title="Tiêu đề cấp 1" placement="bottom">
          <button
            type="button"
            onClick={() => handleHeading(1)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <TbH1 className="text-lg" />
          </button>
        </Tooltip>

        <Tooltip title="Tiêu đề cấp 2" placement="bottom">
          <button
            type="button"
            onClick={() => handleHeading(2)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <TbH2 className="text-lg" />
          </button>
        </Tooltip>

        <Tooltip title="Tiêu đề cấp 3" placement="bottom">
          <button
            type="button"
            onClick={() => handleHeading(3)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <TbH3 className="text-lg" />
          </button>
        </Tooltip>

        <Tooltip title="Tiêu đề cấp 4" placement="bottom">
          <button
            type="button"
            onClick={() => handleHeading(4)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <TbH4 className="text-lg" />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 dark:bg-neutral-500 mx-1" />

        <Tooltip title="In đậm" placement="bottom">
          <button
            type="button"
            onClick={handleBold}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <FaBold className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="In nghiêng" placement="bottom">
          <button
            type="button"
            onClick={handleItalic}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <FaItalic className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="Liên kết" placement="bottom">
          <button
            type="button"
            onClick={handleLink}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <FaLink className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="Mã code" placement="bottom">
          <button
            type="button"
            onClick={handleCode}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <FaCode className="text-sm" />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 dark:bg-neutral-500 mx-1" />

        <Tooltip title="Trích dẫn" placement="bottom">
          <button
            type="button"
            onClick={handleQuote}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <FaQuoteLeft className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="Danh sách có dấu đầu dòng" placement="bottom">
          <button
            type="button"
            onClick={handleBulletList}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <FaListUl className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="Danh sách có số thứ tự" placement="bottom">
          <button
            type="button"
            onClick={handleNumberedList}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-500 transition-colors"
          >
            <FaListOl className="text-sm" />
          </button>
        </Tooltip>
      </ConfigProvider>
    </div>
  );
};

export default MarkdownToolbar;
