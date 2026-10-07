"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Select,
  DatePicker,
  Button,
  Modal,
  Input,
  Switch,
  InputNumber,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Space,
  Tooltip,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { getReports, getReportStats, reviewReport, deleteReport } from "@/app/Api";
import { generatePostUrl } from "@/utils/slugify";
import { WarnButton, RemoveButton } from "../_components/ModerationActions";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const STATUS_COLORS = {
  pending: "orange",
  reviewed: "blue",
  resolved: "green",
  dismissed: "default",
};

const TYPE_OPTIONS = [
  { value: "topic", label: "Bài viết" },
  { value: "comment", label: "Bình luận" },
  { value: "message", label: "Tin nhắn" },
  { value: "story", label: "Tin" },
  { value: "user", label: "Người dùng" },
];

// What a report points at. Newer API responses carry a computed `target`;
// older rows (or an older API) only have the raw ids, so derive the same
// shape from those.
const reportTarget = (r) => {
  if (r.target?.content_type) return r.target;
  if (r.message_id) return { content_type: "message", content_id: r.message_id, exists: true };
  if (r.comment_id) return { content_type: "comment", content_id: r.comment_id, exists: true };
  if (r.topic_id)
    return { content_type: "topic", content_id: r.topic_id, exists: true, url: generatePostUrl(r.topic, r.topic_id) };
  if (r.story_id) return { content_type: "story", content_id: r.story_id, exists: true };
  return { content_type: "user", content_id: r.reported_user_id, exists: !!r.reported_user };
};

const GoneTag = () => <Tag className="ml-1">đã bị xóa</Tag>;

function TargetCell({ report }) {
  const t = reportTarget(report);
  const gone = t.exists === false;
  const excerpt = t.excerpt ? (
    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 max-w-[260px]">{t.excerpt}</div>
  ) : null;
  const url = t.url || (t.content_type === "topic" ? generatePostUrl(report.topic, t.content_id) : null);
  const link = (label) =>
    url && !gone ? (
      <a href={url} target="_blank" rel="noreferrer">
        {label}
      </a>
    ) : (
      <span>{label}</span>
    );

  switch (t.content_type) {
    case "topic":
      return (
        <div>
          {link(`Bài viết #${t.content_id}`)}
          {gone && <GoneTag />}
          {excerpt}
        </div>
      );
    case "comment":
      return (
        <div>
          <Tooltip title={t.excerpt}>{link(`Bình luận #${t.content_id}`)}</Tooltip>
          {gone && <GoneTag />}
          {excerpt}
        </div>
      );
    case "message": {
      const conversationId = t.conversation_id;
      const messageId = t.message_id || t.content_id;
      return (
        <div>
          {conversationId ? (
            // The messages page opens this conversation at the message (and logs the view).
            <a
              href={`/admin/messages?conversation=${conversationId}&message=${messageId}`}
              target="_blank"
              rel="noreferrer"
            >
              Xem tin nhắn #{messageId}
            </a>
          ) : (
            <span>Tin nhắn #{messageId}</span>
          )}
          {gone && <GoneTag />}
          {excerpt}
        </div>
      );
    }
    case "story":
      // Stories have no public page to link to, so they stay plain text.
      return (
        <div>
          <span>Tin #{t.story_id || t.content_id}</span>
          {gone && <GoneTag />}
          {excerpt}
        </div>
      );
    default: {
      const username = report.reported_user?.username;
      return (
        <div>
          {username ? (
            <a href={t.url || `/${username}`} target="_blank" rel="noreferrer">
              @{username}
            </a>
          ) : (
            <span>{report.reported_user_id ? `Người dùng #${report.reported_user_id}` : "Người dùng"}</span>
          )}
          {gone && <GoneTag />}
        </div>
      );
    }
  }
}

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  reviewed: "Đã xem xét",
  resolved: "Đã giải quyết",
  dismissed: "Đã bỏ qua",
};

