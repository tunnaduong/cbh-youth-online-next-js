"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Col, Image, Input, Modal, Popconfirm, Row, Select, Space, Statistic, Tag, message } from "antd";
import ResourceTable, { UserLink, fmtDate, errMsg } from "../_components/ResourceTable";
import {
  adminGetFeedback,
  adminGetFeedbackStats,
  adminUpdateFeedback,
  adminDeleteFeedback,
} from "@/app/Api";

const TYPE_LABEL = { bug: "Báo lỗi", suggestion: "Góp ý", other: "Khác" };
const TYPE_COLOR = { bug: "red", suggestion: "blue", other: "default" };
const STATUS_LABEL = { new: "Mới", in_progress: "Đang xử lý", resolved: "Đã giải quyết", closed: "Đã đóng" };
const STATUS_COLOR = { new: "gold", in_progress: "processing", resolved: "green", closed: "default" };
const PLATFORM_LABEL = { web: "Web", ios: "iOS", android: "Android" };

const toOptions = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));

function ReviewModal({ item, onClose, onSaved }) {
  const [status, setStatus] = useState("in_progress");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setStatus(item.status === "new" ? "in_progress" : item.status);
      setNotes(item.admin_notes || "");
    }
  }, [item]);

  const save = async () => {
    setSaving(true);
    try {
      await adminUpdateFeedback(item.id, { status, admin_notes: notes.trim() || null });
      message.success("Đã cập nhật");
      onSaved();
      onClose();
    } catch (err) {
      message.error(errMsg(err, "Cập nhật thất bại"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!item}
      title={`Góp ý #${item?.id ?? ""}`}
      onCancel={() => !saving && onClose()}
      onOk={save}
      okText="Lưu"
      cancelText="Đóng"
      okButtonProps={{ loading: saving }}
      width={640}
      destroyOnClose
    >
      {item && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Tag color={TYPE_COLOR[item.type]}>{TYPE_LABEL[item.type] || item.type}</Tag>
            <Tag>{PLATFORM_LABEL[item.platform] || item.platform}</Tag>
            {item.app_version && <Tag>v{item.app_version}</Tag>}
          </div>
          <div className="whitespace-pre-wrap rounded-lg bg-gray-50 dark:bg-neutral-800 p-3 text-sm">{item.content}</div>
          {item.image_urls?.length > 0 && (
            <Image.PreviewGroup>
              <Space wrap>
                {item.image_urls.map((url) => (
                  <Image key={url} src={url} width={96} height={96} style={{ objectFit: "cover", borderRadius: 8 }} alt="" />
                ))}
              </Space>
            </Image.PreviewGroup>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
            <div>
              Người gửi: <UserLink user={item.user} userId={item.user_id} />
              {!item.user_id && " (khách)"}
            </div>
            {(item.contact_email || item.user?.email) && <div>Email: {item.contact_email || item.user?.email}</div>}
            {item.page_url && (
              <div className="break-all">
                Trang: <a href={item.page_url} target="_blank" rel="noreferrer">{item.page_url}</a>
              </div>
            )}
            {item.device_info && <div className="break-all">Thiết bị: {item.device_info}</div>}
            <div>Gửi lúc: {fmtDate(item.created_at)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Trạng thái</label>
            <Select className="w-full" value={status} onChange={setStatus} options={toOptions(STATUS_LABEL)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú nội bộ</label>
            <Input.TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminFeedbackPage() {
  const tableRef = useRef();
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);

  const loadStats = () =>
    adminGetFeedbackStats()
      .then((res) => setStats(res.data))
      .catch(() => {});

  useEffect(() => {
    loadStats();
  }, []);

  const reload = () => {
    tableRef.current?.reload();
    loadStats();
  };

  const handleDelete = async (id) => {
    try {
      await adminDeleteFeedback(id);
      message.success("Đã xóa");
      reload();
    } catch (err) {
      message.error(errMsg(err, "Xóa thất bại"));
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Loại",
      dataIndex: "type",
      render: (v) => <Tag color={TYPE_COLOR[v]}>{TYPE_LABEL[v] || v}</Tag>,
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      render: (v, r) => (
        <button type="button" className="text-left max-w-[380px]" onClick={() => setSelected(r)}>
          <div className="line-clamp-2">{v}</div>
          {r.image_urls?.length > 0 && (
            <div className="text-xs text-gray-400 mt-1">{r.image_urls.length} ảnh đính kèm</div>
          )}
        </button>
      ),
    },
    {
      title: "Người gửi",
      key: "user",
      render: (_, r) =>
        r.user_id ? <UserLink user={r.user} userId={r.user_id} /> : <span className="text-gray-500">{r.contact_email || "Khách"}</span>,
    },
    { title: "Nền tảng", dataIndex: "platform", render: (v, r) => `${PLATFORM_LABEL[v] || v}${r.app_version ? ` ${r.app_version}` : ""}` },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (v) => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v] || v}</Tag>,
    },
    { title: "Gửi lúc", dataIndex: "created_at", render: fmtDate, width: 160 },
    {
      title: "",
      key: "actions",
      render: (_, r) => (
        <Space size="small">
          <Button size="small" onClick={() => setSelected(r)}>
            Xử lý
          </Button>
          <Popconfirm title="Xóa góp ý này?" okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => handleDelete(r.id)}>
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
      {stats && (
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 pt-6">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4}><Card size="small"><Statistic title="Tổng số" value={stats.total} /></Card></Col>
            {Object.entries(STATUS_LABEL).map(([k, label]) => (
              <Col key={k} xs={12} sm={8} md={4}><Card size="small"><Statistic title={label} value={stats.by_status?.[k] ?? 0} /></Card></Col>
            ))}
            <Col xs={12} sm={8} md={4}><Card size="small"><Statistic title="Báo lỗi" value={stats.by_type?.bug ?? 0} /></Card></Col>
          </Row>
        </div>
      )}
      <ResourceTable
        ref={tableRef}
        title="Góp ý & Báo lỗi"
        fetcher={adminGetFeedback}
        columns={columns}
        filters={[
          { key: "search", type: "search", placeholder: "Tìm nội dung, email, username..." },
          { key: "status", type: "select", placeholder: "Trạng thái", options: toOptions(STATUS_LABEL) },
          { key: "type", type: "select", placeholder: "Loại", options: toOptions(TYPE_LABEL) },
          { key: "platform", type: "select", placeholder: "Nền tảng", options: toOptions(PLATFORM_LABEL) },
        ]}
        defaultFilters={{ status: "new" }}
      />
      <ReviewModal item={selected} onClose={() => setSelected(null)} onSaved={reload} />
    </>
  );
}
