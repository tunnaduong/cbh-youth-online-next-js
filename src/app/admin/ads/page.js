"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button, Card, DatePicker, Form, Image, Input, InputNumber, Modal, Popconfirm,
  Select, Space, Switch, Table, Tag, message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import ImageUploadInput from "../_components/ImageUploadInput";
import { adminGetAds, adminCreateAd, adminUpdateAd, adminDeleteAd } from "@/app/Api";

const PLACEMENTS = {
  sidebar: "Bên dưới bảng xếp hạng (sidebar)",
  "post-bottom": "Dưới bài viết, trên bình luận",
  "feed-inline": "Xen giữa bảng tin",
};

const unwrap = (res) => res?.data ?? res;
const errMsg = (e) => e?.response?.data?.message || e?.message || "Có lỗi xảy ra";

export default function AdminAdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // null | {} (new) | ad
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const body = unwrap(await adminGetAds());
      setAds(body?.data || []);
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEditor = (ad) => {
    setEditing(ad || {});
    form.setFieldsValue(
      ad
        ? {
            ...ad,
            range: [ad.starts_at ? dayjs(ad.starts_at) : null, ad.ends_at ? dayjs(ad.ends_at) : null],
          }
        : { placement: "sidebar", is_active: true, priority: 0, range: [null, null] }
    );
  };

  const save = async () => {
    const { range, ...values } = await form.validateFields();
    const payload = {
      ...values,
      starts_at: range?.[0] ? range[0].toISOString() : null,
      ends_at: range?.[1] ? range[1].toISOString() : null,
    };
    setSaving(true);
    try {
      if (editing?.id) await adminUpdateAd(editing.id, payload);
      else await adminCreateAd(payload);
      message.success("Đã lưu quảng cáo");
      setEditing(null);
      load();
    } catch (e) {
      message.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (ad, is_active) => {
    try {
      await adminUpdateAd(ad.id, { ...ad, is_active });
      load();
    } catch (e) {
      message.error(errMsg(e));
    }
  };

  const remove = async (ad) => {
    try {
      await adminDeleteAd(ad.id);
      message.success("Đã xóa");
      load();
    } catch (e) {
      message.error(errMsg(e));
    }
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "image_url",
      width: 90,
      render: (src) => <Image src={src} alt="" width={64} height={64} style={{ objectFit: "cover", borderRadius: 8 }} />,
    },
    {
      title: "Tên",
      dataIndex: "name",
      render: (name, ad) => (
        <div>
          <div className="font-medium">{name}</div>
          {ad.link_url ? (
            <a href={ad.link_url} target="_blank" rel="noreferrer" className="text-xs">
              {ad.link_url}
            </a>
          ) : null}
        </div>
      ),
    },
    {
      title: "Vị trí",
      dataIndex: "placement",
      filters: Object.entries(PLACEMENTS).map(([value, text]) => ({ value, text })),
      onFilter: (v, ad) => ad.placement === v,
      render: (p) => <Tag color="green">{PLACEMENTS[p] || p}</Tag>,
    },
    { title: "Ưu tiên", dataIndex: "priority", width: 80 },
    {
      title: "Thời gian",
      render: (_, ad) =>
        ad.starts_at || ad.ends_at
          ? `${ad.starts_at ? dayjs(ad.starts_at).format("DD/MM/YYYY") : "…"} → ${ad.ends_at ? dayjs(ad.ends_at).format("DD/MM/YYYY") : "…"}`
          : "Không giới hạn",
    },
    { title: "Hiển thị", dataIndex: "impressions", width: 90 },
    { title: "Click", dataIndex: "clicks", width: 70 },
    {
      title: "Bật",
      dataIndex: "is_active",
      width: 70,
      render: (v, ad) => <Switch size="small" checked={v} onChange={(c) => toggle(ad, c)} />,
    },
    {
      title: "",
      width: 100,
      render: (_, ad) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditor(ad)} />
          <Popconfirm title="Xóa quảng cáo này?" onConfirm={() => remove(ad)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Slot quảng cáo"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor(null)}>
            Thêm quảng cáo
          </Button>
        </Space>
      }
    >
      <p className="mb-4 text-gray-500 text-sm">
        Quảng cáo đang bật sẽ thay thế quảng cáo mạng (Adsterra) ở vị trí tương ứng. Nhiều quảng cáo cùng vị trí:
        hiện quảng cáo có độ ưu tiên cao nhất (bằng nhau thì xoay vòng ngẫu nhiên).
      </p>
      <Table rowKey="id" columns={columns} dataSource={ads} loading={loading} scroll={{ x: 900 }} pagination={false} />

      <Modal
        open={!!editing}
        title={editing?.id ? "Sửa quảng cáo" : "Thêm quảng cáo"}
        onCancel={() => setEditing(null)}
        onOk={save}
        confirmLoading={saving}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên (nội bộ)" rules={[{ required: true, message: "Nhập tên" }]}>
            <Input placeholder="VD: SEELI tháng 12" />
          </Form.Item>
          <Form.Item name="placement" label="Vị trí chèn" rules={[{ required: true }]}>
            <Select options={Object.entries(PLACEMENTS).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="image_url" label="Ảnh quảng cáo" rules={[{ required: true, message: "Tải ảnh lên" }]}>
            <ImageUploadInput />
          </Form.Item>
          <Form.Item name="link_url" label="Link khi bấm vào">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="alt_text" label="Mô tả ảnh (alt)">
            <Input />
          </Form.Item>
          <Form.Item name="range" label="Thời gian chạy (để trống = không giới hạn)">
            <DatePicker.RangePicker allowEmpty={[true, true]} showTime format="DD/MM/YYYY HH:mm" className="w-full" />
          </Form.Item>
          <Space size="large">
            <Form.Item name="priority" label="Độ ưu tiên">
              <InputNumber />
            </Form.Item>
            <Form.Item name="is_active" label="Đang bật" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
