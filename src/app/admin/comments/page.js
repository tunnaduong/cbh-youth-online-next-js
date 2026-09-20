"use client";

import { Button, Popconfirm, Tag, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, errMsg } from "../_components/ResourceTable";
import { adminGetComments, adminDeleteComment } from "@/app/Api";
import { generatePostUrl } from "@/utils/slugify";

export default function AdminCommentsPage() {
  const columns = (reload) => [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Nội dung",
      dataIndex: "comment",
      render: (v) => <div className="max-w-[420px] whitespace-pre-wrap break-words">{v}</div>,
    },
    {
      title: "Người viết",
      key: "user",
      render: (_, c) => (
        <>
          {c.user?.username || "-"}
          {c.is_anonymous ? <Tag className="ml-1">Ẩn danh</Tag> : null}
        </>
      ),
    },
    {
      title: "Bài viết",
      key: "topic",
      render: (_, c) => {
        // A comment has no page of its own, so link to the post holding it.
        const url = generatePostUrl(c.topic);
        return (
          <div className="max-w-[240px]">
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" className="block truncate">
                #{c.topic_id} {c.topic?.title}
              </a>
            ) : (
              <div className="truncate text-gray-400 dark:text-gray-500">
                #{c.topic_id} (bài đã xoá)
              </div>
            )}
          </div>
        );
      },
    },
    { title: "Ngày tạo", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, c) => (
        <Popconfirm
          title="Xóa bình luận này?"
          okText="Xóa"
          okButtonProps={{ danger: true }}
          cancelText="Hủy"
          onConfirm={async () => {
            try {
              await adminDeleteComment(c.id);
              message.success("Đã xóa bình luận");
              reload();
            } catch (err) {
              message.error(errMsg(err, "Xóa thất bại"));
            }
          }}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <ResourceTable
      title="Quản lý bình luận"
      fetcher={adminGetComments}
      columns={columns}
      filters={[{ key: "search", type: "search", placeholder: "Nội dung, username, ID" }]}
    />
  );
}
