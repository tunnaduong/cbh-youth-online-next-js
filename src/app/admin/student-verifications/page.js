"use client";

import { useRef, useState } from "react";
import { Button, Form, Input, Modal, Space, Tag, Image, Popconfirm, Tooltip, message } from "antd";
import { CheckCircle, Trash2, XCircle, Eye } from "lucide-react";
import ResourceTable, { fmtDate, errMsg } from "../_components/ResourceTable";
import {
  adminGetStudentVerifications,
  adminApproveStudentVerification,
  adminRejectStudentVerification,
  adminRevokeStudentVerification,
  adminDeleteStudentVerification,
} from "@/app/Api";

const STATUS_COLOR = { pending: "gold", approved: "green", rejected: "red" };
const STATUS_LABEL = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };

export default function AdminStudentVerificationsPage() {
  const tableRef = useRef();
  const [preview, setPreview] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rejectForm] = Form.useForm();

  const reload = () => tableRef.current?.reload();

  const handleApprove = async (id) => {
    setSaving(true);
    try {
      const res = await adminApproveStudentVerification(id);
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
      const res = await adminRejectStudentVerification(rejecting.id, values);
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

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const res = await adminDeleteStudentVerification(id);
      message.success(res.data?.message || "Đã xóa");
      reload();
    } catch (err) {
      message.error(errMsg(err, "Xóa thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (userId) => {
    setSaving(true);
    try {
      const res = await adminRevokeStudentVerification(userId);
      message.success(res.data?.message || "Đã thu hồi");
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
      title: "Học sinh",
      key: "user",
      render: (_, r) => (
        <div>
          <a href={`/${r.user?.username}`} target="_blank" rel="noreferrer" className="font-medium">
            @{r.user?.username}
          </a>
          <div className="text-xs text-gray-500 dark:text-gray-400">{r.user?.email}</div>
        </div>
      ),
    },
    {
      title: "Ảnh selfie",
      dataIndex: "selfie_url",
      render: (url) => (
        <Image
          src={url}
          alt="Selfie"
          width={60}
          height={60}
          className="object-cover rounded"
          style={{ objectFit: "cover", borderRadius: 6 }}
        />
      ),
    },
    {
      title: "Thẻ học sinh",
      dataIndex: "student_card_url",
      render: (url) => (
        <Image
          src={url}
          alt="Thẻ HS"
          width={80}
          height={55}
          className="object-cover rounded"
          style={{ objectFit: "cover", borderRadius: 6 }}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>,
    },
    { title: "Gửi lúc", dataIndex: "created_at", render: fmtDate, width: 160 },
    {
      title: "Duyệt lúc",
      dataIndex: "reviewed_at",
      render: (v, r) =>
        v ? (
          <div>
            <div>{fmtDate(v)}</div>
            {r.rejection_reason && (
              <div className="text-xs text-red-500 mt-1">Lý do: {r.rejection_reason}</div>
            )}
          </div>
        ) : (
          "-"
        ),
      width: 200,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, r) => (
        <Space size="small">
          {r.status === "pending" && (
            <>
              <Popconfirm
                title="Duyệt xác minh học sinh này?"
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
            </>
          )}
          {r.status === "approved" && (
            <Popconfirm
              title="Thu hồi xác minh của học sinh này?"
              okText="Thu hồi"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => handleRevoke(r.user_id)}
            >
              <Button size="small" danger>
                Thu hồi
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Xóa yêu cầu xác minh này?"
            description={
              r.status === "approved"
                ? "Ảnh và bản ghi sẽ bị xóa, đồng thời thu hồi xác minh của học sinh."
                : "Ảnh và bản ghi sẽ bị xóa vĩnh viễn."
            }
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={() => handleDelete(r.id)}
          >
            <Tooltip title="Xóa yêu cầu">
              <Button size="small" danger icon={<Trash2 size={14} />} />
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
        title="Xác minh học sinh (eKYC)"
        fetcher={adminGetStudentVerifications}
        columns={columns}
        filters={[
          {
            key: "status",
            type: "select",
            placeholder: "Trạng thái",
            options: [
              { value: "pending", label: "Chờ duyệt" },
              { value: "approved", label: "Đã duyệt" },
              { value: "rejected", label: "Từ chối" },
            ],
          },
        ]}
        defaultFilters={{ status: "pending" }}
      />

      <Modal
        title="Lý do từ chối"
        open={!!rejecting}
        confirmLoading={saving}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        onCancel={() => setRejecting(null)}
        onOk={handleReject}
      >
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          Yêu cầu của @{rejecting?.user?.username}
        </p>
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
          >
            <Input.TextArea
              rows={3}
              maxLength={500}
              placeholder="Ảnh không rõ, thông tin không khớp..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
