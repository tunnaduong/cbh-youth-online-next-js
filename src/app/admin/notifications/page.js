"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Checkbox, Form, Input, InputNumber, Modal, Radio, Select, Spin, Switch, Tag, message } from "antd";
import { SendOutlined, GlobalOutlined, MobileOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, fmtNumber, errMsg } from "../_components/ResourceTable";
import { adminGetBroadcasts, adminGetBroadcastAudience, adminSendBroadcast, adminGetUsers } from "@/app/Api";

const ROLE_OPTIONS = [
  { value: "user", label: "Người dùng" },
  { value: "student", label: "Học sinh" },
  { value: "teacher", label: "Giáo viên" },
  { value: "volunteer", label: "Tình nguyện viên" },
  { value: "admin", label: "Quản trị viên" },
];

const STATUS = {
  queued: { label: "Đang chờ", color: "default" },
  sending: { label: "Đang gửi", color: "processing" },
  sent: { label: "Đã gửi", color: "success" },
  failed: { label: "Lỗi", color: "error" },
};

const audienceLabel = (b) =>
  b.audience === "all"
    ? "Tất cả"
    : b.audience === "role"
    ? ROLE_OPTIONS.find((r) => r.value === b.audience_value)?.label || b.audience_value
    : `${(b.audience_value || []).length} người dùng`;

