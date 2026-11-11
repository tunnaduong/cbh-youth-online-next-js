'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Tag, Input, Select, Space, Modal, message, Popconfirm, Select as AntSelect } from 'antd';
import { Plus, Trash2, Check, X } from 'lucide-react';
import dayjs from 'dayjs';
import {
  adminGetPrintRequests,
  adminUpdatePrintRequestStatus,
  adminDeletePrintRequest,
  adminAssignPrintRequest,
  getCurrentUser,
} from '@/app/Api';

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

const STATUS_TRANSITIONS = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['printing', 'cancelled'],
  printing: ['ready', 'cancelled'],
  ready: ['delivered', 'picked_up', 'cancelled'],
  delivered: [],
  picked_up: [],
  cancelled: [],
  rejected: [],
};

export default function AdminPrintRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
    loadRequests();
  }, [pagination, statusFilter, searchText]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        per_page: pagination.pageSize,
      };
      if (statusFilter) params.status = statusFilter;
      if (searchText) params.search = searchText;

      const response = await adminGetPrintRequests(params);
      setRequests(response.data);
      setPagination({
        ...pagination,
        total: response.total,
      });
    } catch (error) {
      message.error('Không thể tải danh sách yêu cầu in.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, notes = '') => {
    try {
      await adminUpdatePrintRequestStatus(id, { status: newStatus, notes });
      message.success('Đã cập nhật trạng thái.');
      loadRequests();
      setIsDetailModalOpen(false);
    } catch (error) {
      message.error('Không thể cập nhật trạng thái.');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminDeletePrintRequest(id);
      message.success('Đã xóa yêu cầu in.');
      loadRequests();
    } catch (error) {
      message.error('Không thể xóa yêu cầu in.');
      console.error(error);
    }
  };

  const handleAssign = async (id, staffId) => {
    try {
      await adminAssignPrintRequest(id, { assigned_staff_id: staffId });
      message.success('Đã gán người xử lý.');
      loadRequests();
    } catch (error) {
      message.error('Không thể gán người xử lý.');
      console.error(error);
    }
  };

  const showDetailModal = (request) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      render: (id) => <span className="font-medium">#{id}</span>,
    },
    {
      title: 'Người yêu cầu',
      dataIndex: ['user', 'username'],
      width: 150,
      render: (username) => <span>{username || 'N/A'}</span>,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      render: (title) => <span className="line-clamp-2">{title}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (status) => {
        const config = STATUS_CONFIG[status] || { color: 'default', label: 'N/A' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Số trang',
      dataIndex: 'pages_count',
      width: 80,
      render: (count) => <span>{count} trang</span>,
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'created_at',
      width: 150,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            onClick={() => showDetailModal(record)}
          >
            Chi tiết
          </Button>
          <Popconfirm
            title="Xóa yêu cầu"
            description="Bạn chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger size="small" icon={<Trash2 className="h-4 w-4" />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input.Search
          placeholder="Tìm kiếm theo tên người dùng, tiêu đề..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPagination({ ...pagination, current: 1 });
          }}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Lọc theo trạng thái"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPagination({ ...pagination, current: 1 });
          }}
          options={[
            { label: 'Tất cả', value: null },
            ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
              label: config.label,
              value: key,
            })),
          ]}
          style={{ width: 200 }}
          allowClear
        />
      </div>

      <Table
        columns={columns}
        dataSource={requests}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize });
          },
        }}
        scroll={{ x: 'max-content' }}
        rowKey="id"
      />

      <Modal
        title={`Yêu cầu in #${selectedRequest?.id}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Người yêu cầu</p>
                <p className="font-medium">{selectedRequest.user?.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trạng thái</p>
                <Tag color={STATUS_CONFIG[selectedRequest.status].color}>
                  {STATUS_CONFIG[selectedRequest.status].label}
                </Tag>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Số trang</p>
                <p className="font-medium">{selectedRequest.pages_count}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ngày gửi</p>
                <p className="font-medium">{dayjs(selectedRequest.created_at).format('DD/MM/YYYY HH:mm')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Giao tới</p>
                <p className="font-medium">{selectedRequest.class_or_location}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Được xử lý bởi</p>
                <p className="font-medium">{selectedRequest.assigned_staff?.username || 'Chưa gán'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Tiêu đề</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedRequest.title}</p>
            </div>

            {selectedRequest.description && (
              <div>
                <p className="text-sm font-medium mb-2">Mô tả</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedRequest.description}</p>
              </div>
            )}

            {selectedRequest.notes && (
              <div>
                <p className="text-sm font-medium mb-2">Ghi chú của người dùng</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedRequest.notes}</p>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-neutral-600 pt-4">
              <p className="text-sm font-medium mb-3">Cập nhật trạng thái</p>
              <Space wrap>
                {STATUS_TRANSITIONS[selectedRequest.status].map((newStatus) => (
                  <Button
                    key={newStatus}
                    type="primary"
                    onClick={() => handleStatusChange(selectedRequest.id, newStatus)}
                  >
                    {STATUS_CONFIG[newStatus].label}
                  </Button>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
