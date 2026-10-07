"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input, Modal, Popconfirm, Select, Space, Tabs, Tag, Tooltip, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ResourceTable, { fmtDate, errMsg, UserLink } from "../_components/ResourceTable";
import {
  adminGetViolationReports,
  adminReviewViolationReport,
  adminDeleteViolationReport,
} from "@/app/Api";

const STATUS = {
  pending: { label: "Chờ xử lý", color: "orange" },
  reviewed: { label: "Đã xem xét", color: "blue" },
  resolved: { label: "Đã giải quyết", color: "green" },
  dismissed: { label: "Đã bỏ qua", color: "default" },
};

const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }));

// cleanliness / uniform are yes/no checks on a class report; null = not filled in.
const CheckTag = ({ label, value }) =>
  value == null ? null : (
    <Tag color={value ? "green" : "red"}>
      {label} {value ? "✓" : "✗"}
    </Tag>
  );

function ReviewModal({ report, onClose, onSaved }) {
  const [status, setStatus] = useState("reviewed");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (report) {
      setStatus(report.status && report.status !== "pending" ? report.status : "reviewed");
      setNotes(report.admin_notes || "");
    }
  }, [report]);

  const submit = async () => {
    setBusy(true);
    try {
      const params = { status };
      if (notes.trim()) params.admin_notes = notes.trim();
      const res = await adminReviewViolationReport(report.id, params);
      message.success(res.data?.message || "Đã cập nhật báo cáo");
      onSaved();
      onClose();
    } catch (err) {
      message.error(errMsg(err, "Không thể cập nhật báo cáo"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!report}
      title={`Xử lý báo cáo vi phạm #${report?.id ?? ""}`}
      onCancel={() => !busy && onClose()}
      onOk={submit}
      okText="Lưu"
      cancelText="Hủy"
      okButtonProps={{ loading: busy }}
      cancelButtonProps={{ disabled: busy }}
      destroyOnClose
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái</label>
          <Select
            className="w-full"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS.filter((o) => o.value !== "pending")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ghi chú xử lý (không bắt buộc)
          </label>
          <Input.TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function ViolationTable({ type }) {
  const tableRef = useRef();
  const [reviewing, setReviewing] = useState(null);
  const isClass = type === "class";

  // Each tab is one type; the type is added to every request. Memoised:
  // ResourceTable reloads whenever its fetcher changes.
  const fetcher = useCallback((params) => adminGetViolationReports({ ...params, type }), [type]);

  const columns = (reload) => [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Loại",
      dataIndex: "type",
      render: (t) => (t === "class" ? <Tag color="purple">Lớp</Tag> : <Tag color="cyan">Học sinh</Tag>),
    },
    {
      title: isClass ? "Lớp" : "Học sinh",
      dataIndex: "subject_name",
      render: (v) => <span className="font-medium">{v || "-"}</span>,
    },
    {
      title: "Lỗi vi phạm",
      dataIndex: "violation_type",
      render: (v) => <div className="max-w-[220px] break-words">{v || "-"}</div>,
    },
    {
      title: "Ngày",
      dataIndex: "report_date",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Chi tiết",
      key: "details",
      render: (_, r) => (
        <Space size={4} wrap>
          {r.absences != null && <Tag>Vắng: {r.absences}</Tag>}
          <CheckTag label="Vệ sinh" value={r.cleanliness} />
          <CheckTag label="Đồng phục" value={r.uniform} />
        </Space>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      render: (v, r) => (
        <div className="max-w-[260px] text-sm">
          <div className="whitespace-pre-wrap break-words">{v || "-"}</div>
          {r.admin_notes && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-words">Xử lý: {r.admin_notes}</div>
          )}
        </div>
      ),
    },
    {
      title: "Người báo cáo",
      key: "reporter",
      render: (_, r) => <UserLink user={r.reporter} userId={r.reporter_id} />,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s, r) => {
        // reviewed_by is the reviewer's id; the relation (if loaded) comes as reviewedBy / reviewed_by_user.
        const reviewer = r.reviewedBy || r.reviewed_by_user || (typeof r.reviewed_by === "object" ? r.reviewed_by : null);
        const tag = <Tag color={STATUS[s]?.color || "default"}>{STATUS[s]?.label || s}</Tag>;
        return r.reviewed_at ? (
          <Tooltip title={`${reviewer?.username ? `@${reviewer.username} · ` : ""}${fmtDate(r.reviewed_at)}`}>
            {tag}
          </Tooltip>
        ) : (
          tag
        );
      },
    },
    { title: "Ngày gửi", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => setReviewing(r)}>
            Xử lý
          </Button>
          <Popconfirm
            title="Xóa báo cáo vi phạm này?"
            description="Hành động không thể hoàn tác."
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={async () => {
              try {
                const res = await adminDeleteViolationReport(r.id);
                message.success(res.data?.message || "Đã xóa báo cáo");
                reload();
              } catch (err) {
                message.error(errMsg(err, "Xóa thất bại"));
              }
            }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} aria-label="Xóa báo cáo" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ResourceTable
        ref={tableRef}
        title={isClass ? "Vi phạm của lớp" : "Vi phạm của học sinh"}
        fetcher={fetcher}
        columns={columns}
        filters={[
          { key: "search", type: "search", placeholder: isClass ? "Tên lớp, lỗi vi phạm" : "Tên học sinh, lỗi vi phạm" },
          { key: "status", type: "select", placeholder: "Trạng thái", options: STATUS_OPTIONS },
        ]}
      />
      <ReviewModal report={reviewing} onClose={() => setReviewing(null)} onSaved={() => tableRef.current?.reload()} />
    </>
  );
}

export default function AdminViolationsPage() {
  return (
    <Tabs
      className="max-w-[1280px] mx-auto w-full [&_.ant-tabs-nav]:px-4 sm:[&_.ant-tabs-nav]:px-6 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-nav]:pt-4"
      destroyInactiveTabPane
      items={[
        { key: "student", label: "Học sinh", children: <ViolationTable type="student" /> },
        { key: "class", label: "Lớp", children: <ViolationTable type="class" /> },
      ]}
    />
  );
}
