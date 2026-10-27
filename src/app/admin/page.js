"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Skeleton, Segmented } from "antd";
import {
  ArrowRightOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getReportStats, adminGetOverview } from "@/app/Api";
import TrendChart from "./_components/TrendChart";
import { NAV_GROUPS } from "./AdminShell";

const fmt = (v) => (v == null ? "-" : Number(v).toLocaleString("vi-VN"));

/**
 * What the dashboard shows for each sidebar item, keyed by its route.
 * `pending` = the count that needs an admin (shown as a "Cần xử lý" badge);
 * `total` = a plain figure with its caption. Both read from /admin/overview.
 */
const ITEM_META = {
  "/admin/posts": { total: "topics", caption: "bài viết", sub: (o) => `${fmt(o.hidden_topics)} đã ẩn` },
  "/admin/comments": { total: "comments", caption: "bình luận" },
  "/admin/reports": { pending: "pending_reports", caption: "chờ xử lý" },
  "/admin/violations": { pending: "pending_violations", caption: "chờ xử lý" },
  "/admin/moderation": { pending: "pending_moderation", caption: "chờ duyệt" },
  "/admin/feedback": { pending: "new_feedback", caption: "góp ý mới" },
  "/admin/study-materials": { total: "study_materials", caption: "tài liệu" },
  "/admin/users": { total: "users", caption: "người dùng", sub: (o) => `${fmt(o.banned_users)} bị khóa` },
  "/admin/messages": { total: "messages_today", caption: "tin nhắn hôm nay", sub: (o) => `${fmt(o.conversations)} cuộc trò chuyện` },
  "/admin/notifications": { total: "broadcasts", caption: "thông báo đã gửi" },
  "/admin/deposits": { pending: "pending_deposits", caption: "chờ xác nhận" },
  "/admin/withdrawals": { pending: "pending_withdrawals", caption: "chờ duyệt" },
  "/admin/audit-logs": { total: "audit_logs_today", caption: "thay đổi hôm nay" },
  "/admin/shop/orders": { pending: "pending_orders", caption: "đơn mới" },
  "/admin/shop/products": { total: "shop_products", caption: "sản phẩm" },
  "/admin/shop/categories": { total: "shop_categories", caption: "danh mục" },
  "/admin/student-verifications": { pending: "pending_student_verifications", caption: "chờ xác minh" },
};

const SECTIONS = NAV_GROUPS.filter((g) => g.children);

const Panel = ({ title, extra, children, className = "" }) => (
  <section
    className={`rounded-2xl border border-[#eef0ee] bg-white shadow-[0_1px_2px_rgba(16,24,16,0.04)] dark:border-neutral-700 dark:bg-neutral-800 ${className}`}
  >
    {title && (
      <header className="flex flex-wrap items-center justify-between gap-2 px-5 pb-2 pt-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        {extra}
      </header>
    )}
    <div className="px-5 pb-5">{children}</div>
  </section>
);

