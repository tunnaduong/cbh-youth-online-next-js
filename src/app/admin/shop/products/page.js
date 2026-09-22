"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, fmtNumber, fmtVndPoints, vndToPoints, errMsg } from "../../_components/ResourceTable";
import {
  adminGetShopProducts,
  adminSaveShopProduct,
  adminDeleteShopProduct,
  adminGetShopCategories,
} from "@/app/Api";
import VariantEditor from "./VariantEditor";
import ImageUploadInput from "../../_components/ImageUploadInput";

export default function AdminShopProductsPage() {
  const tableRef = useRef();
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [variantData, setVariantData] = useState({ options: [], variants: [] });
  const [form] = Form.useForm();

  useEffect(() => {
    adminGetShopCategories({ per_page: 100 })
      .then((res) => setCategories((res.data?.data || []).map((c) => ({ value: c.id, label: c.name }))))
      .catch(() => {});
  }, []);

  const openForm = (row) => {
    setEditing(row || {});
    setVariantData({
      options: row?.options || [],
      variants: (row?.variants || []).map((v) => ({ ...v, sku: v.sku || "", image_url: v.image_url || "" })),
    });
    form.setFieldsValue({
      name: row?.name || "",
      slug: row?.slug || "",
      sku: row?.sku || "",
      description: row?.description || "",
      price: row?.price ?? 0,
      stock: row?.stock ?? 0,
      image_url: row?.image_url || "",
      category_id: row?.category_id,
      is_active: row ? !!row.is_active : true,
    });
  };

  const hasVariants = variantData.options.some((o) => o.name.trim() && o.values.length);

  const save = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const options = variantData.options.filter((o) => o.name.trim() && o.values.length);
      if (options.some((o, i) => options.findIndex((x) => x.name.trim() === o.name.trim()) !== i)) {
        message.error("Tên nhóm phân loại bị trùng");
        return;
      }
      await adminSaveShopProduct(editing.id, {
        ...values,
        options: options.map((o) => ({ ...o, name: o.name.trim() })),
        variants: options.length ? variantData.variants : [],
      });
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
            <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100 dark:bg-neutral-700" />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-neutral-700" />
          )}
          <div>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {p.sku ? `${p.sku} · ` : ""}
              {p.slug}
            </div>
          </div>
        </div>
      ),
    },
    { title: "Danh mục", key: "category", render: (_, p) => p.category?.name || "-" },
    {
      title: "Giá (VND)",
      dataIndex: "price",
      render: (v, p) =>
        p.variants?.length ? (
          <div>
            <div>Từ {fmtVndPoints(v)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{p.variants.length} phân loại</div>
          </div>
        ) : (
          fmtVndPoints(v)
        ),
    },
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
          { key: "search", type: "search", placeholder: "Tên, mã SP, slug, ID" },
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
        width={hasVariants ? 860 : 560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: "Nhập tên sản phẩm" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="Mã sản phẩm" extra="VD: AO-THUN-2024 (không bắt buộc, không trùng)">
            <Input maxLength={64} />
          </Form.Item>
          <Form.Item name="slug" label="Slug" extra="Để trống để tự tạo">
            <Input />
          </Form.Item>
          <Form.Item name="category_id" label="Danh mục" rules={[{ required: true, message: "Chọn danh mục" }]}>
            <Select options={categories} />
          </Form.Item>
          {hasVariants && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Giá hiển thị = giá thấp nhất, tồn kho = tổng các phân loại.
            </div>
          )}
          <div className={`grid grid-cols-2 gap-4 ${hasVariants ? "hidden" : ""}`}>
            <Form.Item
              name="price"
              label="Giá (VND)"
              rules={[{ required: true }]}
              extra={<Form.Item noStyle shouldUpdate={(a, b) => a.price !== b.price}>
                {({ getFieldValue }) => `≈ ${fmtNumber(vndToPoints(getFieldValue("price") || 0))} điểm (1.000đ = 10 điểm)`}
              </Form.Item>}
            >
              <InputNumber min={0} step={1000} addonAfter="đ" className="!w-full" />
            </Form.Item>
            <Form.Item name="stock" label="Tồn kho" rules={[{ required: true }]}>
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
          </div>
          <Form.Item label="Phân loại hàng" extra="VD: Size (S, M, L), Màu (Đen, Trắng) — mỗi tổ hợp có giá và kho riêng">
            <VariantEditor value={variantData} onChange={setVariantData} basePrice={form.getFieldValue("price") || 0} />
          </Form.Item>
          <Form.Item name="image_url" label="Ảnh sản phẩm">
            <ImageUploadInput />
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
