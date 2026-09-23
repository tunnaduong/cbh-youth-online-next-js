"use client";

import { useRef, useState } from "react";
import { Button, Input, Modal, Popconfirm, Space, Tag, Tooltip, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, fmtNumber, errMsg, UserLink } from "../_components/ResourceTable";
import {
  adminGetWithdrawals,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
  adminDeleteWithdrawal,
} from "@/app/Api";

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

  const remove = async (id) => {
    try {
      const res = await adminDeleteWithdrawal(id);
      message.success(res.data?.message || "Đã xóa yêu cầu");
      tableRef.current?.reload();
    } catch (err) {
      message.error(errMsg(err, "Xóa thất bại"));
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "Người dùng", key: "user", render: (_, w) => <UserLink user={w.user} userId={w.user_id} /> },
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
      render: (_, w) => (
        <Space>
          {w.status === "pending" ? (
            <>
              <Button size="small" type="primary" onClick={() => open(w, "approve")}>
                Duyệt
              </Button>
              <Button size="small" danger onClick={() => open(w, "reject")}>
                Từ chối
              </Button>
            </>
          ) : null}
          {/* A pending request is still holding the user's points - decide it first. */}
          <Popconfirm
            title="Xóa yêu cầu rút tiền này?"
            description="Bản ghi sẽ bị xóa khỏi danh sách, không thể hoàn tác."
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            disabled={w.status === "pending"}
            onConfirm={() => remove(w.id)}
          >
            <Tooltip title={w.status === "pending" ? "Hãy duyệt hoặc từ chối trước khi xóa" : "Xóa yêu cầu"}>
              <Button size="small" danger icon={<DeleteOutlined />} disabled={w.status === "pending"} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
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
