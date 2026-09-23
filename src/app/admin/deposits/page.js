"use client";

import { Button, Popconfirm, Space, Tag, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, fmtNumber, errMsg, UserLink } from "../_components/ResourceTable";
import {
  adminGetPendingDeposits,
  adminApproveDeposit,
  adminExpireDeposit,
  adminDeleteDeposit,
} from "@/app/Api";

const STATUS = {
  pending: { label: "Chờ thanh toán", color: "orange" },
  completed: { label: "Hoàn tất", color: "green" },
  expired: { label: "Hết hạn / Hủy", color: "default" },
};

export default function AdminDepositsPage() {
  const act = async (fn, reload) => {
    try {
      const res = await fn();
      message.success(res.data?.message || "Thành công");
      reload();
    } catch (err) {
      message.error(errMsg(err, "Thao tác thất bại"));
    }
  };

  const columns = (reload) => [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "Người dùng", key: "user", render: (_, d) => <UserLink user={d.user} userId={d.user_id} /> },
    { title: "Mã nạp", dataIndex: "deposit_code", render: (v) => <code>{v}</code> },
    { title: "Số tiền (VND)", dataIndex: "amount_vnd", render: fmtNumber },
    { title: "Điểm", dataIndex: "expected_points", render: fmtNumber },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s) => <Tag color={STATUS[s]?.color}>{STATUS[s]?.label || s}</Tag>,
    },
    { title: "Hết hạn", dataIndex: "expires_at", render: fmtDate },
    { title: "Ngày tạo", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, d) =>
        // Completed deposits stay on the list: the points they credited are
        // reconciled against this row in the wallet history.
        d.status === "completed" ? null : (
          <Space>
            <Popconfirm
              title="Xác nhận đã nhận tiền?"
              description={`Cộng ${fmtNumber(d.expected_points)} điểm cho ${d.user?.username || "người dùng"}.`}
              okText="Xác nhận"
              cancelText="Hủy"
              onConfirm={() => act(() => adminApproveDeposit(d.id), reload)}
            >
              <Button size="small" type="primary">Duyệt</Button>
            </Popconfirm>
            {d.status === "pending" && (
              <Popconfirm
                title="Hủy yêu cầu nạp này?"
                okText="Hủy yêu cầu"
                okButtonProps={{ danger: true }}
                cancelText="Không"
                onConfirm={() => act(() => adminExpireDeposit(d.id), reload)}
              >
                <Button size="small" danger>Hủy</Button>
              </Popconfirm>
            )}
            <Popconfirm
              title="Xóa yêu cầu nạp này?"
              description="Bản ghi sẽ bị xóa khỏi danh sách, không thể hoàn tác."
              okText="Xóa"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={() => act(() => adminDeleteDeposit(d.id), reload)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <ResourceTable
      title="Yêu cầu nạp tiền"
      fetcher={adminGetPendingDeposits}
      columns={columns}
      defaultFilters={{ status: "pending" }}
      filters={[
        { key: "search", type: "search", placeholder: "Mã nạp, username" },
        {
          key: "status",
          type: "select",
          placeholder: "Trạng thái",
          options: Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label })),
        },
      ]}
    />
  );
}
