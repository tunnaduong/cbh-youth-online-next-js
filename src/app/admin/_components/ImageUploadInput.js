"use client";

import { useState } from "react";
import { Button, Input, Upload, message } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { uploadInlineImage, MAX_INLINE_IMAGE_MB } from "@/utils/imageUpload";

const MAX_MB = MAX_INLINE_IMAGE_MB;

/**
 * Image URL field with an upload button (via /v1.0/upload) and a preview.
 * Works as an antd Form control (value/onChange) or standalone.
 */
export default function ImageUploadInput({ value, onChange, size, compact = false }) {
  const [uploading, setUploading] = useState(false);

  const beforeUpload = async (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("Chỉ hỗ trợ tệp ảnh");
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      message.error(`Ảnh tối đa ${MAX_MB}MB`);
      return Upload.LIST_IGNORE;
    }
    setUploading(true);
    try {
      onChange?.(await uploadInlineImage(file));
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || "Tải ảnh lên thất bại");
    } finally {
      setUploading(false);
    }
    return Upload.LIST_IGNORE; // handled manually above
  };

  const uploadButton = (
    <Upload accept="image/*" showUploadList={false} beforeUpload={beforeUpload}>
      <Button size={size} icon={<UploadOutlined />} loading={uploading}>
        {compact ? null : "Tải ảnh"}
      </Button>
    </Upload>
  );

  return (
    <div className="flex items-center gap-2">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className={`${compact ? "w-8 h-8" : "w-14 h-14"} shrink-0 rounded object-cover bg-gray-100 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-700`}
        />
      ) : null}
      {compact ? null : (
        <Input
          size={size}
          placeholder="Tải ảnh lên hoặc dán URL"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
      {uploadButton}
      {value ? (
        <Button size={size} icon={<DeleteOutlined />} onClick={() => onChange?.("")} aria-label="Xóa ảnh" />
      ) : null}
    </div>
  );
}
