"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton, Segmented } from "antd";
import {
  FlagOutlined,
  DownloadOutlined,
  UploadOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  FileTextOutlined,
  CommentOutlined,
  BookOutlined,
  EyeInvisibleOutlined,
  StopOutlined,
  NotificationOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { getReportStats, adminGetOverview } from "@/app/Api";
import TrendChart from "./_components/TrendChart";

const fmt = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN"));

const Panel = ({ title, extra, children, className = "" }) => (
  <section
    className={`bg-white rounded-2xl border border-[#eef0ee] shadow-[0_1px_2px_rgba(16,24,16,0.04)] ${className}`}
  >
    {title && (
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {extra}
      </header>
    )}
    <div className="px-5 pb-5">{children}</div>
  </section>
);

function ActionCard({ href, icon, label, value, tint }) {
  const hot = value > 0;
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-[#eef0ee] p-4 flex items-center gap-4 hover:border-[#cfe6cb] hover:shadow-md transition-all"
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: tint.bg, color: tint.fg }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900 leading-tight">{fmt(value)}</div>
      </div>
      {hot ? (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Cần xử lý
        </span>
      ) : (
        <ArrowRightOutlined className="text-gray-300 group-hover:text-[#319527] transition-colors" />
      )}
    </Link>
  );
}

function StatRow({ href, icon, label, value }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">{icon}</span>
      <span className="flex-1 text-sm text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900 tabular-nums">{fmt(value)}</span>
    </Link>
  );
}

const REPORT_ROWS = [
  ["pending", "Chờ xử lý"],
  ["reviewed", "Đã xem xét"],
  ["resolved", "Đã giải quyết"],
  ["dismissed", "Đã bỏ qua"],
];

const SERIES = {
  users: "người dùng mới",
  topics: "bài viết mới",
  comments: "bình luận mới",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState("users");

  useEffect(() => {
    Promise.all([
      getReportStats()
        .then((res) => setStats(res.data))
        .catch(() => setStats(null)),
      adminGetOverview()
        .then((res) => setOverview(res.data))
        .catch(() => setOverview(null)),
    ]).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const daily = overview?.daily || [];
  const seriesTotal = daily.reduce((s, d) => s + (d[series] || 0), 0);
  const reportTotal = stats?.total || 0;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#319527] to-[#1f6b19] text-white p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-sm text-white/70 capitalize">{today}</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{greeting} 👋</h1>
          <p className="text-white/80 mt-2 max-w-xl">
            {overview
              ? `Có ${fmt(
                  (overview.pending_reports || 0) +
                    (overview.pending_deposits || 0) +
                    (overview.pending_withdrawals || 0) +
                    (overview.pending_orders || 0)
                )} mục đang chờ bạn xử lý.`
              : "Tổng quan hoạt động của Chuyên Biên Hòa Online."}
          </p>
          <Link
            href="/admin/notifications"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-white text-[#1f6b19] text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            <NotificationOutlined /> Gửi thông báo
          </Link>
        </div>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          {/* Needs attention */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <ActionCard href="/admin/reports" icon={<FlagOutlined />} label="Báo cáo chờ xử lý"
              value={overview?.pending_reports ?? stats?.pending} tint={{ bg: "#fef2f2", fg: "#dc2626" }} />
            <ActionCard href="/admin/deposits" icon={<DownloadOutlined />} label="Nạp tiền đang chờ"
              value={overview?.pending_deposits} tint={{ bg: "#eff6ff", fg: "#2563eb" }} />
            <ActionCard href="/admin/withdrawals" icon={<UploadOutlined />} label="Rút tiền chờ duyệt"
              value={overview?.pending_withdrawals} tint={{ bg: "#fff7ed", fg: "#ea580c" }} />
            <ActionCard href="/admin/shop/orders" icon={<ShoppingCartOutlined />} label="Đơn hàng mới"
              value={overview?.pending_orders} tint={{ bg: "#f5f3ff", fg: "#7c3aed" }} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend */}
            <Panel
              className="lg:col-span-2"
              title="Hoạt động 14 ngày qua"
              extra={
                <Segmented
                  size="small"
                  value={series}
                  onChange={setSeries}
                  options={[
                    { value: "users", label: "Người dùng" },
                    { value: "topics", label: "Bài viết" },
                    { value: "comments", label: "Bình luận" },
                  ]}
                />
              }
            >
              {daily.length ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900 tabular-nums">{fmt(seriesTotal)}</span>
                    <span className="text-sm text-gray-500">{SERIES[series]}</span>
                  </div>
                  <TrendChart
                    label={SERIES[series]}
                    data={daily.map((d) => ({ date: d.date, value: d[series] || 0 }))}
                  />
                </>
              ) : (
                <div className="text-sm text-gray-400 py-12 text-center">Chưa có dữ liệu</div>
              )}
            </Panel>

            {/* Totals */}
            <Panel title="Số liệu hệ thống">
              <StatRow href="/admin/users" icon={<UserOutlined />} label="Người dùng" value={overview?.users} />
              <StatRow href="/admin/posts" icon={<FileTextOutlined />} label="Bài viết" value={overview?.topics} />
              <StatRow href="/admin/posts" icon={<EyeInvisibleOutlined />} label="Bài đã ẩn" value={overview?.hidden_topics} />
              <StatRow href="/admin/comments" icon={<CommentOutlined />} label="Bình luận" value={overview?.comments} />
              <StatRow href="/admin/study-materials" icon={<BookOutlined />} label="Tài liệu học tập" value={overview?.study_materials} />
              <StatRow href="/admin/users" icon={<StopOutlined />} label="Tài khoản bị khóa" value={overview?.banned_users} />
            </Panel>
          </div>

          {/* Reports breakdown */}
          {stats && (
            <Panel
              title="Tình trạng báo cáo"
              extra={
                <Link href="/admin/reports" className="text-sm font-medium">
                  Xem tất cả <ArrowRightOutlined />
                </Link>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
                {REPORT_ROWS.map(([key, label]) => {
                  const v = stats[key] || 0;
                  const pct = reportTotal ? Math.round((v / reportTotal) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600">{label}</span>
                        <span className="text-gray-900 font-medium tabular-nums">
                          {fmt(v)} <span className="text-gray-400 font-normal">· {pct}%</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#319527]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
