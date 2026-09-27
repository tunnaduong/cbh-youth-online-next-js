"use client";

import React from "react";
import { Select, Switch, Dropdown, Tooltip } from "antd";
import { EditorContent } from "@tiptap/react";
import { Image as ImageIcon, FileVideo, Paperclip, X, Maximize2 } from "lucide-react";
import { IoEarth, IoCaretDown } from "react-icons/io5";
import { FaMarkdown } from "react-icons/fa";
import { FaFileLines } from "react-icons/fa6";
import CustomInput from "@/components/ui/input";
import { RichTextToolbar } from "@/components/ui/RichTextEditor";

/**
 * The actual composer UI (subforum/visibility pickers, title, body editor,
 * attachments, formatting toolbar, submit) shared by the full /composer
 * page (ComposerClient.js) and the quick-create modal (CreatePostModal.js)
 * so the two stay in sync instead of drifting into two implementations.
 *
 * Takes the full return value of usePostComposer() spread as props, plus:
 * @param {import("@tiptap/react").Editor} descriptionEditor
 * @param {boolean} [isEditMode]
 * @param {function} [onOpenAdvanced] - When provided, shows a button next to
 *   Markdown/Quy tắc that hands the current draft off to the full /composer
 *   page (see CreatePostModal.js). Omitted on the /composer page itself,
 *   since it's already the advanced editor.
 */
