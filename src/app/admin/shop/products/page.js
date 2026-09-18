"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, fmtNumber, errMsg } from "../../_components/ResourceTable";
import {
  adminGetShopProducts,
  adminSaveShopProduct,
  adminDeleteShopProduct,
  adminGetShopCategories,
} from "@/app/Api";

export default function AdminShopProductsPage() {
  const tableRef = useRef();
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    adminGetShopCategories({ per_page: 100 })
      .then((res) => setCategories((res.data?.data || []).map((c) => ({ value: c.id, label: c.name }))))
      .catch(() => {});
  }, []);

  const openForm = (row) => {
    setEditing(row || {});
    form.setFieldsValue({
      name: row?.name || "",
      slug: row?.slug || "",
      description: row?.description || "",
      price: row?.price ?? 0,
      stock: row?.stock ?? 0,
      image_url: row?.image_url || "",
      category_id: row?.category_id,
      is_active: row ? !!row.is_active : true,
    });
  };

  const save = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await adminSaveShopProduct(editing.id, values);
      message.success("Đã lưu sản phẩm");
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
    {
      title: "Sản phẩm",
      key: "name",
      render: (_, p) => (
        <div className="flex items-center gap-3">
          {p.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100" />
          )}
          <div>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-gray-500">{p.slug}</div>
          </div>
        </div>
      ),
    },
    { title: "Danh mục", key: "category", render: (_, p) => p.category?.name || "-" },
    { title: "Giá (điểm)", dataIndex: "price", render: fmtNumber },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      render: (v) => <span className={v <= 0 ? "text-red-500 font-medium" : ""}>{fmtNumber(v)}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      render: (v) => (v ? <Tag color="green">Đang bán</Tag> : <Tag>Ngừng bán</Tag>),
    },
    { title: "Ngày tạo", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, p) => (
        <Space>
          <Button size="small" onClick={() => openForm(p)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa sản phẩm này?"
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={async () => {
              try {
                await adminDeleteShopProduct(p.id);
                message.success("Đã xóa sản phẩm");
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
        title="Sản phẩm cửa hàng"
        fetcher={adminGetShopProducts}
        columns={columns}
        filters={[
          { key: "search", type: "search", placeholder: "Tên, slug, ID" },
          { key: "category_id", type: "select", placeholder: "Danh mục", options: categories },
          {
            key: "is_active",
            type: "select",
            placeholder: "Trạng thái",
            options: [
              { value: 1, label: "Đang bán" },
              { value: 0, label: "Ngừng bán" },
            ],
          },
        ]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm(null)}>
            Thêm sản phẩm
          </Button>
        }
      />
      <Modal
        title={editing?.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        open={!!editing}
        confirmLoading={saving}
        okText="Lưu"
        cancelText="Hủy"
        onCancel={() => setEditing(null)}
        onOk={save}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: "Nhập tên sản phẩm" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" extra="Để trống để tự tạo">
            <Input />
          </Form.Item>
          <Form.Item name="category_id" label="Danh mục" rules={[{ required: true, message: "Chọn danh mục" }]}>
            <Select options={categories} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="price" label="Giá (điểm)" rules={[{ required: true }]}>
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
            <Form.Item name="stock" label="Tồn kho" rules={[{ required: true }]}>
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
          </div>
          <Form.Item name="image_url" label="URL ảnh">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="is_active" label="Đang bán" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