function ItemCard({ item, overview }) {
  const meta = ITEM_META[item.key] || {};
  const o = overview || {};
  const isPending = Boolean(meta.pending);
  const value = isPending ? o[meta.pending] : meta.total ? o[meta.total] : null;
  const hot = isPending && value > 0;
  const sub = meta.sub ? meta.sub(o) : null;

  return (
    <Link
      href={item.key}
      className={`group flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
        hot
          ? "border-amber-200 bg-amber-50/60 hover:bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
          : "border-gray-100 bg-gray-50/60 hover:border-primary-200 hover:bg-primary-50 dark:border-neutral-700 dark:bg-neutral-800/60 dark:hover:border-neutral-500 dark:hover:bg-neutral-700"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
          hot
            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
            : "bg-white text-primary-500 shadow-sm dark:bg-neutral-700 dark:text-[#6bcf60]"
        }`}
      >
        {item.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
        <div className="truncate text-xs text-gray-500 dark:text-gray-400">
          {value == null ? (
            "Mở trang"
          ) : (
            <>
              <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-200">{fmt(value)}</span> {meta.caption}
              {sub ? <span className="text-gray-400 dark:text-neutral-500"> · {sub}</span> : null}
            </>
          )}
        </div>
      </div>
      {hot ? (
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
          Cần xử lý
        </span>
      ) : (
        <ArrowRightOutlined className="shrink-0 text-gray-300 transition-colors group-hover:text-primary-500 dark:text-neutral-600 dark:group-hover:text-[#6bcf60]" />
      )}
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
  const [refreshing, setRefreshing] = useState(false);
  const [series, setSeries] = useState("users");
  // Set on the client so the server render has nothing time-dependent.
  const [now, setNow] = useState(null);

  const load = () =>
    Promise.all([
      getReportStats()
        .then((res) => setStats(res.data))
        .catch(() => setStats(null)),
      adminGetOverview()
        .then((res) => setOverview(res.data))
        .catch(() => setOverview(null)),
    ]);

  useEffect(() => {
    setNow(new Date());
    load().finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setRefreshing(true);
    load().finally(() => {
      setRefreshing(false);
      setNow(new Date());
    });
  };

  const hour = now ? now.getHours() : 12;
  const greeting = hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const today = now ? now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";

  const daily = overview?.daily || [];
  const seriesTotal = daily.reduce((s, d) => s + (d[series] || 0), 0);
  const reportTotal = stats?.total || 0;

  // Every sidebar item with something waiting, for the hero and the queue list.
  const pendingItems = useMemo(() => {
    if (!overview) return [];
    return SECTIONS.flatMap((g) => g.children)
      .map((item) => ({ ...item, meta: ITEM_META[item.key] }))
      .filter((it) => it.meta?.pending && overview[it.meta.pending] > 0)
      .map((it) => ({ ...it, count: overview[it.meta.pending] }));
  }, [overview]);
  const pendingTotal = pendingItems.reduce((s, it) => s + it.count, 0);

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-[#1f6b19] p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm capitalize text-white/70">{today || " "}</div>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{greeting} 👋</h1>
            <p className="mt-2 max-w-xl text-white/80">
              {loading
                ? "Đang tải tổng quan..."
                : overview
                  ? pendingTotal > 0
                    ? `Có ${fmt(pendingTotal)} mục ở ${pendingItems.length} khu vực đang chờ bạn xử lý.`
                    : "Không có mục nào đang chờ xử lý. Mọi thứ đều ổn!"
                  : "Không tải được tổng quan. Hãy tải lại trang."}
            </p>
          </div>
          {/* White on the green hero in both themes, so it's styled by hand. */}
          <button
            type="button"
            onClick={refresh}
            disabled={loading || refreshing}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#1f6b19] transition-colors hover:bg-white/90 disabled:opacity-70"
          >
            <ReloadOutlined className={refreshing ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          {/* Queue: everything waiting, across all sections */}
          <Panel
            title="Cần xử lý"
            extra={
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {pendingItems.length ? `${pendingItems.length} khu vực` : null}
              </span>
            }
          >
            {pendingItems.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pendingItems.map((it) => (
                  <ItemCard key={it.key} item={it} overview={overview} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-6 text-sm text-gray-500 dark:text-neutral-400">
                <CheckCircleOutlined className="text-xl text-primary-500 dark:text-[#6bcf60]" />
                {overview ? "Không có mục nào đang chờ. Bạn đã xử lý hết!" : "Không tải được số liệu. Hãy tải lại trang."}
              </div>
            )}
          </Panel>

          {/* One section per sidebar group */}
          {SECTIONS.map((group) => (
            <Panel
              key={group.label}
              title={group.label.charAt(0) + group.label.slice(1).toLowerCase()}
              extra={
                <span className="text-xs text-gray-500 dark:text-gray-400">{group.children.length} mục</span>
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.children.map((item) => (
                  <ItemCard key={item.key} item={item} overview={overview} />
                ))}
              </div>
            </Panel>
          ))}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{fmt(seriesTotal)}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{SERIES[series]}</span>
                  </div>
                  <TrendChart
                    label={SERIES[series]}
                    data={daily.map((d) => ({ date: d.date, value: d[series] || 0 }))}
                  />
                </>
              ) : (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-neutral-400">Chưa có dữ liệu</div>
              )}
            </Panel>

            {/* Reports breakdown */}
            <Panel
              title="Tình trạng báo cáo"
              extra={
                <Link href="/admin/reports" className="text-sm font-medium">
                  Xem tất cả <ArrowRightOutlined />
                </Link>
              }
            >
              {stats ? (
                <div className="space-y-3">
                  {REPORT_ROWS.map(([key, label]) => {
                    const v = stats[key] || 0;
                    const pct = reportTotal ? Math.round((v / reportTotal) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">{label}</span>
                          <span className="font-medium tabular-nums text-gray-900 dark:text-white">
                            {fmt(v)} <span className="font-normal text-gray-400 dark:text-neutral-500">· {pct}%</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-700">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">Tổng cộng {fmt(reportTotal)} báo cáo</div>
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-gray-500 dark:text-neutral-400">Không tải được số liệu báo cáo.</div>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
