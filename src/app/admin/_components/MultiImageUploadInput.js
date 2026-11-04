"use client";

import { useId, useRef, useState } from "react";
import { Button, Image, Input, Space, Tag, Tooltip, Upload, message } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { uploadInlineImage, MAX_INLINE_IMAGE_MB } from "@/utils/imageUpload";

const MAX_MB = MAX_INLINE_IMAGE_MB;

/**
 * Multiple images upload and management component.
 * Works as an antd Form control (value/onChange) or standalone.
 * Supports:
 * - Selecting and uploading multiple files simultaneously
 * - Pasting single or multiple image URLs (comma / space / newline separated)
 * - Reordering images (the first image is the primary thumbnail)
 * - Setting any image as the primary one
 * - Deleting individual images or clearing all
 * - Image preview via Antd Image preview
 */
export default function MultiImageUploadInput({
  value = [],
  onChange,
  maxImages = 30,
}) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const inputId = useId();

  // Normalize value to an array of non-empty strings
  const urls = Array.isArray(value)
    ? value.filter((u) => typeof u === "string" && u.trim().length > 0)
    : typeof value === "string" && value.trim().length > 0
    ? [value.trim()]
    : [];

  const updateUrls = (next) => {
    onChange?.(next);
  };

  // Upload handler for multiple selected files
  const beforeUpload = async (file, fileList) => {
    // Only trigger the batch upload on the first file of the selection to prevent N parallel handler runs
    if (fileList && fileList.length > 0 && file !== fileList[0]) {
      return Upload.LIST_IGNORE;
    }

    const filesToUpload = fileList && fileList.length > 0 ? fileList : [file];
    const validFiles = [];

    for (const f of filesToUpload) {
      if (!f.type.startsWith("image/")) {
        message.warning(`Bỏ qua "${f.name}": Chỉ hỗ trợ tệp ảnh.`);
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        message.warning(`Bỏ qua "${f.name}": Ảnh tối đa ${MAX_MB}MB.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) {
      return Upload.LIST_IGNORE;
    }

    if (urls.length + validFiles.length > maxImages) {
      message.error(`Tối đa ${maxImages} ảnh cho mỗi sản phẩm.`);
      return Upload.LIST_IGNORE;
    }

    setUploadingCount(validFiles.length);

    try {
      const results = [];
      for (let i = 0; i < validFiles.length; i++) {
        const currentFile = validFiles[i];
        try {
          const uploadedUrl = await uploadInlineImage(currentFile);
          if (uploadedUrl) results.push(uploadedUrl);
        } catch (err) {
          message.error(`Lỗi tải ảnh "${currentFile.name}": ${err?.message || "Thất bại"}`);
        }
      }

      if (results.length > 0) {
        const next = [...urls, ...results];
        updateUrls(next);
        message.success(`Đã tải lên thành công ${results.length} ảnh`);
      }
    } finally {
      setUploadingCount(0);
    }

    return Upload.LIST_IGNORE;
  };

  const handleAddUrl = () => {
    const raw = urlInput.trim();
    if (!raw) return;

    // Split by comma, newline or whitespace
    const items = raw
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http://") || s.startsWith("https://"));

    if (items.length === 0) {
      message.error("Vui lòng nhập URL ảnh hợp lệ (bắt đầu bằng http:// hoặc https://)");
      return;
    }

    if (urls.length + items.length > maxImages) {
      message.error(`Tối đa ${maxImages} ảnh cho mỗi sản phẩm.`);
      return;
    }

    updateUrls([...urls, ...items]);
    setUrlInput("");
    message.success(`Đã thêm ${items.length} ảnh từ URL`);
  };

  const handleRemove = (index) => {
    const next = urls.filter((_, i) => i !== index);
    updateUrls(next);
  };

  const handleSetPrimary = (index) => {
    if (index === 0) return;
    const target = urls[index];
    const next = [target, ...urls.filter((_, i) => i !== index)];
    updateUrls(next);
  };

  const handleMove = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= urls.length) return;
    const next = [...urls];
    const temp = next[index];
    next[index] = next[newIndex];
    next[newIndex] = temp;
    updateUrls(next);
  };

  return (
    <div className="space-y-3">
      {/* Upload button & URL input row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Upload
          multiple
          accept="image/*"
          showUploadList={false}
          beforeUpload={beforeUpload}
          disabled={uploadingCount > 0 || urls.length >= maxImages}
        >
          <Button
            icon={uploadingCount > 0 ? <LoadingOutlined /> : <UploadOutlined />}
            loading={uploadingCount > 0}
            type="primary"
            ghost
          >
            {uploadingCount > 0
              ? `Đang tải ${uploadingCount} ảnh...`
              : "Chọn nhiều ảnh từ máy"}
          </Button>
        </Upload>

        <div className="flex-1 flex gap-2">
          <Input
            id={inputId}
            placeholder="Hoặc dán URL ảnh (hỗ trợ nhiều URL cách nhau bằng dấu phẩy)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onPressEnter={(e) => {
              e.preventDefault();
              handleAddUrl();
            }}
          />
          <Button icon={<PlusOutlined />} onClick={handleAddUrl}>
            Thêm
          </Button>
        </div>

        {urls.length > 1 && (
          <Button danger ghost onClick={() => updateUrls([])}>
            Xóa hết
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>
          Ảnh đầu tiên (#1) sẽ là ảnh đại diện chính của sản phẩm. Bạn có thể chọn nhiều ảnh cùng lúc khi tải lên.
        </span>
        <span className="shrink-0 font-medium">
          {urls.length}/{maxImages} ảnh
        </span>
      </div>

      {/* Images list / gallery */}
      {urls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700">
          <Image.PreviewGroup>
            {urls.map((url, index) => {
              const isPrimary = index === 0;
              return (
                <div
                  key={`${url}-${index}`}
                  className={`group relative rounded-lg border overflow-hidden bg-white dark:bg-neutral-800 flex flex-col transition-all ${
                    isPrimary
                      ? "border-green-500 ring-2 ring-green-500/20 shadow-sm"
                      : "border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {/* Badge */}
                  <div className="absolute top-1 left-1 z-10">
                    {isPrimary ? (
                      <Tag color="success" className="!m-0 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                        <StarFilled className="text-yellow-300" /> Chính
                      </Tag>
                    ) : (
                      <Tag className="!m-0 text-[10px] bg-black/60 text-white border-0 shadow-sm">
                        #{index + 1}
                      </Tag>
                    )}
                  </div>

                  {/* Image thumb */}
                  <div className="aspect-square relative w-full overflow-hidden bg-gray-100 dark:bg-neutral-900 flex items-center justify-center">
                    <Image
                      src={url}
                      alt={`Ảnh sản phẩm ${index + 1}`}
                      className="!h-full !w-full !object-cover"
                      wrapperClassName="!h-full !w-full"
                    />
                  </div>

                  {/* Actions footer */}
                  <div className="p-1 flex items-center justify-between bg-gray-50 dark:bg-neutral-800/90 border-t border-gray-100 dark:border-neutral-700">
                    <Space size={2}>
                      <Tooltip title="Chuyển lên trước">
                        <Button
                          size="small"
                          type="text"
                          icon={<ArrowLeftOutlined />}
                          disabled={index === 0}
                          onClick={() => handleMove(index, -1)}
                          className="!px-1"
                        />
                      </Tooltip>
                      <Tooltip title="Chuyển ra sau">
                        <Button
                          size="small"
                          type="text"
                          icon={<ArrowRightOutlined />}
                          disabled={index === urls.length - 1}
                          onClick={() => handleMove(index, 1)}
                          className="!px-1"
                        />
                      </Tooltip>
                      {!isPrimary && (
                        <Tooltip title="Đặt làm ảnh chính">
                          <Button
                            size="small"
                            type="text"
                            icon={<StarOutlined className="text-amber-500" />}
                            onClick={() => handleSetPrimary(index)}
                            className="!px-1"
                          />
                        </Tooltip>
                      )}
                    </Space>

                    <Tooltip title="Xóa ảnh này">
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(index)}
                        className="!px-1"
                      />
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </Image.PreviewGroup>
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 dark:border-neutral-700 rounded-lg p-6 text-center text-sm text-gray-400 dark:text-neutral-500">
          Chưa có ảnh nào. Bấm nút &ldquo;Chọn nhiều ảnh từ máy&rdquo; để tải lên nhiều ảnh cùng lúc, hoặc dán URL ảnh vào ô phía trên.
        </div>
      )}
    </div>
  );
}