export default function ComposerForm({
  data,
  setData,
  errors,
  processing,
  selectedSubforum,
  handleSubforumChange,
  selectedVisibility,
  handleVisibilityChange,
  forumData,
  loading,
  descriptionEditor,
  imageFiles,
  imagePreviews,
  existingImages,
  setExistingImages,
  imageInputRef,
  handleImageChange,
  removeImage,
  documentFiles,
  existingDocuments,
  setExistingDocuments,
  documentInputRef,
  handleDocumentChange,
  removeDocument,
  videoFiles,
  videoPreviews,
  existingVideos,
  setExistingVideos,
  videoInputRef,
  handleVideoChange,
  removeVideo,
  isDraggingFiles,
  isDraggableImageSource,
  handleFilesDrop,
  handleFilesDragEnter,
  handleFilesDragLeave,
  uploadProgress,
  handleSubmit,
  isEditMode = false,
  onOpenAdvanced,
}) {
  const canSubmit =
    !processing && data.title.trim() !== "" && data.description.trim() !== "";

  const visibilityMenuItems = [
    {
      key: "public",
      label: (
        <div className="flex items-center gap-2">
          <IoEarth className="text-base" />
          <span>Công khai</span>
        </div>
      ),
    },
    {
      key: "followers",
      disabled: data.anonymous,
      label: (
        <div className="flex items-center gap-2">
          <span>Chỉ người theo dõi</span>
        </div>
      ),
    },
    {
      key: "private",
      label: (
        <div className="flex items-center gap-2">
          <span>Chỉ mình tôi</span>
        </div>
      ),
    },
  ];

  const visibilityLabel =
    selectedVisibility === "public"
      ? "Công khai"
      : selectedVisibility === "followers"
        ? "Chỉ người theo dõi"
        : "Chỉ mình tôi";

  const submitLabel = processing
    ? isEditMode
      ? "Đang cập nhật..."
      : "Đang đăng..."
    : isEditMode
      ? "Cập nhật"
      : "Đăng";

  return (
    <div
      onDragEnter={handleFilesDragEnter}
      onDragOver={(e) => {
        e.preventDefault();
        if (isDraggableImageSource(e.dataTransfer)) e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={handleFilesDragLeave}
      onDrop={handleFilesDrop}
    >
      {/* Community + audience, Reddit-style pill dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={selectedSubforum}
          onChange={handleSubforumChange}
          loading={loading}
          className="min-w-[220px]"
          options={
            forumData?.main_categories
              ?.filter((category) => category.subforums && category.subforums.length > 0)
              ?.map((category) => ({
                label: <span>{category.name}</span>,
                title: category.name,
                options:
                  category.subforums?.map((subforum) => ({
                    label: <span>{subforum.name}</span>,
                    value: subforum.id,
                  })) || [],
              })) || []
          }
          placeholder={loading ? "Đang tải..." : "Chọn chuyên mục"}
        />
        <Dropdown
          menu={{ items: visibilityMenuItems, onClick: ({ key }) => handleVisibilityChange(key) }}
          trigger={["click"]}
          placement="bottomLeft"
        >
          <button className="flex items-center gap-x-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600">
            <IoEarth className="text-sm" />
            {visibilityLabel}
            <IoCaretDown className="text-[9px]" />
          </button>
        </Dropdown>
      </div>
      {errors.subforum_id && <div className="mt-1 text-sm text-red-500">{errors.subforum_id}</div>}

      {/* Title */}
      <div className="mt-4">
        <CustomInput
          placeholder="Tiêu đề*"
          value={data.title}
          onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
          error={errors.title}
          className="!border-0 !border-b !rounded-none !px-0 !text-2xl !font-semibold"
        />
      </div>

      {/* Body */}
      <div className="mt-3">
        <EditorContent
          editor={descriptionEditor}
          className="min-h-[220px] text-[15px] leading-relaxed"
        />
        {errors.description && (
          <div className="mt-1 text-sm text-red-500">{errors.description}</div>
        )}
      </div>

      {/* Attachments preview */}
      {(imagePreviews.length > 0 || existingImages.length > 0) && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={preview.id} className="relative">
              <img
                src={preview.preview}
                alt={`Preview ${index + 1}`}
                className="h-24 w-full rounded-md border object-cover dark:!border-neutral-500"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {existingImages.map((img) => (
            <div key={`existing-${img.id}`} className="relative">
              <img
                src={img.url}
                alt="Existing"
                className="h-24 w-full rounded-md border object-cover dark:!border-neutral-500"
              />
              <button
                type="button"
                onClick={() => setExistingImages((prev) => prev.filter((item) => item.id !== img.id))}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {(videoPreviews.length > 0 || existingVideos.length > 0) && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {videoPreviews.map((preview, index) => (
            <div key={preview.id} className="relative">
              <video
                src={preview.preview}
                controls
                className="h-24 w-full rounded-md border bg-black object-cover dark:!border-neutral-500"
              />
              <button
                type="button"
                onClick={() => removeVideo(index)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {existingVideos.map((vid) => (
            <div key={`existing-video-${vid.id}`} className="relative">
              <video
                src={vid.url}
                controls
                className="h-24 w-full rounded-md border bg-black object-cover dark:!border-neutral-500"
              />
              <button
                type="button"
                onClick={() => setExistingVideos((prev) => prev.filter((item) => item.id !== vid.id))}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {(documentFiles.length > 0 || existingDocuments.length > 0) && (
        <div className="mt-4 flex flex-col gap-2">
          {documentFiles.map((file, index) => (
            <div
              key={`doc-${index}`}
              className="flex items-center justify-between rounded-md bg-gray-100 p-2 dark:bg-neutral-600"
            >
              <div className="flex items-center overflow-hidden">
                <FaFileLines size={16} className="mr-2 flex-shrink-0 text-blue-500" />
                <span className="truncate text-sm">{file.name}</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button type="button" onClick={() => removeDocument(index)} className="ml-2 text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {existingDocuments.map((doc) => (
            <div
              key={`existing-doc-${doc.id}`}
              className="flex items-center justify-between rounded-md bg-gray-100 p-2 dark:bg-neutral-600"
            >
              <div className="flex items-center overflow-hidden">
                <FaFileLines size={16} className="mr-2 flex-shrink-0 text-blue-500" />
                <span className="truncate text-sm">{doc.name || "Tài liệu"}</span>
              </div>
              <button
                type="button"
                onClick={() => setExistingDocuments((prev) => prev.filter((item) => item.id !== doc.id))}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isDraggingFiles && (
        <div className="mt-4 rounded-lg border-2 border-dashed border-emerald-500 bg-emerald-50 p-4 text-center dark:bg-emerald-950/30">
          <p className="text-sm font-medium">Kéo và thả ảnh, video hoặc tài liệu vào đây</p>
        </div>
      )}

      {processing && videoFiles.length > 0 && (
        <div className="mt-4 w-full">
          <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Đang tải lên...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-600">
            <div
              className="h-full bg-primary-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Toolbar: formatting + attachments in one row, Reddit-style */}
      <div className="mt-3 rounded-md border dark:!border-neutral-600">
        <RichTextToolbar editor={descriptionEditor} />
        <div className="flex items-center gap-1 border-t px-2 py-1.5 dark:!border-neutral-600">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={handleDocumentChange}
            style={{ display: "none" }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,.mp4,.mov,.avi,.webm,.mkv"
            multiple
            onChange={handleVideoChange}
            style={{ display: "none" }}
          />
          <Tooltip title="Đính kèm ảnh">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="rounded p-1.5 text-emerald-500 hover:bg-gray-100 dark:hover:bg-neutral-600"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip title="Đính kèm video">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="rounded p-1.5 text-purple-500 hover:bg-gray-100 dark:hover:bg-neutral-600"
            >
              <FileVideo className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip title="Đính kèm tài liệu">
            <button
              type="button"
              onClick={() => documentInputRef.current?.click()}
              className="rounded p-1.5 text-blue-500 hover:bg-gray-100 dark:hover:bg-neutral-600"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </Tooltip>
          {(imageFiles.length > 0 || documentFiles.length > 0 || videoFiles.length > 0) && (
            <span className="ml-1 text-xs font-semibold text-primary-500">
              {imageFiles.length + documentFiles.length + videoFiles.length} đã chọn
            </span>
          )}
          <div className="ml-auto flex items-center gap-x-2 text-gray-500 dark:text-neutral-400">
            {onOpenAdvanced && (
              <Tooltip title="Mở trình soạn thảo nâng cao">
                <button
                  type="button"
                  onClick={onOpenAdvanced}
                  className="flex items-center text-xs font-bold hover:text-primary-500"
                >
                  <Maximize2 className="mr-1 h-3.5 w-3.5" />
                  Nâng cao
                </button>
              </Tooltip>
            )}
            <a href="/guide/markdown" className="flex items-center text-xs font-bold" target="_blank">
              <FaMarkdown className="mr-1" />
              Markdown
            </a>
            <a href="/policy/forum-rules" className="flex items-center text-xs font-bold" target="_blank">
              <FaFileLines className="mr-1" />
              Quy tắc
            </a>
          </div>
        </div>
      </div>

      {/* Anonymous toggle + submit */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
          <Switch
            size="small"
            checked={data.anonymous}
            onChange={(checked) => setData((prev) => ({ ...prev, anonymous: checked }))}
          />
          Đăng ẩn danh
        </label>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-primary-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-neutral-600 dark:disabled:text-neutral-400"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
