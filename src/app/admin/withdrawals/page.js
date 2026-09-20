"use client";

import { useRef, useState } from "react";
import { Button, Input, Modal, Space, Tag, message } from "antd";
import ResourceTable, { fmtDate, fmtNumber, errMsg } from "../_components/ResourceTable";
import { adminGetWithdrawals, adminApproveWithdrawal, adminRejectWithdrawal } from "@/app/Api";

const STATUS = {
  pending: { label: "Chờ duyệt", color: "orange" },
  approved: { label: "Đã duyệt", color: "blue" },
  completed: { label: "Hoàn tất", color: "green" },
  rejected: { label: "Từ chối", color: "red" },
  cancelled: { label: "Đã hủy", color: "default" },
};

export default function AdminWithdrawalsPage() {
  const tableRef = useRef();
  const [target, setTarget] = useState(null); // { row, action: "approve" | "reject" }
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const fn = target.action === "approve" ? adminApproveWithdrawal : adminRejectWithdrawal;
      const res = await fn(target.row.id, { admin_note: note || undefined });
      message.success(res.data?.message || "Thành công");
      setTarget(null);
      tableRef.current?.reload();
    } catch (err) {
      message.error(errMsg(err, "Thao tác thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const open = (row, action) => {
    setNote("");
    setTarget({ row, action });
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "Người dùng", key: "user", render: (_, w) => w.user?.username || `#${w.user_id}` },
    { title: "Số điểm", dataIndex: "amount", render: fmtNumber },
    {
      title: "Tài khoản nhận",
      key: "bank",
      render: (_, w) => (
        <div>
          <div className="font-medium">{w.account_holder}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {w.bank_name} · {w.bank_account}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s) => <Tag color={STATUS[s]?.color}>{STATUS[s]?.label || s}</Tag>,
    },
    {
      title: "Ghi chú admin",
      key: "note",
      render: (_, w) =>
        w.admin_note ? (
          <span className="text-xs">
            {w.admin_note}
            {w.admin?.username ? ` — ${w.admin.username}` : ""}
          </span>
        ) : (
          "-"
        ),
    },
    { title: "Ngày tạo", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, w) =>
        w.status === "pending" ? (
          <Space>
            <Button size="small" type="primary" onClick={() => open(w, "approve")}>
              Duyệt
            </Button>
            <Button size="small" danger onClick={() => open(w, "reject")}>
              Từ chối
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <>
      <ResourceTable
        ref={tableRef}
        title="Yêu cầu rút tiền"
        fetcher={adminGetWithdrawals}
        columns={columns}
        defaultFilters={{ status: "pending" }}
        filters={[
          { key: "search", type: "search", placeholder: "Username, ngân hàng, số TK" },
          {
            key: "status",
            type: "select",
            placeholder: "Trạng thái",
            options: Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label })),
          },
        ]}
      />
      <Modal
        title={target?.action === "approve" ? "Duyệt yêu cầu rút tiền" : "Từ chối yêu cầu rút tiền"}
        open={!!target}
        confirmLoading={saving}
        okText={target?.action === "approve" ? "Duyệt" : "Từ chối"}
        okButtonProps={{ danger: target?.action === "reject" }}
        cancelText="Hủy"
        onCancel={() => setTarget(null)}
        onOk={submit}
      >
        {target && (
          <p className="mb-3 text-sm">
            {fmtNumber(target.row.amount)} điểm → {target.row.account_holder} ({target.row.bank_name}{" "}
            {target.row.bank_account}).
            {target.action === "reject" && " Điểm sẽ được hoàn lại cho người dùng."}
          </p>
        )}
        <Input.TextArea rows={3} placeholder="Ghi chú (tùy chọn)" value={note} onChange={(e) => setNote(e.target.value)} />
      </Modal>
    </>
  );
}