function ReviewModal({ report, open, onClose, onSuccess }) {
  const [status, setStatus] = useState("reviewed");
  const [adminNotes, setAdminNotes] = useState("");
  const [banUser, setBanUser] = useState(false);
  const [banDuration, setBanDuration] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus("reviewed");
      setAdminNotes("");
      setBanUser(false);
      setBanDuration(7);
    }
  }, [open, report?.id]);

  const handleSubmit = async () => {
    if (!adminNotes.trim()) {
      message.error("Vui lòng nhập ghi chú xử lý");
      return;
    }
    if (banUser && (!banDuration || banDuration < 1)) {
      message.error("Vui lòng nhập số ngày cấm hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      const params = {
        status,
        admin_notes: adminNotes.trim(),
        ban_user: banUser,
      };
      if (banUser) params.ban_duration = banDuration;

      await reviewReport(report.id, params);
      message.success("Đã cập nhật báo cáo");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Không thể cập nhật báo cáo, vui lòng thử lại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Xử lý báo cáo #${report?.id ?? ""}`}
      onCancel={() => !submitting && onClose?.()}
      onOk={handleSubmit}
      okText="Lưu"
      cancelText="Hủy"
      okButtonProps={{ loading: submitting }}
      cancelButtonProps={{ disabled: submitting }}
      destroyOnClose
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Trạng thái</label>
          <Select
            className="w-full"
            value={status}
            onChange={setStatus}
            options={[
              { value: "reviewed", label: "Đã xem xét" },
              { value: "resolved", label: "Đã giải quyết" },
              { value: "dismissed", label: "Đã bỏ qua" },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ghi chú xử lý</label>
          <TextArea
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Nhập ghi chú xử lý báo cáo này..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={banUser} onChange={setBanUser} />
          <span className="text-sm">Cấm người dùng bị báo cáo</span>
        </div>
        {banUser && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Số ngày cấm
            </label>
            <InputNumber
              min={1}
              value={banDuration}
              onChange={setBanDuration}
              className="w-full"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchReports = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page };
        if (statusFilter) params.status = statusFilter;
        if (typeFilter) params.type = typeFilter;
        if (dateRange?.[0]) params.from_date = dateRange[0].format("YYYY-MM-DD");
        if (dateRange?.[1]) params.to_date = dateRange[1].format("YYYY-MM-DD");

        const res = await getReports(params);
        const data = res.data;
        setReports(data?.data || []);
        setPagination({
          current: data?.current_page || 1,
          pageSize: data?.per_page || 15,
          total: data?.total || 0,
        });
      } catch (err) {
        message.error(
          err?.response?.data?.message || "Không thể tải danh sách báo cáo"
        );
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, typeFilter, dateRange]
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await getReportStats();
      setStats(res.data);
    } catch (err) {
      // Non-fatal; just skip the stats summary if it fails.
      console.error("Failed to load report stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchReports(1);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, dateRange]);


  const handleDelete = async (id) => {
    try {
      const res = await deleteReport(id);
      message.success(res.data?.message || "Đã xóa báo cáo");
      fetchReports(pagination.current);
      fetchStats();
    } catch (err) {
      message.error(err?.response?.data?.message || "Xóa thất bại");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 70 },
    {
      title: "Người báo cáo",
      key: "reporter",
      render: (_, r) => r.reporter?.username || r.reporter?.profile_name || "-",
    },
    {
      title: "Người bị báo cáo",
      key: "reportedUser",
      render: (_, r) =>
        r.reported_user?.username || r.reported_user?.profile_name || "-",
    },
    {
      title: "Nội dung liên quan",
      key: "content",
      render: (_, r) => <TargetCell report={r} />,
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      // Not `ellipsis`: it switches the table to a fixed layout, which squeezes
      // every column into the screen width instead of letting the table scroll.
      render: (v) => (
        <div className="max-w-[260px] line-clamp-2 break-words" title={v}>
          {v || "-"}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || "default"}>
          {STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (v) => (v ? new Date(v).toLocaleString("vi-VN") : "-"),
    },
    {
      title: "",
      key: "actions",
      render: (_, r) => {
        const t = reportTarget(r);
        const canModerate = t.content_type !== "user" && t.exists !== false && t.content_id;
        const reload = () => {
          fetchReports(pagination.current);
          fetchStats();
        };
        return (
          <Space wrap>
            <Button size="small" onClick={() => setReviewTarget(r)}>
              Xử lý
            </Button>
            {canModerate && (
              <>
                <WarnButton
                  contentType={t.content_type}
                  contentId={t.content_id}
                  reportId={r.id}
                  onDone={reload}
                />
                <RemoveButton
                  contentType={t.content_type}
                  contentId={t.content_id}
                  reportId={r.id}
                  onDone={reload}
                />
              </>
            )}
            <Popconfirm
              title="Xóa báo cáo này?"
              description="Chỉ xóa báo cáo; bài viết, tin hoặc tài khoản bị báo cáo không bị ảnh hưởng."
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => handleDelete(r.id)}
            >
              <Tooltip title="Xóa báo cáo">
                <Button size="small" danger type="text" icon={<DeleteOutlined />} aria-label="Xóa báo cáo" />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-5">Quản lý báo cáo</h1>

        {stats && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={12} sm={8} md={4}>
              <Card size="small"><Statistic title="Tổng số" value={stats.total} /></Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small"><Statistic title="Chờ xử lý" value={stats.pending} /></Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small"><Statistic title="Đã xem xét" value={stats.reviewed} /></Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small"><Statistic title="Đã giải quyết" value={stats.resolved} /></Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small"><Statistic title="Đã bỏ qua" value={stats.dismissed} /></Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small"><Statistic title="Gần đây" value={stats.recent} /></Card>
            </Col>
          </Row>
        )}

        {stats?.most_reported_users?.length > 0 && (
          <Card size="small" title="Người dùng bị báo cáo nhiều nhất" className="mb-6">
            <div className="flex flex-col gap-1">
              {stats.most_reported_users.map((r, idx) => (
                <div key={r.reported_user_id || idx} className="flex justify-between text-sm">
                  <span>
                    {r.reported_user?.username ||
                      r.reported_user?.profile_name ||
                      `#${r.reported_user_id}`}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{r.total} lượt</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <Select
            allowClear
            placeholder="Lọc theo trạng thái"
            className="w-48"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "pending", label: "Chờ xử lý" },
              { value: "reviewed", label: "Đã xem xét" },
              { value: "resolved", label: "Đã giải quyết" },
              { value: "dismissed", label: "Đã bỏ qua" },
            ]}
          />
          <Select
            allowClear
            placeholder="Loại nội dung"
            className="w-48"
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_OPTIONS}
          />
          <RangePicker value={dateRange} onChange={setDateRange} />
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={reports}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => fetchReports(page),
          }}
          scroll={{ x: "max-content" }}
        />
      </div>

      <ReviewModal
        report={reviewTarget}
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSuccess={() => {
          fetchReports(pagination.current);
          fetchStats();
        }}
      />
    </div>
  );
}
