'use client';

import { Button, Empty, Popconfirm, Spin, Tag } from 'antd';
import { Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

const STATUS_CONFIG = {
  pending: { color: 'orange', label: 'Chờ duyệt' },
  approved: { color: 'blue', label: 'Đã duyệt' },
  printing: { color: 'cyan', label: 'Đang in' },
  ready: { color: 'green', label: 'Sẵn sàng' },
  delivered: { color: 'green', label: 'Đã giao' },
  picked_up: { color: 'green', label: 'Đã nhận' },
  cancelled: { color: 'red', label: 'Đã hủy' },
  rejected: { color: 'red', label: 'Bị từ chối' },
};

const DELIVERY_METHOD_LABEL = {
  delivery_to_class: 'Giao tới lớp',
  pickup_at_office: 'Nhận tại VP',
};

export default function PrintRequestList({
  requests,
  loading,
  onCancel,
  page,
  hasMore,
  onPageChange,
}) {
  if (loading) {
    return <Spin />;
  }

  if (!requests || requests.length === 0) {
    return <Empty description="Không có yêu cầu in nào" />;
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const statusConfig = STATUS_CONFIG[request.status] || { color: 'default', label: 'Không xác định' };
        const canCancel = ['pending', 'approved'].includes(request.status);

        return (
          <div
            key={request.id}
            className="border border-gray-200 dark:border-neutral-600 rounded-2xl bg-white dark:bg-neutral-700 p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {request.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  #{request.id} · {dayjs(request.created_at).format('DD/MM/YYYY HH:mm')}
                </p>
              </div>
              <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Số trang</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{request.pages_count} trang</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hình thức</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {DELIVERY_METHOD_LABEL[request.delivery_method]}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Địa chỉ / Lớp</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{request.class_or_location}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Được xử lý bởi</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {request.assigned_staff ? request.assigned_staff.username : 'Chưa gán'}
                </p>
              </div>
            </div>

            {request.description && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mô tả</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{request.description}</p>
              </div>
            )}

            {request.notes && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ghi chú</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{request.notes}</p>
              </div>
            )}

            {request.rejection_reason && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Lý do từ chối</p>
                <p className="text-sm text-red-700 dark:text-red-300">{request.rejection_reason}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-neutral-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {request.ready_at && <p>Sẵn sàng từ: {dayjs(request.ready_at).format('DD/MM/YYYY')}</p>}
                {request.delivered_at && <p>Đã giao: {dayjs(request.delivered_at).format('DD/MM/YYYY')}</p>}
                {request.picked_up_at && <p>Đã nhận: {dayjs(request.picked_up_at).format('DD/MM/YYYY')}</p>}
              </div>
              {canCancel && (
                <Popconfirm
                  title="Hủy yêu cầu in"
                  description="Bạn chắc chắn muốn hủy yêu cầu này?"
                  onConfirm={() => onCancel(request.id)}
                  okText="Hủy"
                  cancelText="Không"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<Trash2 className="h-4 w-4" />}
                  >
                    Hủy
                  </Button>
                </Popconfirm>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button onClick={() => onPageChange(page + 1)}>
            Xem thêm
          </Button>
        </div>
      )}
    </div>
  );
}
