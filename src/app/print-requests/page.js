'use client';

import { useState, useEffect } from 'react';
import { message } from 'antd';
import { Plus } from 'lucide-react';
import DefaultLayout from '@/layouts/DefaultLayout';
import HomeCard from '@/components/home/HomeCard';
import {
  getPrintRequests,
  cancelPrintRequest,
} from '@/app/Api';
import PrintRequestForm from '@/components/print/PrintRequestForm';
import PrintRequestList from '@/components/print/PrintRequestList';

export default function PrintRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [page]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getPrintRequests({ page, per_page: 10 });
      setRequests(response.data);
      setHasMore(response.current_page < response.last_page);
    } catch (error) {
      message.error('Không thể tải danh sách yêu cầu in.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setPage(1);
    loadRequests();
    message.success('Yêu cầu in đã được gửi thành công!');
  };

  const handleCancel = async (id) => {
    try {
      await cancelPrintRequest(id);
      message.success('Đã hủy yêu cầu in.');
      loadRequests();
    } catch (error) {
      message.error('Không thể hủy yêu cầu in.');
      console.error(error);
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto w-full max-w-[775px] px-3 sm:px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Yêu cầu in tài liệu</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-500 px-4 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            Gửi yêu cầu
          </button>
        </div>

        {showForm && (
          <HomeCard className="mb-6">
            <PrintRequestForm onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
          </HomeCard>
        )}

        <PrintRequestList
          requests={requests}
          loading={loading}
          onCancel={handleCancel}
          page={page}
          hasMore={hasMore}
          onPageChange={setPage}
        />
      </div>
    </DefaultLayout>
  );
}
