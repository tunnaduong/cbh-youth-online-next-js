"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
} from "antd";
import DefaultLayout from "@/layouts/DefaultLayout";
import { useAuthContext } from "@/contexts/Support";
import { getReports, getReportStats, reviewReport } from "@/app/Api";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const STATUS_COLORS = {
  pending: "orange",
  reviewed: "blue",
  resolved: "green",
  dismissed: "default",
};

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
  const { currentUser, authLoading } = useAuthContext();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const isAdmin = currentUser?.role === "admin";

  const fetchReports = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page };
        if (statusFilter) params.status = statusFilter;
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
    [statusFilter, dateRange]
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
    if (!isAdmin) return;
    fetchReports(1);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, statusFilter, dateRange]);

  if (authLoading) {
    return (
      <DefaultLayout activeNav="admin">
        <div className="p-8 text-center text-gray-500">Đang tải...</div>
      </DefaultLayout>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <DefaultLayout activeNav="admin">
        <div className="p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Không có quyền truy cập</h1>
          <p className="text-gray-500 mb-4">
            Bạn cần quyền quản trị viên để xem trang này.
          </p>
          <Link href="/" className="text-primary-500 underline">
            Về trang chủ
          </Link>
        </div>
      </DefaultLayout>
    );
  }

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
        r.reportedUser?.username || r.reportedUser?.profile_name || "-",
    },
    {
      title: "Nội dung liên quan",
      key: "content",
      render: (_, r) => {
        if (r.topic_id) return `Bài viết #${r.topic_id}`;
        if (r.story_id) return `Tin #${r.story_id}`;
        return "Người dùng";
      },
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
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
      render: (_, r) => (
        <Button size="small" onClick={() => setReviewTarget(r)}>
          Xử lý
        </Button>
      ),
    },
  ];

  return (
    <DefaultLayout activeNav="admin">
      <div className="max-w-[1100px] mx-auto w-full px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">Quản lý báo cáo</h1>

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
                    {r.reportedUser?.username ||
                      r.reportedUser?.profile_name ||
                      `#${r.reported_user_id}`}
                  </span>
                  <span className="text-gray-500">{r.total} lượt</span>
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
          scroll={{ x: true }}
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
    </DefaultLayout>
  );
}
