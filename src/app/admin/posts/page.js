"use client";

import { Button, Popconfirm, Space, Tag, Tooltip, message } from "antd";
import { EyeInvisibleOutlined, EyeOutlined, PushpinOutlined, DeleteOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, errMsg } from "../_components/ResourceTable";
import { adminGetTopics, adminUpdateTopic, adminDeleteTopic } from "@/app/Api";
import { generatePostSlug } from "@/utils/slugify";

const postUrl = (t) =>
  `/${t.anonymous ? "anonymous" : t.user?.username || "anonymous"}/posts/${generatePostSlug(t.id, t.title)}`;

export default function AdminPostsPage() {
  const act = async (fn, reload) => {
    try {
      const res = await fn();
      message.success(res.data?.message || "Thành công");
      reload();
    } catch (err) {
      message.error(errMsg(err, "Thao tác thất bại"));
    }
  };

  const columns = (reload) => [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Tiêu đề",
      key: "title",
      render: (_, t) => (
        <div className="max-w-[360px]">
          <a href={postUrl(t)} target="_blank" rel="noreferrer" className="font-medium">
            {t.title || "(không tiêu đề)"}
          </a>
          <div className="text-xs text-gray-500 truncate">{t.description}</div>
        </div>
      ),
    },
    {
      title: "Tác giả",
      key: "user",
      render: (_, t) => (
        <>
          {t.user?.username || "-"}
          {t.anonymous ? <Tag className="ml-1">Ẩn danh</Tag> : null}
        </>
      ),
    },
    { title: "Chuyên mục", key: "subforum", render: (_, t) => t.subforum?.name || "-" },
    { title: "Bình luận", dataIndex: "comments_count", width: 90 },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, t) => (
        <Space size={4} wrap>
          {t.hidden ? <Tag color="red">Đã ẩn</Tag> : <Tag color="green">Hiển thị</Tag>}
          {t.pinned ? <Tag color="gold">Ghim</Tag> : null}
          {t.privacy !== "public" ? <Tag>{t.privacy}</Tag> : null}
        </Space>
      ),
    },
    { title: "Ngày tạo", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, t) => (
        <Space>
          <Tooltip title={t.hidden ? "Hiện lại trên bảng tin" : "Ẩn khỏi bảng tin"}>
            <Button
              size="small"
              icon={t.hidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => act(() => adminUpdateTopic(t.id, { hidden: !t.hidden }), reload)}
            />
          </Tooltip>
          <Tooltip title={t.pinned ? "Bỏ ghim" : "Ghim"}>
            <Button
              size="small"
              type={t.pinned ? "primary" : "default"}
              icon={<PushpinOutlined />}
              onClick={() => act(() => adminUpdateTopic(t.id, { pinned: !t.pinned }), reload)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa bài viết này?"
            description="Hành động không thể hoàn tác."
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={() => act(() => adminDeleteTopic(t.id), reload)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ResourceTable
      title="Quản lý bài viết"
      fetcher={adminGetTopics}
      columns={columns}
      filters={[
        { key: "search", type: "search", placeholder: "Tiêu đề, nội dung, username, ID" },
        {
          key: "visibility",
          type: "select",
          placeholder: "Hiển thị",
          options: [
            { value: "visible", label: "Đang hiển thị" },
            { value: "hidden", label: "Đã ẩn" },
          ],
        },
        {
          key: "pinned",
          type: "select",
          placeholder: "Ghim",
          options: [
            { value: 1, label: "Đã ghim" },
            { value: 0, label: "Chưa ghim" },
          ],
        },
        {
          key: "privacy",
          type: "select",
          placeholder: "Quyền riêng tư",
          options: [
            { value: "public", label: "Công khai" },
            { value: "followers", label: "Người theo dõi" },
            { value: "private", label: "Riêng tư" },
          ],
        },
      ]}
    />
  );
}
