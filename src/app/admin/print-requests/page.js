'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button, Popconfirm, Space, Tag, message } from 'antd';
import { Printer, Trash2 } from 'lucide-react';
import ResourceTable, { fmtDate, errMsg, UserLink } from '../_components/ResourceTable';
import { adminGetPrintRequests, adminDeletePrintRequest } from '@/app/Api';
import {
  STATUS_CONFIG,
  DELIVERY_METHOD_LABEL,
  fileExtension,
  formatFileSize,
} from './_shared';

// Module level so ResourceTable's load callback stays stable.
const fetcher = (params) => adminGetPrintRequests(params);

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, c]) => ({
  value,
  label: c.label,
}));

export default function AdminPrintRequestsPage() {
  const tableRef = useRef(null);

  const handleDelete = async (id) => {
    try {
      await adminDeletePrintRequest(id);
      message.success('Đã xóa yêu cầu in.');
      tableRef.current?.reload();
    } catch (err) {
      message.error(errMsg(err, 'Không thể xóa yêu cầu in.'));
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      render: (id) => <span className="font-medium text-gray-500 dark:text-gray-400">#{id}</span>,
    },
    {
      title: 'Tài liệu',
      key: 'document',
      render: (_, r) => {
        const ext = fileExtension(r.file);
        return (
          <Link href={`/admin/print-requests/${r.id}`} className="block max-w-[280px]">
            <span className="block truncate font-medium text-gray-900 dark:text-gray-100">{r.title}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              {ext && (
                <span className="rounded bg-gray-100 px-1.5 py-px font-semibold uppercase text-gray-600 dark:bg-neutral-700 dark:text-neutral-300">
                  {ext}
                </span>
              )}
              <span>{r.pages_count} trang</span>
              {r.file?.file_size ? <span>· {formatFileSize(r.file.file_size)}</span> : null}
            </span>
          </Link>
        );
      },
    },
    {
      title: 'Người gửi',
      key: 'user',
      render: (_, r) => <UserLink user={r.user} userId={r.user_id} />,
    },
    {
      title: 'Nhận tại',
      key: 'delivery',
      render: (_, r) => (
        <div className="max-w-[200px]">
          <div className="truncate text-gray-900 dark:text-gray-100">{r.class_or_location || '-'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {DELIVERY_METHOD_LABEL[r.delivery_method] || '-'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s) => {
        const c = STATUS_CONFIG[s] || { color: 'default', label: s };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'created_at',
      render: (v) => <span className="whitespace-nowrap">{fmtDate(v)}</span>,
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Link href={`/admin/print-requests/${r.id}`}>
            <Button type="primary" size="small" icon={<Printer className="h-3.5 w-3.5" />}>
              Xem & in
            </Button>
          </Link>
          <Popconfirm
            title="Xóa yêu cầu in này?"
            description="Người gửi sẽ không thấy yêu cầu này nữa."
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={() => handleDelete(r.id)}
          >
            <Button size="small" danger type="text" aria-label="Xóa" icon={<Trash2 className="h-3.5 w-3.5" />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ResourceTable
      ref={tableRef}
      title="Yêu cầu in tài liệu"
      fetcher={fetcher}
      columns={columns}
      filters={[
        { key: 'search', type: 'search', placeholder: 'Tên người gửi, tiêu đề' },
        { key: 'status', type: 'select', placeholder: 'Trạng thái', options: STATUS_OPTIONS },
      ]}
    />
  );
}
