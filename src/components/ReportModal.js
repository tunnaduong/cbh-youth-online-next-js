"use client";

import { useState } from "react";
import { Modal, Input, message } from "antd";
import { reportContent } from "@/app/Api";

const { TextArea } = Input;

/**
 * Reusable report dialog.
 *
 * Pass exactly one of `topicId` / `storyId`, or neither for a plain user
 * report. `reportedUserId` should be supplied whenever it's known (it's
 * required by the backend unless it can be resolved from the topic/story).
 */
export default function ReportModal({
  open,
  onClose,
  reportedUserId = null,
  topicId = null,
  storyId = null,
  title = "Báo cáo",
  onSuccess,
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    if (submitting) return;
    setReason("");
    setError(null);
    onClose?.();
  };

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Vui lòng nhập lý do báo cáo");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const params = { reason: trimmed };
      if (reportedUserId) params.reported_user_id = reportedUserId;
      if (topicId) params.topic_id = topicId;
      if (storyId) params.story_id = storyId;

      await reportContent(params);
      message.success("Đã gửi báo cáo. Cảm ơn bạn đã phản hồi!");
      setReason("");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      if (serverMessage === "You cannot report yourself") {
        message.error("Bạn không thể tự báo cáo chính mình.");
      } else if (
        serverMessage === "You have already reported this user/content"
      ) {
        message.error("Bạn đã báo cáo nội dung/người dùng này rồi.");
      } else if (serverMessage === "Cannot determine user to report") {
        message.error("Không thể xác định người dùng để báo cáo.");
      } else {
        message.error(serverMessage || "Không thể gửi báo cáo, vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Gửi báo cáo"
      cancelText="Hủy"
      okButtonProps={{ loading: submitting, danger: true }}
      cancelButtonProps={{ disabled: submitting }}
      destroyOnClose
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Hãy cho chúng tôi biết lý do bạn báo cáo nội dung/người dùng này. Đội
        ngũ quản trị sẽ xem xét báo cáo của bạn sớm nhất có thể.
      </p>
      <TextArea
        rows={4}
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Nhập lý do báo cáo..."
        maxLength={1000}
        disabled={submitting}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </Modal>
  );
}
