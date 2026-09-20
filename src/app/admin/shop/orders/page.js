"use client";

import { Select, Tag, message } from "antd";
import ResourceTable, { fmtDate, fmtVndPoints, errMsg } from "../../_components/ResourceTable";
import { adminGetShopOrders, adminUpdateShopOrder } from "@/app/Api";

const STATUS = {
  pending: { label: "Chờ xử lý", color: "orange" },
  processing: { label: "Đang chuẩn bị", color: "blue" },
  shipped: { label: "Đang giao", color: "cyan" },
  completed: { label: "Hoàn tất", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};
const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }));

export default function AdminShopOrdersPage() {
  const columns = (reload) => [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "Người đặt", key: "user", render: (_, o) => o.user?.username || `#${o.user_id}` },
    {
      title: "Giao đến",
      key: "shipping",
      render: (_, o) => (
        <div className="max-w-[260px]">
          <div>{o.phone}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{o.shipping_address}</div>
        </div>
      ),
    },
    { title: "Tổng (VND)", dataIndex: "total_amount", render: fmtVndPoints },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, o) =>
        o.status === "cancelled" ? (
          <Tag color="red">Đã hủy</Tag>
        ) : (
          <Select
            size="small"
            style={{ width: 150 }}
            value={o.status}
            options={STATUS_OPTIONS}
            onChange={async (status) => {
              try {
                await adminUpdateShopOrder(o.id, { status });
                message.success("Đã cập nhật đơn hàng");
                reload();
              } catch (err) {
                message.error(errMsg(err, "Cập nhật thất bại"));
              }
            }}
          />
        ),
    },
    { title: "Ngày đặt", dataIndex: "created_at", render: fmtDate },
  ];

  return (
    <ResourceTable
      title="Đơn hàng"
      fetcher={adminGetShopOrders}
      columns={columns}
      filters={[
        { key: "search", type: "search", placeholder: "Username, SĐT, địa chỉ, ID" },
        { key: "status", type: "select", placeholder: "Trạng thái", options: STATUS_OPTIONS },
      ]}
      expandable={{
        expandedRowRender: (o) => (
          <div className="text-sm">
            {(o.items || []).map((it) => (
              <div key={it.id}>
                {it.product?.name || `Sản phẩm #${it.product_id}`}
                {it.variant_label ? ` (${it.variant_label})` : ""} × {it.quantity} — {fmtVndPoints(it.price)}
              </div>
            ))}
            {o.note && <div className="mt-2 text-gray-500 dark:text-gray-400">Ghi chú: {o.note}</div>}
          </div>
        ),
      }}
    />
  );
}
