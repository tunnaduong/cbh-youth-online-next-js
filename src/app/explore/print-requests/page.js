'use client';

import { useState, useEffect } from 'react';
import { message } from 'antd';
import { Plus } from 'lucide-react';
import HomeLayout from '@/layouts/HomeLayout';
import { HomeCard } from '@/components/home/HomeCard';
import {
  getPrintRequests,
  cancelPrintRequest,
} from '@/app/Api';
import PrintRequestForm from '@/components/print/PrintRequestForm';
import PrintRequestList from '@/components/print/PrintRequestList';
import { EXPLORE_FEATURES } from '@/data/exploreFeatures';
import { isInApp } from '@/utils/appMode';

// Explore sub-page: same sidebar as /explore/universities etc.
const sidebarItems = EXPLORE_FEATURES.map((f) => ({
  key: f.key,
  href: f.href,
  label: f.title,
  Icon: f.sidebarIcon,
  isExternal: false,
}));

export default function PrintRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // null until mounted: in the app's WebView (PrintRequestsScreen) the app
  // draws its own header, so the site's navbar, sidebar and footer are left
  // out. Deciding after mount keeps hydration matching and avoids flashing
  // the navbar before hiding it.
  const [inApp, setInApp] = useState(null);

  useEffect(() => {
    setInApp(isInApp());
  }, []);

  useEffect(() => {
    loadRequests();
  }, [page]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // axios wraps the body: the Laravel paginator is response.data.
      const body = (await getPrintRequests({ page, per_page: 10 })).data;
      const items = body.data || [];
      // "Xem thêm" appends the next page; page 1 replaces the list.
      setRequests((prev) => (page === 1 ? items : [...prev, ...items]));
      setHasMore(body.current_page < body.last_page);
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

  if (inApp === null) return null;

  const content = (
      <div className={`mx-auto w-full max-w-[775px] px-3 sm:px-4 ${inApp ? 'py-4' : 'py-6'}`}>
        <div className={`mb-5 flex justify-between gap-3 ${inApp ? 'items-center' : 'items-start'}`}>
          <div className="min-w-0">
            {/* The app's header already shows the page name. */}
            {!inApp && (
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">In ấn tài liệu</h1>
            )}
            <p className={`text-sm text-gray-500 sm:text-base dark:text-gray-400 ${inApp ? '' : 'mt-1'}`}>
              Gửi tài liệu cần in và nhận tại lớp hoặc văn phòng.
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex h-10 flex-shrink-0 items-center gap-1.5 rounded-xl bg-primary-500 px-4 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-primary-600"
            >
              <Plus className="h-4 w-4" />
              Tạo yêu cầu
            </button>
          )}
        </div>

        {showForm && (
          <HomeCard className="mb-6">
            <PrintRequestForm onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
          </HomeCard>
        )}

        <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Yêu cầu của bạn</h2>
        <PrintRequestList
          requests={requests}
          loading={loading}
          onCancel={handleCancel}
          page={page}
          hasMore={hasMore}
          onPageChange={setPage}
        />
      </div>
  );

  if (inApp) return <main className="min-h-screen">{content}</main>;

  return (
    <HomeLayout
      activeNav="explore"
      activeBar="print"
      sidebarItems={sidebarItems}
      sidebarType="all"
      showRightSidebar={false}
      sidebarWidth="306px"
    >
      {content}
    </HomeLayout>
  );
}
