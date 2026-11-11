'use client';

import { Button, Popconfirm } from 'antd';
import { FileText, Printer, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

// Chip colours: neutral / waiting / in progress / done / stopped.
const CHIP = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-neutral-600 dark:text-neutral-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const STATUS_CONFIG = {
  pending: { tone: 'amber', label: 'Chờ duyệt' },
  approved: { tone: 'blue', label: 'Đã duyệt' },
  printing: { tone: 'blue', label: 'Đang in' },
  ready: { tone: 'green', label: 'Sẵn sàng' },
  delivered: { tone: 'green', label: 'Đã giao' },
  picked_up: { tone: 'green', label: 'Đã nhận' },
  cancelled: { tone: 'neutral', label: 'Đã hủy' },
  rejected: { tone: 'red', label: 'Bị từ chối' },
};

const DELIVERY_METHOD_LABEL = {
  delivery_to_class: 'Giao tới lớp',
  pickup_at_office: 'Nhận tại văn phòng',
};

const CARD =
  'rounded-2xl border border-[#EBEFEA] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.04)] dark:border-neutral-600 dark:!bg-[var(--main-white)]';

function Detail({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-white">{children}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={`${CARD} animate-pulse p-4 sm:p-5`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-neutral-600" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/2 rounded bg-gray-200 dark:bg-neutral-600" />
          <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-neutral-600" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-8 rounded bg-gray-200 dark:bg-neutral-600" />
        <div className="h-8 rounded bg-gray-200 dark:bg-neutral-600" />
      </div>
    </div>
  );
}

export default function PrintRequestList({
  requests,
  loading,
  onCancel,
  page,
  hasMore,
  onPageChange,
}) {
  if (loading && (!requests || requests.length === 0)) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className={`${CARD} flex flex-col items-center px-4 py-10 text-center`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-600">
          <Printer className="h-6 w-6 text-gray-400 dark:text-neutral-400" />
        </div>
        <p className="mt-3 text-sm text-gray-500 dark:text-neutral-400">Bạn chưa có yêu cầu in nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const status = STATUS_CONFIG[request.status] || { tone: 'neutral', label: 'Không xác định' };
        const canCancel = ['pending', 'approved'].includes(request.status);
        const milestones = [
          request.ready_at && `Sẵn sàng ${dayjs(request.ready_at).format('HH:mm DD/MM')}`,
          request.delivered_at && `Đã giao ${dayjs(request.delivered_at).format('HH:mm DD/MM')}`,
          request.picked_up_at && `Đã nhận ${dayjs(request.picked_up_at).format('HH:mm DD/MM')}`,
        ].filter(Boolean);

        return (
          <article key={request.id} className={`${CARD} p-4 sm:p-5`}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-[#2b3a2a]">
                <FileText className="h-5 w-5 text-primary-500 dark:text-[#6bcf60]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-semibold text-gray-900 dark:text-white">
                  {request.title}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  #{request.id} · {dayjs(request.created_at).format('HH:mm DD/MM/YYYY')}
                </p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${CHIP[status.tone]}`}
              >
                {status.label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-gray-50 p-3 dark:bg-neutral-800">
              <Detail label="Số trang">{request.pages_count} trang</Detail>
              <Detail label="Hình thức">{DELIVERY_METHOD_LABEL[request.delivery_method] || '—'}</Detail>
              <Detail label={request.delivery_method === 'pickup_at_office' ? 'Nơi nhận' : 'Lớp nhận'}>
                {request.class_or_location || '—'}
              </Detail>
              <Detail label="Người xử lý">
                {request.assigned_staff ? request.assigned_staff.username : 'Chưa có'}
              </Detail>
            </div>

            {request.description && (
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Mô tả: </span>
                {request.description}
              </p>
            )}

            {request.notes && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Yêu cầu khi in: </span>
                {request.notes}
              </p>
            )}

            {request.rejection_reason && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">Lý do từ chối</p>
                <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">{request.rejection_reason}</p>
              </div>
            )}

            {(milestones.length > 0 || canCancel) && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-neutral-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">{milestones.join(' · ')}</p>
                {canCancel && (
                  <Popconfirm
                    title="Hủy yêu cầu in"
                    description="Bạn chắc chắn muốn hủy yêu cầu này?"
                    onConfirm={() => onCancel(request.id)}
                    okText="Hủy yêu cầu"
                    cancelText="Không"
                  >
                    <Button type="text" danger size="small" icon={<Trash2 className="h-4 w-4" />}>
                      Hủy yêu cầu
                    </Button>
                  </Popconfirm>
                )}
              </div>
            )}
          </article>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={loading}
          className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-primary-500 transition hover:bg-primary-50 disabled:opacity-60 dark:border-neutral-600 dark:text-[#6bcf60] dark:hover:bg-[#2b3a2a]"
        >
          {loading ? 'Đang tải...' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}
