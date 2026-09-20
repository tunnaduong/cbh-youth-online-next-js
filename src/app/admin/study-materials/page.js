"use client";

import { Button, Popconfirm, Select, Tag, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, fmtNumber, errMsg } from "../_components/ResourceTable";
import { adminGetStudyMaterials, adminUpdateStudyMaterial, adminDeleteStudyMaterial } from "@/app/Api";

const STATUS_OPTIONS = [
  { value: "published", label: "Đã xuất bản" },
  { value: "draft", label: "Bản nháp" },
];

export default function AdminStudyMaterialsPage() {
  const columns = (reload) => [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Tài liệu",
      key: "title",
      render: (_, m) => (
        <div className="max-w-[340px]">
          <div className="font-medium">{m.title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.description}</div>
        </div>
      ),
    },
    { title: "Người đăng", key: "user", render: (_, m) => m.user?.username || "-" },
    { title: "Danh mục", key: "category", render: (_, m) => m.category?.name || "-" },
    {
      title: "Giá",
      key: "price",
      render: (_, m) => (m.is_free ? <Tag color="green">Miễn phí</Tag> : `${fmtNumber(m.price)} điểm`),
    },
    { title: "Lượt xem", dataIndex: "view_count", render: fmtNumber },
    { title: "Lượt tải", dataIndex: "download_count", render: fmtNumber },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, m) => (
        <Select
          size="small"
          style={{ width: 130 }}
          value={m.status}
          options={STATUS_OPTIONS}
          onChange={async (status) => {
            try {
              await adminUpdateStudyMaterial(m.id, { status });
              message.success("Đã cập nhật tài liệu");
              reload();
            } catch (err) {
              message.error(errMsg(err, "Cập nhật thất bại"));
            }
          }}
        />
      ),
    },
    { title: "Ngày tạo", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, m) => (
        <Popconfirm
          title="Xóa tài liệu này?"
          okText="Xóa"
          okButtonProps={{ danger: true }}
          cancelText="Hủy"
          onConfirm={async () => {
            try {
              await adminDeleteStudyMaterial(m.id);
              message.success("Đã xóa tài liệu");
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
      title="Tài liệu học tập"
      fetcher={adminGetStudyMaterials}
      columns={columns}
      filters={[
        { key: "search", type: "search", placeholder: "Tiêu đề, mô tả, username, ID" },
        { key: "status", type: "select", placeholder: "Trạng thái", options: STATUS_OPTIONS },
        {
          key: "is_free",
          type: "select",
          placeholder: "Loại",
          options: [
            { value: 1, label: "Miễn phí" },
            { value: 0, label: "Có phí" },
          ],
        },
      ]}
    />
  );
}