function UserPicker({ value, onChange }) {
  const [options, setOptions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const timer = useRef();

  const search = (q) => {
    clearTimeout(timer.current);
    if (!q) return;
    timer.current = setTimeout(async () => {
      setFetching(true);
      try {
        const res = await adminGetUsers({ search: q, per_page: 20 });
        setOptions(
          (res.data?.data || []).map((u) => ({
            value: u.id,
            label: `${u.profile?.profile_name || u.username} (@${u.username})`,
          }))
        );
      } finally {
        setFetching(false);
      }
    }, 300);
  };

  return (
    <Select
      mode="multiple"
      labelInValue={false}
      showSearch
      filterOption={false}
      onSearch={search}
      notFoundContent={fetching ? <Spin size="small" /> : "Nhập username, email hoặc ID"}
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Tìm người dùng..."
    />
  );
}

function Preview({ title, body }) {
  const t = title || "Tiêu đề thông báo";
  const b = body || "Nội dung thông báo sẽ hiển thị ở đây.";
  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
          <GlobalOutlined /> Trình duyệt
        </div>
        <div className="rounded-xl bg-white border border-gray-200 shadow-lg p-3 flex gap-3">
          <Image src="/images/logo.png" alt="" width={40} height={40} className="rounded-lg shrink-0" />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-gray-900 truncate">{t}</div>
            <div className="text-[12px] text-gray-600 line-clamp-2">{b}</div>
            <div className="text-[11px] text-gray-400 mt-1">chuyenbienhoa.com</div>
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
          <MobileOutlined /> Điện thoại
        </div>
        <div className="rounded-[28px] bg-gradient-to-b from-[#2b3a2a] to-[#111a10] p-3 pt-8">
          <div className="rounded-2xl bg-white/85 backdrop-blur p-3 flex gap-2.5">
            <Image src="/images/logo.png" alt="" width={36} height={36} className="rounded-lg shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between text-[11px] text-gray-500">
                <span className="uppercase tracking-wide">CBH Youth Online</span>
                <span>bây giờ</span>
              </div>
              <div className="text-[13px] font-semibold text-gray-900 truncate">{t}</div>
              <div className="text-[12px] text-gray-700 line-clamp-3">{b}</div>
            </div>
          </div>
          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}

export default function AdminNotificationsPage() {
  const [form] = Form.useForm();
  const tableRef = useRef();
  const [reach, setReach] = useState(null);
  const [sending, setSending] = useState(false);

  const title = Form.useWatch("title", form);
  const body = Form.useWatch("body", form);
  const audience = Form.useWatch("audience", form);
  const role = Form.useWatch("role", form);
  const userIds = Form.useWatch("user_ids", form);
  const channels = Form.useWatch("channels", form);

  useEffect(() => {
    if (!audience || (audience === "role" && !role) || (audience === "users" && !userIds?.length)) {
      setReach(null);
      return;
    }
    const t = setTimeout(() => {
      adminGetBroadcastAudience({ audience, role, user_ids: audience === "users" ? userIds : undefined })
        .then((res) => setReach(res.data))
        .catch(() => setReach(null));
    }, 250);
    return () => clearTimeout(t);
  }, [audience, role, userIds]);

  const devices =
    reach &&
    (channels?.includes("web") ? reach.web_devices : 0) + (channels?.includes("mobile") ? reach.mobile_devices : 0);

  const send = async () => {
    const values = await form.validateFields();
    Modal.confirm({
      title: "Gửi thông báo?",
      content: reach
        ? `Thông báo sẽ đến ${fmtNumber(reach.users)} người dùng (${fmtNumber(devices)} thiết bị). Không thể thu hồi sau khi gửi.`
        : "Không thể thu hồi sau khi gửi.",
      okText: "Gửi",
      cancelText: "Hủy",
      onOk: async () => {
        setSending(true);
        try {
          const res = await adminSendBroadcast({
            ...values,
            topic_id: values.topic_id || undefined,
            url: values.url || undefined,
          });
          message.success(res.data?.message || "Đã gửi thông báo");
          form.resetFields(["title", "body", "url", "topic_id"]);
          tableRef.current?.reload();
        } catch (err) {
          message.error(errMsg(err, "Gửi thất bại"));
        } finally {
          setSending(false);
        }
      },
    });
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "Thông báo",
      key: "msg",
      render: (_, b) => (
        <div className="max-w-[360px]">
          <div className="font-medium">{b.title}</div>
          <div className="text-xs text-gray-500 truncate">{b.body}</div>
        </div>
      ),
    },
    { title: "Đối tượng", key: "audience", render: (_, b) => audienceLabel(b) },
    {
      title: "Kênh",
      dataIndex: "channels",
      render: (c = []) => (
        <>
          {c.includes("web") && <Tag icon={<GlobalOutlined />}>Web</Tag>}
          {c.includes("mobile") && <Tag icon={<MobileOutlined />}>App</Tag>}
        </>
      ),
    },
    {
      title: "Đã gửi",
      key: "sent",
      render: (_, b) => (
        <span className="text-xs text-gray-600 whitespace-nowrap">
          {fmtNumber(b.recipients_count)} người · {fmtNumber(b.web_sent)} web · {fmtNumber(b.mobile_sent)} app
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s, b) => (
        <Tag color={STATUS[s]?.color} title={b.error || ""}>
          {STATUS[s]?.label || s}
        </Tag>
      ),
    },
    { title: "Người gửi", key: "admin", render: (_, b) => b.admin?.username || "-" },
    { title: "Thời gian", dataIndex: "created_at", render: fmtDate },
  ];

  return (
    <>
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 pt-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gửi thông báo đẩy</h1>
        <p className="text-sm text-gray-500 mt-1 mb-5">
          Gửi tới trình duyệt (Web Push) và ứng dụng di động (Expo) của người dùng đã bật thông báo.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="bg-white rounded-2xl border border-[#eef0ee] p-5 sm:p-6">
            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              initialValues={{ audience: "all", channels: ["web", "mobile"], save_to_inbox: true }}
            >
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Nhập tiêu đề" }]}>
                <Input maxLength={120} showCount placeholder="VD: Sự kiện mới tuần này 🎉" />
              </Form.Item>
              <Form.Item name="body" label="Nội dung" rules={[{ required: true, message: "Nhập nội dung" }]}>
                <Input.TextArea maxLength={500} showCount rows={4} placeholder="Nội dung ngắn gọn, rõ ràng..." />
              </Form.Item>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Form.Item
                  name="topic_id"
                  label="Mở bài viết (ID)"
                  tooltip="Khi bấm vào thông báo sẽ mở bài viết này (cả web và app)"
                >
                  <InputNumber min={1} className="!w-full" placeholder="Không bắt buộc" />
                </Form.Item>
                <Form.Item
                  name="url"
                  label="Hoặc đường dẫn (web)"
                  rules={[{ pattern: /^(\/|https:\/\/)/, message: "Bắt đầu bằng / hoặc https://" }]}
                >
                  <Input placeholder="/explore hoặc https://..." />
                </Form.Item>
              </div>

              <Form.Item name="audience" label="Gửi đến">
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "role", label: "Theo vai trò" },
                    { value: "users", label: "Người dùng cụ thể" },
                  ]}
                />
              </Form.Item>
              {audience === "role" && (
                <Form.Item name="role" rules={[{ required: true, message: "Chọn vai trò" }]}>
                  <Select options={ROLE_OPTIONS} placeholder="Chọn vai trò" />
                </Form.Item>
              )}
              {audience === "users" && (
                <Form.Item name="user_ids" rules={[{ required: true, message: "Chọn ít nhất 1 người dùng" }]}>
                  <UserPicker />
                </Form.Item>
              )}

              <Form.Item name="channels" label="Kênh" rules={[{ required: true, message: "Chọn ít nhất 1 kênh" }]}>
                <Checkbox.Group
                  options={[
                    { value: "web", label: "Trình duyệt" },
                    { value: "mobile", label: "Ứng dụng di động" },
                  ]}
                />
              </Form.Item>

              <Form.Item name="save_to_inbox" valuePropName="checked" className="!mb-5">
                <Switch checkedChildren="Lưu vào hộp thông báo" unCheckedChildren="Chỉ gửi push" />
              </Form.Item>

              <div className="flex items-center justify-between gap-4 flex-wrap pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  {reach ? (
                    <>
                      Tiếp cận <b className="text-gray-900">{fmtNumber(reach.users)}</b> người dùng ·{" "}
                      <b className="text-gray-900">{fmtNumber(devices)}</b> thiết bị
                    </>
                  ) : (
                    "Đang tính số người nhận..."
                  )}
                </div>
                <Button type="primary" size="large" icon={<SendOutlined />} loading={sending} onClick={send}>
                  Gửi thông báo
                </Button>
              </div>
            </Form>
          </div>

          <div className="bg-white rounded-2xl border border-[#eef0ee] p-5 h-fit lg:sticky lg:top-20">
            <div className="font-semibold text-gray-900 mb-4">Xem trước</div>
            <Preview title={title} body={body} />
          </div>
        </div>
      </div>

      <ResourceTable ref={tableRef} title="Lịch sử gửi" fetcher={adminGetBroadcasts} columns={columns} />
    </>
  );
}
