"use client";

import { useRef, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Tag, Tooltip, Typography, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, fmtNumber, errMsg } from "../_components/ResourceTable";
import {
  adminGetUsers,
  adminUpdateUser,
  adminBanUser,
  adminUnbanUser,
  adminDeleteUser,
  adminResetUserPassword,
  adminResetUserTwoFactor,
  adminRemoveCustomFrames,
} from "@/app/Api";

const ROLE_OPTIONS = [
  { value: "user", label: "Người dùng" },
  { value: "student", label: "Học sinh" },
  { value: "teacher", label: "Giáo viên" },
  { value: "volunteer", label: "Tình nguyện viên" },
  { value: "admin", label: "Quản trị viên" },
];
const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map((o) => [o.value, o.label]));

const isBanned = (u) => u.banned_at && (!u.banned_until || new Date(u.banned_until) > new Date());

export default function AdminUsersPage() {
  const tableRef = useRef();
  const [editing, setEditing] = useState(null);
  const [banning, setBanning] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();
  const [banForm] = Form.useForm();

  const reload = () => tableRef.current?.reload();

  const submit = async (fn, close) => {
    setSaving(true);
    try {
      const res = await fn();
      message.success(res.data?.message || "Thành công");
      close();
      reload();
    } catch (err) {
      message.error(errMsg(err, "Thao tác thất bại"));
    } finally {
      setSaving(false);
    }
  };

  // The temporary password is only returned once, so it is shown in a dialog
  // that stays open until the admin closes it (a toast would vanish).
  const resetPassword = async (u) => {
    setSaving(true);
    try {
      const res = await adminResetUserPassword(u.id);
      Modal.info({
        title: `Mật khẩu tạm của @${u.username}`,
        content: (
          <div>
            <p>{res.data?.message}</p>
            <Typography.Text code copyable style={{ fontSize: 16 }}>
              {res.data?.password}
            </Typography.Text>
          </div>
        ),
        okText: "Đã lưu lại",
      });
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
      title: "Người dùng",
      key: "user",
      render: (_, u) => (
        <div>
          <a href={`/${u.username}`} target="_blank" rel="noreferrer" className="font-medium">
            {u.profile?.profile_name || u.username}
          </a>
          <div className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</div>
        </div>
      ),
    },
    { title: "Email", dataIndex: "email" },
    { title: "Vai trò", dataIndex: "role", render: (r) => <Tag color={r === "admin" ? "purple" : "default"}>{ROLE_LABEL[r] || r}</Tag> },
    { title: "Điểm", dataIndex: "points", render: fmtNumber },
    { title: "Bài viết", dataIndex: "posts_count" },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, u) =>
        isBanned(u) ? (
          <Tag color="red" title={u.ban_reason || ""}>
            Bị khóa {u.banned_until ? `đến ${fmtDate(u.banned_until)}` : "vĩnh viễn"}
          </Tag>
        ) : (
          <>
            <Tag color="green">Hoạt động</Tag>
            {u.two_factor_confirmed_at && <Tag color="blue">2FA</Tag>}
          </>
        ),
    },
    { title: "Ngày tạo", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, u) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditing(u);
              editForm.setFieldsValue({ role: u.role, points: u.points });
            }}
          >
            Sửa
          </Button>
          {isBanned(u) ? (
            <Popconfirm
              title="Mở khóa tài khoản này?"
              okText="Mở khóa"
              cancelText="Hủy"
              onConfirm={() => submit(() => adminUnbanUser(u.id), () => {})}
            >
              <Button size="small">Mở khóa</Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              danger
              disabled={u.role === "admin"}
              onClick={() => {
                setBanning(u);
                banForm.setFieldsValue({ duration: "24h", reason: "" });
              }}
            >
              Khóa
            </Button>
          )}
          {/* For users locked out of their account. Other admins' passwords
              can't be reset here (the API refuses), same rule as banning. */}
          <Popconfirm
            title={`Đặt lại mật khẩu của @${u.username}?`}
            description="Tạo một mật khẩu tạm và đăng xuất tài khoản này khỏi mọi thiết bị."
            okText="Đặt lại"
            cancelText="Hủy"
            disabled={u.role === "admin"}
            onConfirm={() => resetPassword(u)}
          >
            <Button size="small" disabled={u.role === "admin"}>
              Đặt lại mật khẩu
            </Button>
          </Popconfirm>
          {u.two_factor_confirmed_at && (
            <Popconfirm
              title={`Tắt xác thực hai lớp của @${u.username}?`}
              description="Dùng khi người dùng mất ứng dụng xác thực, email và mã khôi phục. Mật khẩu không thay đổi."
              okText="Tắt 2FA"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => submit(() => adminResetUserTwoFactor(u.id), () => {})}
            >
              <Button size="small">Tắt 2FA</Button>
            </Popconfirm>
          )}
          {/* Uploaded frames exist from the Pro Plus tier (2250 points). */}
          {u.points >= 2250 && (
            <Popconfirm
              title={`Gỡ khung tự tải lên của @${u.username}?`}
              description="Xóa ảnh khung avatar và khung trang cá nhân mà người dùng đã tải lên (khi ảnh vi phạm quy định)."
              okText="Gỡ khung"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => submit(() => adminRemoveCustomFrames(u.id), () => {})}
            >
              <Button size="small">Gỡ khung</Button>
            </Popconfirm>
          )}
          {/* Admins have to be demoted before they can be deleted, same rule as banning. */}
          <Popconfirm
            title={`Xóa tài khoản @${u.username}?`}
            description="Bài viết, bình luận, tin nhắn và ví của tài khoản này sẽ bị xóa theo. Không thể hoàn tác - hãy dùng Khóa nếu chỉ muốn tạm dừng."
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            disabled={u.role === "admin"}
            onConfirm={() => submit(() => adminDeleteUser(u.id), () => {})}
          >
            <Tooltip title={u.role === "admin" ? "Hãy hạ quyền trước khi xóa" : "Xóa tài khoản"}>
              <Button size="small" danger icon={<DeleteOutlined />} disabled={u.role === "admin"} />
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
        title="Quản lý người dùng"
        fetcher={adminGetUsers}
        columns={columns}
        filters={[
          { key: "search", type: "search", placeholder: "Username, email, tên, ID" },
          { key: "role", type: "select", placeholder: "Vai trò", options: ROLE_OPTIONS },
          {
            key: "banned",
            type: "select",
            placeholder: "Trạng thái",
            options: [
              { value: 0, label: "Hoạt động" },
              { value: 1, label: "Bị khóa" },
            ],
          },
        ]}
      />

      <Modal
        title={`Sửa người dùng @${editing?.username || ""}`}
        open={!!editing}
        confirmLoading={saving}
        okText="Lưu"
        cancelText="Hủy"
        onCancel={() => setEditing(null)}
        onOk={() =>
          editForm.validateFields().then((v) => submit(() => adminUpdateUser(editing.id, v), () => setEditing(null)))
        }
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="points" label="Điểm" rules={[{ required: true }]}>
            <InputNumber min={0} className="!w-full" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Khóa tài khoản @${banning?.username || ""}`}
        open={!!banning}
        confirmLoading={saving}
        okText="Khóa"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        onCancel={() => setBanning(null)}
        onOk={() =>
          banForm.validateFields().then((v) => submit(() => adminBanUser(banning.id, v), () => setBanning(null)))
        }
      >
        <Form form={banForm} layout="vertical">
          <Form.Item name="duration" label="Thời hạn" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "24h", label: "24 giờ" },
                { value: "7d", label: "7 ngày" },
                { value: "permanent", label: "Vĩnh viễn" },
              ]}
            />
          </Form.Item>
          <Form.Item name="reason" label="Lý do">
            <Input.TextArea rows={3} maxLength={255} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
