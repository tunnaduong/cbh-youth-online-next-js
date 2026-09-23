"use client";

import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { ConfigProvider, Tooltip, message } from "antd";
import { FaBold, FaItalic, FaLink, FaCode, FaQuoteLeft, FaListUl, FaListOl } from "react-icons/fa";
import { TbH1, TbH2, TbH3, TbH4 } from "react-icons/tb";
import { createMentionExtension } from "./MentionExtension";
import { normalizeNewlines } from "@/utils/richInput";
import { uploadInlineImage } from "@/utils/imageUpload";

/**
 * Tiptap WYSIWYG editor for post bodies. Storage format is still Markdown
 * (`value`/`onChange` are plain Markdown strings) so old posts and the
 * backend's Markdown -> HTML renderer don't need any changes - only the
 * *editing* experience moves from a hand-rolled contentEditable
 * (usePostComposer.js's old divRef/textareaRef machinery) to a real
 * ProseMirror-backed editor. Shared by the /composer page and the edit
 * modal (CreatePostModal.js).
 *
 * @param {object} opts
 * @param {number|string} [opts.imageUid] - Owner id sent with images pasted
 *   or dropped into the body (see uploadInlineImage).
 */
export function useRichTextEditor({
  value,
  onChange,
  placeholder,
  editable = true,
  imageUid,
}) {
  // ProseMirror installs its handlers once, at editor creation - reach the
  // editor (and the latest props) through refs so they can't go stale.
  const editorRef = useRef(null);
  const imageUidRef = useRef(imageUid);
  imageUidRef.current = imageUid;

  // An image pasted or dropped into the body is *inline content*: it gets
  // uploaded and written into the Markdown as `![](url)` right where the
  // caret was, not added to the post's attachment list (that list is for
  // files the reader browses as a gallery underneath the post).
  const uploadAndInsertImages = async (files, at) => {
    const key = `inline-image-${Date.now()}`;
    message.open({ key, type: "loading", content: "Đang tải ảnh lên...", duration: 0 });

    const urls = [];
    try {
      for (const file of files) {
        urls.push(await uploadInlineImage(file, imageUidRef.current));
      }
      message.destroy(key);
    } catch (err) {
      message.destroy(key);
      message.error(
        err?.response?.data?.message || err?.message || "Tải ảnh lên thất bại"
      );
    }

    if (urls.length > 0) insertImagesAt(urls, at);
  };

  const insertImagesAt = (urls, at) => {
    const editor = editorRef.current;
    if (!editor || editor.isDestroyed) return;
    // The document may have grown or shrunk while the upload was in flight.
    const pos = Math.min(at, editor.state.doc.content.size);
    editor
      .chain()
      .focus()
      .insertContentAt(
        pos,
        urls.map((src) => ({ type: "image", attrs: { src } }))
      )
      .run();
  };

  const handleImageTransfer = (view, dataTransfer) => {
    if (!dataTransfer) return false;

    const at = view.state.selection.from;

    const files = Array.from(dataTransfer.files || []).filter((file) =>
      file.type.startsWith("image/")
    );
    if (files.length > 0) {
      uploadAndInsertImages(files, at);
      return true;
    }

    // "Copy image" from a web page puts an <img> on the clipboard as HTML
    // with no text alongside it - that URL is already public, so it goes in
    // as-is. A copied *link* carries HTML too, but with the URL as its text,
    // and should stay a plain pasted link.
    const plainText = dataTransfer.getData("text/plain");
    if (plainText && plainText.trim()) return false;

    const html = dataTransfer.getData("text/html");
    const match = html && html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && /^https?:\/\//i.test(match[1])) {
      insertImagesAt([match[1]], at);
      return true;
    }

    return false;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: false },
      }),
      Placeholder.configure({ placeholder: placeholder || "" }),
      Markdown.configure({
        html: false,
        linkify: true,
        breaks: true,
        transformPastedText: true,
      }),
      createMentionExtension(),
      // Images live in the body as Markdown `![](url)`, which tiptap-markdown
      // serializes from this node. Remote/base64 sources are never written by
      // us; uploads go through /v1.0/upload first.
      Image.configure({ allowBase64: false }),
    ],
    content: normalizeNewlines(value),
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[160px] text-base",
      },
      handlePaste: (view, event) => handleImageTransfer(view, event.clipboardData),
      handleDrop: (view, event) => {
        if (!handleImageTransfer(view, event.dataTransfer)) return false;
        // Handled here - stop it from also reaching the composer's own
        // drop zone (ComposerForm's wrapper), which would attach it twice.
        event.preventDefault();
        event.stopPropagation();
        return true;
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.storage.markdown.getMarkdown());
    },
  });

  editorRef.current = editor;

  // Keep the editor in sync with externally-driven value changes (e.g. the
  // edit-mode fetch in usePostComposer.js resolving after the editor already
  // mounted) without fighting the user's own typing - only resync when the
  // editor doesn't currently have focus, so a prop update from our own
  // onUpdate->setData->value round-trip never clobbers an in-progress edit.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const next = normalizeNewlines(value);
    const current = editor.storage.markdown.getMarkdown();
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  return editor;
}

export function RichTextEditor({ value, onChange, placeholder, className = "" }) {
  const editor = useRichTextEditor({ value, onChange, placeholder });
  return <EditorContent editor={editor} className={className} />;
}

export function RichTextToolbar({ editor }) {
  if (!editor) return null;

  const handleLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Nhập đường dẫn:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const btnClass = (active) =>
    `p-1.5 rounded transition-colors ${
      active
        ? "bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300"
        : "hover:bg-gray-200 dark:hover:bg-neutral-500"
    }`;

  const configProviderProps = {
    theme: { token: { controlHeight: 30 } },
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 text-gray-500 dark:text-neutral-400 flex-wrap">
      <ConfigProvider {...configProviderProps}>
        {[1, 2, 3, 4].map((level) => {
          const Icon = [TbH1, TbH2, TbH3, TbH4][level - 1];
          return (
            <Tooltip key={level} title={`Tiêu đề cấp ${level}`} placement="bottom">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                className={btnClass(editor.isActive("heading", { level }))}
              >
                <Icon className="text-lg" />
              </button>
            </Tooltip>
          );
        })}

        <div className="w-px h-6 bg-gray-300 dark:bg-neutral-500 mx-1" />

        <Tooltip title="In đậm" placement="bottom">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btnClass(editor.isActive("bold"))}
          >
            <FaBold className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="In nghiêng" placement="bottom">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btnClass(editor.isActive("italic"))}
          >
            <FaItalic className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="Liên kết" placement="bottom">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleLink}
            className={btnClass(editor.isActive("link"))}
          >
            <FaLink className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="Mã code" placement="bottom">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={btnClass(editor.isActive("code"))}
          >
            <FaCode className="text-sm" />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 dark:bg-neutral-500 mx-1" />

        <Tooltip title="Trích dẫn" placement="bottom">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={btnClass(editor.isActive("blockquote"))}
          >
            <FaQuoteLeft className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="Danh sách có dấu đầu dòng" placement="bottom">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={btnClass(editor.isActive("bulletList"))}
          >
            <FaListUl className="text-sm" />
          </button>
        </Tooltip>

        <Tooltip title="Danh sách có số thứ tự" placement="bottom">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={btnClass(editor.isActive("orderedList"))}
          >
            <FaListOl className="text-sm" />
          </button>
        </Tooltip>
      </ConfigProvider>
    </div>
  );
}
