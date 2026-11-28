"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Button, Card, DatePicker, Form, Image, Input, InputNumber, Modal, Popconfirm,
  Segmented, Select, Space, Switch, Table, Tag, message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import ImageUploadInput from "../_components/ImageUploadInput";
import { adminGetAds, adminCreateAd, adminUpdateAd, adminDeleteAd } from "@/app/Api";

const PLACEMENTS = {
  "mobile-home-header": "Header trang chủ app mobile",
  sidebar: "Bên dưới bảng xếp hạng (sidebar)",
  "post-bottom": "Dưới bài viết, trên bình luận",
  "feed-inline": "Xen giữa bảng tin",
};

const PLACEMENT_COLORS = {
  "mobile-home-header": "blue",
  sidebar: "green",
  "post-bottom": "gold",
  "feed-inline": "purple",
};

const unwrap = (res) => res?.data ?? res;
const errMsg = (e) => e?.response?.data?.message || e?.message || "Có lỗi xảy ra";

export default function AdminAdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [placementFilter, setPlacementFilter] = useState("all");
  const [editing, setEditing] = useState(null); // null | {} (new) | ad
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const watchedPlacement = Form.useWatch("placement", form);
  const watchedImageUrl = Form.useWatch("image_url", form);

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

  const filteredAds = useMemo(
    () => (placementFilter === "all" ? ads : ads.filter((ad) => ad.placement === placementFilter)),
    [ads, placementFilter]
  );

  const openEditor = (ad) => {
    setEditing(ad || {});
    form.setFieldsValue(
      ad
        ? {
            ...ad,
            range: [ad.starts_at ? dayjs(ad.starts_at) : null, ad.ends_at ? dayjs(ad.ends_at) : null],
          }
        : {
            placement: placementFilter !== "all" ? placementFilter : "mobile-home-header",
            is_active: true,
            priority: 10,
            range: [null, null],
          }
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
      width: 130,
      render: (src, ad) => {
        const isWide = ad.placement === "mobile-home-header";
        return (
          <Image
            src={src}
            alt={ad.alt_text || ad.name || ""}
            width={isWide ? 112 : 64}
            height={isWide ? 42 : 64}
            style={{ objectFit: "cover", borderRadius: 8 }}
          />
        );
      },
    },
    {
      title: "Tên",
      dataIndex: "name",
      render: (name, ad) => (
        <div>
          <div className="font-medium">{name}</div>
          {ad.link_url ? (
            <a href={ad.link_url} target="_blank" rel="noreferrer" className="text-xs break-all">
              {ad.link_url}
            </a>
          ) : null}
        </div>
      ),
    },
    {
      title: "Vị trí",
      dataIndex: "placement",
      render: (p) => <Tag color={PLACEMENT_COLORS[p] || "green"}>{PLACEMENTS[p] || p}</Tag>,
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

  const segmentedOptions = [
    { label: `Tất cả (${ads.length})`, value: "all" },
    ...Object.entries(PLACEMENTS).map(([value, label]) => {
      const count = ads.filter((a) => a.placement === value).length;
      return { label: `${label} (${count})`, value };
    }),
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
      <p className="mb-3 text-gray-500 text-sm">
        Quảng cáo đang bật sẽ hiển thị ở vị trí tương ứng (trên web sẽ thay thế quảng cáo mạng Adsterra; trên app
        mobile hiển thị ngay header trang chủ). Nếu bật <strong>từ 2 quảng cáo trở lên</strong> cùng một vị trí, hệ
        thống sẽ tự động hiển thị dạng <strong>carousel slider</strong> theo thứ tự độ ưu tiên từ cao xuống thấp.
      </p>

      <div className="mb-4 overflow-x-auto pb-1">
        <Segmented
          value={placementFilter}
          onChange={setPlacementFilter}
          options={segmentedOptions}
        />
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredAds}
        loading={loading}
        scroll={{ x: 940 }}
        pagination={false}
      />

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
          <Form.Item
            name="image_url"
            label="Ảnh quảng cáo"
            rules={[{ required: true, message: "Tải ảnh lên" }]}
            extra={
              watchedPlacement === "mobile-home-header"
                ? "Khuyến nghị ảnh banner ngang tỉ lệ ~2.7:1 (VD: 1170×433 px) để hiển thị sắc nét trên header app mobile."
                : undefined
            }
          >
            <ImageUploadInput />
          </Form.Item>
          {watchedPlacement === "mobile-home-header" && watchedImageUrl ? (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Xem trước trên header app mobile:</div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-700 aspect-[1170/433] bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={watchedImageUrl} alt="Banner preview" className="w-full h-full object-cover" />
              </div>
            </div>
          ) : null}
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
            <Form.Item
              name="priority"
              label="Độ ưu tiên"
              tooltip="Số lớn hơn hiển thị trước trong carousel slider"
            >
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
