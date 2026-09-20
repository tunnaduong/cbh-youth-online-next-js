"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { Table, Input, Select, message } from "antd";

export const fmtDate = (v) => (v ? new Date(v).toLocaleString("vi-VN") : "-");
export const fmtNumber = (v) => (v == null ? "-" : Number(v).toLocaleString("vi-VN"));
// Shop prices are stored in VND; 1.000đ = 10 điểm (PointsService::convertVNDToPoints).
export const vndToPoints = (vnd) => Math.round((Number(vnd) / 1000) * 10);
export const fmtVndPoints = (v) =>
  v == null ? "-" : `${fmtNumber(v)}đ (${fmtNumber(vndToPoints(v))} điểm)`;
export const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

/**
 * Paginated, filterable admin table backed by a Laravel paginator endpoint.
 *
 * filters: [{ key, type: "search" | "select", placeholder, options, width }]
 * columns: antd columns, or a function (reload) => columns
 * The parent can call ref.current.reload() after mutations.
 */
const ResourceTable = forwardRef(function ResourceTable(
  { title, fetcher, columns, filters = [], extra, rowKey = "id", expandable, defaultFilters = {} },
  ref
) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState(defaultFilters);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const load = useCallback(
    async (page = 1, pageSize = pagination.pageSize) => {
      setLoading(true);
      try {
        const params = { page, per_page: pageSize };
        Object.entries(values).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "") params[k] = v;
        });
        const res = await fetcher(params);
        const data = res.data;
        setRows(data?.data || []);
        setPagination({
          current: data?.current_page || 1,
          pageSize: data?.per_page || pageSize,
          total: data?.total || 0,
        });
      } catch (err) {
        message.error(errMsg(err, "Không thể tải dữ liệu"));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetcher, values]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const currentPage = pagination.current;
  const reload = useCallback(() => load(currentPage), [load, currentPage]);
  useImperativeHandle(ref, () => ({ reload }), [reload]);

  const setFilter = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 py-6">
      <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmtNumber(pagination.total)} mục</p>
        </div>
        {extra}
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-[#eef0ee] dark:border-neutral-700 shadow-[0_1px_2px_rgba(16,24,16,0.04)] overflow-hidden">
      {filters.length > 0 && (
        <div className="flex gap-3 p-4 flex-wrap border-b border-[#eef0ee] dark:border-neutral-700">
          {filters.map((f) =>
            f.type === "search" ? (
              <Input.Search
                key={f.key}
                allowClear
                placeholder={f.placeholder || "Tìm kiếm..."}
                style={{ width: f.width || 280 }}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (!e.target.value) setFilter(f.key, "");
                }}
                onSearch={(v) => setFilter(f.key, v.trim())}
              />
            ) : (
              <Select
                key={f.key}
                allowClear
                placeholder={f.placeholder}
                style={{ width: f.width || 180 }}
                value={values[f.key] ?? undefined}
                onChange={(v) => setFilter(f.key, v)}
                options={f.options}
              />
            )
          )}
        </div>
      )}

      <Table
        rowKey={rowKey}
        size="middle"
        loading={loading}
        dataSource={rows}
        columns={typeof columns === "function" ? columns(reload) : columns}
        expandable={expandable}
        scroll={{ x: "max-content" }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (t) => `${t} mục`,
          style: { padding: "0 16px" },
        }}
        onChange={(p) => load(p.current, p.pageSize)}
      />
      </div>
    </div>
  );
});

export default ResourceTable;
