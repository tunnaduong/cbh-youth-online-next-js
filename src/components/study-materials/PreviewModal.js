"use client";

import { Modal } from "antd";

export default function PreviewModal({ open, onClose, previewContent }) {
  return (
    <Modal
      title="Xem trước tài liệu"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: previewContent }}
      />
    </Modal>
  );
}



