"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Space, Tag, message } from "antd";
import { CheckCircle, Paperclip, XCircle } from "lucide-react";
import ResourceTable, { fmtDate, fmtNumber, errMsg } from "../_components/ResourceTable";
import {
  adminGetModerationQueue,
  adminGetModerationStats,
  adminApproveModeration,
  adminRejectModeration,
} from "@/app/Api";
import { generatePostUrl } from "@/utils/slugify";

const STATUS_COLOR = { pending: "gold", approved: "green", rejected: "red" };
const STATUS_LABEL = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Đã từ chối" };

const VERDICT_COLOR = { approved: "green", rejected: "red", needs_review: "gold" };
const VERDICT_LABEL = {
  approved: "AI duyệt",
  rejected: "AI từ chối",
  needs_review: "AI cần xem xét",
};

const TYPE_LABEL = { topic: "Bài viết", comment: "Bình luận" };

/** content_snapshot is JSON captured at submit time; tolerate bad/legacy rows. */
const parseSnapshot = (raw) => {
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch {
    return { body: String(raw) };
  }
};

function StatCard({ label, value, tone = "default" }) {
  const tones = {
    default: "text-gray-900 dark:text-gray-100",
    warn: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    ok: "text-green-600 dark:text-green-400",
  };
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-[#eef0ee] dark:border-neutral-700 px-4 py-3 min-w-[130px]">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-xl font-bold mt-0.5 ${tones[tone]}`}>{fmtNumber(value)}</div>
    </div>
  );
}

export default function AdminModerationPage() {
  const tableRef = useRef();
  const [stats, setStats] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rejectForm] = Form.useForm();

  const loadStats = async () => {
    try {
      const res = await adminGetModerationStats();
      setStats(res.data);
    } catch {
      // Stats are decorative - a failure here shouldn't nag over the queue.
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const reload = () => {
    tableRef.current?.reload();
    loadStats();
  };

  const handleApprove = async (id) => {
    setSaving(true);
    try {
      const res = await adminApproveModeration(id);
      message.success(res.data?.message || "Đã duyệt");
      reload();
    } catch (err) {
      message.error(errMsg(err, "Thao tác thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    const values = await rejectForm.validateFields();
    setSaving(true);
    try {
      const res = await adminRejectModeration(rejecting.id, values);
      message.success(res.data?.message || "Đã từ chối");
      setRejecting(null);
      rejectForm.resetFields();
      reload();
    } catch (err) {
      message.error(errMsg(err, "Thao tác thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Loại",
      dataIndex: "content_type",
      width: 110,
      render: (t) => <Tag>{TYPE_LABEL[t] || t}</Tag>,
    },
    {
      title: "Tác giả",
      key: "user",
      width: 150,
      render: (_, r) =>
        r.user?.username ? (
          <a href={`/${r.user.username}`} target="_blank" rel="noreferrer" className="font-medium">
            @{r.user.username}
          </a>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">#{r.user_id}</span>
        ),
    },
    {
      title: "Nội dung",
      key: "content",
      render: (_, r) => {
        const snap = parseSnapshot(r.content_snapshot);
        const url = generatePostUrl(r.topic);
        return (
          <div className="max-w-[420px]">
            {snap.title && <div className="font-medium mb-0.5">{snap.title}</div>}
            <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">
              {snap.body || <span className="text-gray-400 dark:text-gray-500">(không có nội dung)</span>}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {r.has_attachments && (
                <Tag color="blue" icon={<Paperclip size={11} />} className="!me-0">
                  Có đính kèm - cần xem tận nơi
                </Tag>
              )}
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="text-xs">
                  Mở nội dung gốc
                </a>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Nội dung đã bị xoá
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "AI đánh giá",
      key: "ai",
      width: 220,
      render: (_, r) => (
        <div>
          <Tag color={VERDICT_COLOR[r.ai_verdict]}>{VERDICT_LABEL[r.ai_verdict] || r.ai_verdict}</Tag>
          {r.ai_reason && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.ai_reason}</div>}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (s) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s] || s}</Tag>,
    },
    { title: "Gửi lúc", dataIndex: "created_at", render: fmtDate, width: 160 },
    {
      title: "Xử lý lúc",
      dataIndex: "reviewed_at",
      width: 200,
      render: (v, r) =>
        v ? (
          <div>
            <div>{fmtDate(v)}</div>
            {r.reviewer_note && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ghi chú: {r.reviewer_note}</div>
            )}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">
            {r.status === "rejected" ? "AI tự động từ chối" : "-"}
          </span>
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 180,
      render: (_, r) =>
        r.status === "pending" ? (
          <Space size="small">
            <Popconfirm
              title="Duyệt và hiển thị nội dung này?"
              okText="Duyệt"
              cancelText="Hủy"
              onConfirm={() => handleApprove(r.id)}
            >
              <Button size="small" type="primary" icon={<CheckCircle size={14} />}>
                Duyệt
              </Button>
            </Popconfirm>
            <Button
              size="small"
              danger
              icon={<XCircle size={14} />}
              onClick={() => {
                setRejecting(r);
                rejectForm.resetFields();
              }}
            >
              Từ chối
            </Button>
          </Space>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">Đã xử lý</span>
        ),
    },
  ];

  return (
    <>
      <ResourceTable
        ref={tableRef}
        title="Kiểm duyệt AI"
        fetcher={adminGetModerationQueue}
        columns={columns}
        extra={
          <div className="flex gap-3 flex-wrap">
            <StatCard label="Đang chờ" value={stats?.pending} tone="warn" />
            <StatCard label="Duyệt hôm nay" value={stats?.approved_today} tone="ok" />
            <StatCard label="Từ chối hôm nay" value={stats?.rejected_today} tone="danger" />
            <StatCard label="AI tự từ chối" value={stats?.auto_rejected} />
          </div>
        }
        filters={[
          {
            key: "status",
            type: "select",
            placeholder: "Trạng thái",
            options: [
              { value: "pending", label: "Chờ duyệt" },
              { value: "approved", label: "Đã duyệt" },
              { value: "rejected", label: "Đã từ chối" },
            ],
          },
          {
            key: "type",
            type: "select",
            placeholder: "Loại nội dung",
            options: [
              { value: "topic", label: "Bài viết" },
              { value: "comment", label: "Bình luận" },
            ],
          },
        ]}
        defaultFilters={{ status: "pending" }}
      />

      <Modal
        title="Từ chối nội dung"
        open={!!rejecting}
        confirmLoading={saving}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        onCancel={() => setRejecting(null)}
        onOk={handleReject}
      >
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          {TYPE_LABEL[rejecting?.content_type] || "Nội dung"} của{" "}
          {rejecting?.user?.username ? `@${rejecting.user.username}` : `#${rejecting?.user_id}`}
        </p>
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="note" label="Ghi chú (tuỳ chọn)">
            <Input.TextArea
              rows={3}
              maxLength={500}
              placeholder="Vi phạm tiêu chuẩn cộng đồng..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
