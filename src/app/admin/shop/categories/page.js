"use client";

import { useRef, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Space, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, errMsg } from "../../_components/ResourceTable";
import { adminGetShopCategories, adminSaveShopCategory, adminDeleteShopCategory } from "@/app/Api";

export default function AdminShopCategoriesPage() {
  const tableRef = useRef();
  const [editing, setEditing] = useState(null); // {} for new, row for edit
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const openForm = (row) => {
    setEditing(row || {});
    form.setFieldsValue({ name: row?.name || "", slug: row?.slug || "", description: row?.description || "" });
  };

  const save = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await adminSaveShopCategory(editing.id, values);
      message.success("Đã lưu danh mục");
      setEditing(null);
      tableRef.current?.reload();
    } catch (err) {
      message.error(errMsg(err, "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "Tên", dataIndex: "name" },
    { title: "Slug", dataIndex: "slug", render: (v) => <code>{v}</code> },
    { title: "Mô tả", dataIndex: "description", ellipsis: true },
    { title: "Sản phẩm", dataIndex: "products_count" },
    { title: "Ngày tạo", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, c) => (
        <Space>
          <Button size="small" onClick={() => openForm(c)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa danh mục này?"
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={async () => {
              try {
                await adminDeleteShopCategory(c.id);
                message.success("Đã xóa danh mục");
                tableRef.current?.reload();
              } catch (err) {
                message.error(errMsg(err, "Xóa thất bại"));
              }
            }}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ResourceTable
        ref={tableRef}
        title="Danh mục cửa hàng"
        fetcher={adminGetShopCategories}
        columns={columns}
        filters={[{ key: "search", type: "search", placeholder: "Tên, slug" }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm(null)}>
            Thêm danh mục
          </Button>
        }
      />
      <Modal
        title={editing?.id ? "Sửa danh mục" : "Thêm danh mục"}
        open={!!editing}
        confirmLoading={saving}
        okText="Lưu"
        cancelText="Hủy"
        onCancel={() => setEditing(null)}
        onOk={save}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: "Nhập tên danh mục" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" extra="Để trống để tự tạo từ tên">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
