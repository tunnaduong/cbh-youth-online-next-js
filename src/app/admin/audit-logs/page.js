"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Modal, Select, Tag, message } from "antd";
import ResourceTable, { fmtDate, errMsg, UserLink } from "../_components/ResourceTable";
import {
  adminGetAuditLogs,
  adminGetAuditLogActionTypes,
  adminUpdateAuditLogStatus,
} from "@/app/Api";

const STATUS = {
  pending: { label: "Chờ xử lý", color: "orange" },
  updated: { label: "Đã cập nhật", color: "blue" },
  resolved: { label: "Đã sửa", color: "green" },
};

// Names for the action types the API writes today; an unknown one is shown
// as it is stored.
const ACTIONS = {
  UPDATE_PROFILE: "Sửa hồ sơ",
  EDIT_POST: "Sửa bài viết",
  REPORT_BUG: "Báo lỗi",
  ADMIN_RESET_PASSWORD: "Admin đặt lại mật khẩu",
  ADMIN_RESET_TWO_FACTOR: "Admin tắt xác thực hai lớp",
};

const TARGETS = { profile: "Hồ sơ", topic: "Bài viết", account: "Tài khoản" };

const actionLabel = (type) => ACTIONS[type] || type;

function show(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * Admin: the audit log - who changed what, with the data before and after.
 * Read-only: entries can't be edited or deleted here (a log that can be
 * changed proves nothing); only the status of an entry can be set.
 */
export default function AdminAuditLogsPage() {
  const tableRef = useRef();
  const [detail, setDetail] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [actionTypes, setActionTypes] = useState(Object.keys(ACTIONS));

  // The filter lists every type that is really in the log, plus the known ones.
  useEffect(() => {
    adminGetAuditLogActionTypes()
      .then((res) => {
        const found = res.data?.action_types || [];
        setActionTypes((current) => [...new Set([...current, ...found])]);
      })
      .catch(() => {});
  }, []);

  const setStatus = async (row, status) => {
    if (status === row.status) return;
    setSavingId(row.id);
    try {
      const res = await adminUpdateAuditLogStatus(row.id, { status });
      message.success(res.data?.message || "Đã cập nhật trạng thái.");
      tableRef.current?.reload();
    } catch (err) {
      message.error(errMsg(err, "Không cập nhật được trạng thái"));
    } finally {
      setSavingId(null);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "Thời gian", dataIndex: "created_at", render: fmtDate },
    {
      title: "Người dùng",
      key: "user",
      render: (_, log) =>
        log.user ? <UserLink user={log.user} userId={log.user.id} /> : <span className="text-gray-400">Đã xóa</span>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, log) => (
        <div>
          <div className="font-medium">{actionLabel(log.action_type)}</div>
          {log.target_type && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {TARGETS[log.target_type] || log.target_type} #{log.target_id}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Người thực hiện",
      key: "actor",
      // Empty when the user changed their own data.
      render: (_, log) =>
        log.actor ? <UserLink user={log.actor} userId={log.actor.id} /> : <span className="text-gray-400">Chính chủ</span>,
    },
    {
      title: "Thay đổi",
      key: "fields",
      render: (_, log) => {
        const fields = Object.keys(log.new_data || log.old_data || {});
        return fields.length ? (
          <span className="text-xs">{fields.join(", ")}</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, log) => (
        <Select
          size="small"
          value={log.status}
          loading={savingId === log.id}
          disabled={savingId !== null}
          onChange={(status) => setStatus(log, status)}
          style={{ width: 130 }}
          options={Object.entries(STATUS).map(([value, s]) => ({
            value,
            label: <Tag color={s.color}>{s.label}</Tag>,
          }))}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, log) => (
        <Button size="small" onClick={() => setDetail(log)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  const changedFields = detail
    ? [...new Set([...Object.keys(detail.old_data || {}), ...Object.keys(detail.new_data || {})])]
    : [];

  return (
    <>
      <ResourceTable
        ref={tableRef}
        title="Nhật ký thay đổi"
        fetcher={adminGetAuditLogs}
        columns={columns}
        filters={[
          { key: "search", type: "search", placeholder: "Username hoặc ID người dùng" },
          {
            key: "action_type",
            type: "select",
            placeholder: "Hành động",
            options: actionTypes.map((value) => ({ value, label: actionLabel(value) })),
          },
          {
            key: "status",
            type: "select",
            placeholder: "Trạng thái",
            options: Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label })),
          },
        ]}
      />
      <Modal
        title={detail ? `${actionLabel(detail.action_type)} · #${detail.id}` : ""}
        open={!!detail}
        footer={null}
        width={760}
        onCancel={() => setDetail(null)}
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <p className="text-gray-500 dark:text-gray-400">
              {fmtDate(detail.created_at)}
              {detail.user?.username ? ` · @${detail.user.username}` : ""}
              {detail.actor?.username ? ` · thực hiện bởi @${detail.actor.username}` : ""}
              {detail.target_type ? ` · ${TARGETS[detail.target_type] || detail.target_type} #${detail.target_id}` : ""}
            </p>
            {changedFields.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Hành động này không kèm dữ liệu thay đổi.</p>
            ) : (
              changedFields.map((field) => (
                <div key={field} className="rounded-lg border border-gray-200 dark:border-neutral-600">
                  <div className="border-b border-gray-200 px-3 py-1.5 font-medium dark:border-neutral-600">
                    {field}
                  </div>
                  <div className="grid grid-cols-1 gap-px bg-gray-200 dark:bg-neutral-600 sm:grid-cols-2">
                    {[
                      ["Trước", detail.old_data?.[field]],
                      ["Sau", detail.new_data?.[field]],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-white p-3 dark:bg-neutral-800">
                        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">{label}</div>
                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-sm text-gray-900 dark:text-white">
                          {show(value)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
