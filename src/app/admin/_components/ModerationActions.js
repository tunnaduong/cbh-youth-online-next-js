"use client";

import { useState } from "react";
import { Button, Checkbox, Input, Modal, Tooltip, message } from "antd";
import { DeleteOutlined, WarningOutlined } from "@ant-design/icons";
import { adminRemoveContent, adminWarnContent } from "@/app/Api";
import { errMsg } from "./ResourceTable";

const NOTE_MAX = 500;

// content_type -> how the content is named in the dialogs.
export const CONTENT_LABELS = {
  topic: "bài viết",
  comment: "bình luận",
  message: "tin nhắn",
  story: "tin",
};

const labelOf = (type) => CONTENT_LABELS[type] || "nội dung";

function NoteField({ value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Ghi chú cho người đăng (không bắt buộc)
      </label>
      <Input.TextArea
        rows={3}
        maxLength={NOTE_MAX}
        showCount
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function TriggerButton({ iconOnly, tooltip, label, ...props }) {
  const button = <Button {...props}>{iconOnly ? null : label}</Button>;
  return iconOnly ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
}

/**
 * "Cảnh cáo": sends the author a content_warning notification that links to
 * the content. Passing reportId also closes that report as resolved.
 */
export function WarnButton({
  contentType,
  contentId,
  reportId,
  onDone,
  size = "small",
  iconOnly = false,
  label = "Cảnh cáo",
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const what = labelOf(contentType);

  const submit = async () => {
    setBusy(true);
    try {
      const params = { content_type: contentType, content_id: contentId };
      if (note.trim()) params.note = note.trim();
      if (reportId) params.report_id = reportId;
      const res = await adminWarnContent(params);
      message.success(res.data?.message || "Đã gửi cảnh cáo");
      setOpen(false);
      onDone?.();
    } catch (err) {
      message.error(errMsg(err, "Không gửi được cảnh cáo"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TriggerButton
        size={size}
        iconOnly={iconOnly}
        tooltip={label}
        label={label}
        icon={<WarningOutlined />}
        aria-label={label}
        onClick={() => {
          setNote("");
          setOpen(true);
        }}
      />
      <Modal
        open={open}
        title={`Cảnh cáo về ${what} #${contentId}`}
        onCancel={() => !busy && setOpen(false)}
        onOk={submit}
        okText="Gửi cảnh cáo"
        cancelText="Hủy"
        okButtonProps={{ loading: busy }}
        cancelButtonProps={{ disabled: busy }}
        destroyOnClose
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Người đăng sẽ nhận một thông báo cảnh cáo rằng {what} của họ có nội dung không phù hợp với tiêu chuẩn
            cộng đồng, kèm liên kết tới {what} đó. Nội dung không bị xóa.
            {reportId ? " Báo cáo này sẽ được đánh dấu là đã giải quyết." : ""}
          </p>
          <NoteField value={note} onChange={setNote} placeholder="Ví dụ: Bài viết có lời lẽ xúc phạm người khác." />
        </div>
      </Modal>
    </>
  );
}

/**
 * "Xóa nội dung": deletes the content (a message is soft-deleted) and, unless
 * unticked, tells the author with a content_deleted notification.
 */
export function RemoveButton({
  contentType,
  contentId,
  reportId,
  onDone,
  size = "small",
  iconOnly = false,
  label = "Xóa nội dung",
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const what = labelOf(contentType);

  const submit = async () => {
    setBusy(true);
    try {
      const params = { content_type: contentType, content_id: contentId, notify };
      if (note.trim()) params.note = note.trim();
      if (reportId) params.report_id = reportId;
      const res = await adminRemoveContent(params);
      message.success(res.data?.message || "Đã xóa nội dung");
      setOpen(false);
      onDone?.();
    } catch (err) {
      message.error(errMsg(err, "Xóa thất bại"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TriggerButton
        size={size}
        danger
        iconOnly={iconOnly}
        tooltip={label}
        label={label}
        icon={<DeleteOutlined />}
        aria-label={label}
        onClick={() => {
          setNote("");
          setNotify(true);
          setOpen(true);
        }}
      />
      <Modal
        open={open}
        title={`Xóa ${what} #${contentId}?`}
        onCancel={() => !busy && setOpen(false)}
        onOk={submit}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: busy }}
        cancelButtonProps={{ disabled: busy }}
        destroyOnClose
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {contentType === "message"
              ? "Tin nhắn sẽ biến mất khỏi cuộc trò chuyện của người dùng (vẫn còn trong trang quản trị)."
              : `${what.charAt(0).toUpperCase()}${what.slice(1)} sẽ bị xóa, không thể hoàn tác.`}
            {reportId ? " Báo cáo này sẽ được đánh dấu là đã giải quyết." : ""}
          </p>
          <Checkbox checked={notify} onChange={(e) => setNotify(e.target.checked)}>
            Thông báo cho người đăng
          </Checkbox>
          {notify && (
            <NoteField value={note} onChange={setNote} placeholder="Lý do xóa, người đăng sẽ thấy trong thông báo." />
          )}
        </div>
      </Modal>
    </>
  );
}
