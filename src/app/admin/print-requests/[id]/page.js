'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, Modal, Popconfirm, Skeleton, Tag, message } from 'antd';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  FileWarning,
  Printer,
  Trash2,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  adminGetPrintRequest,
  adminGetPrintRequestFile,
  adminUpdatePrintRequestStatus,
  adminDeletePrintRequest,
} from '@/app/Api';
import { errMsg } from '../../_components/ResourceTable';
import {
  STATUS_CONFIG,
  STATUS_TRANSITIONS,
  ACTION_LABEL,
  DELIVERY_METHOD_LABEL,
  CARD,
  fileKind,
  fileExtension,
  formatFileSize,
  publicFileUrl,
} from '../_shared';

const fmt = (v) => (v ? dayjs(v).format('HH:mm DD/MM/YYYY') : null);

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-right text-sm font-medium text-gray-900 dark:text-gray-100">
        {children}
      </span>
    </div>
  );
}

function Timeline({ request }) {
  // Last step follows what actually happened, or else how the user asked to receive it.
  const pickedUp = request.picked_up_at || (!request.delivered_at && request.delivery_method === 'pickup_at_office');
  const finished = pickedUp
    ? { label: 'Đã nhận tại văn phòng', at: request.picked_up_at }
    : { label: 'Đã giao tới lớp', at: request.delivered_at };
  const steps = [
    { label: 'Gửi yêu cầu', at: request.created_at },
    { label: 'Duyệt', at: request.approved_at },
    { label: 'Bắt đầu in', at: request.printing_started_at },
    { label: 'In xong, sẵn sàng', at: request.ready_at },
    finished,
  ];
  const stopped = request.status === 'cancelled' || request.status === 'rejected';

  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const done = !!s.at;
        return (
          <li key={i} className="flex items-start gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                done ? 'bg-primary-500' : 'bg-gray-200 dark:bg-neutral-600'
              }`}
            />
            <div className="min-w-0">
              <p className={`text-sm ${done ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-neutral-500'}`}>
                {s.label}
              </p>
              {done && <p className="text-xs text-gray-500 dark:text-gray-400">{fmt(s.at)}</p>}
            </div>
          </li>
        );
      })}
      {stopped && (
        <li className="flex items-start gap-3">
          <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {STATUS_CONFIG[request.status].label}
          </p>
        </li>
      )}
    </ol>
  );
}

export default function AdminPrintRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const frameRef = useRef(null);

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [fileState, setFileState] = useState('idle'); // idle | loading | ready | error
  const [busyStatus, setBusyStatus] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const kind = fileKind(request?.file);
  const fileName = request?.file?.file_name || `tai-lieu-${id}.${fileExtension(request?.file) || 'pdf'}`;

  const loadRequest = useCallback(async () => {
    try {
      const res = await adminGetPrintRequest(id);
      setRequest(res.data);
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true);
      else message.error(errMsg(err, 'Không thể tải yêu cầu in.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  // PDFs and pictures are fetched as a Blob: an object URL is same-origin, so
  // the preview frame can be printed directly. (The /storage link is on the
  // API's host, and a cross-origin frame can't be told to print.)
  const fileId = request?.file?.id;
  useEffect(() => {
    if (!fileId || (kind !== 'pdf' && kind !== 'image')) return undefined;
    let url = null;
    let cancelled = false;
    setFileState('loading');
    adminGetPrintRequestFile(id)
      .then((res) => {
        if (cancelled) return;
        const type = kind === 'pdf' ? 'application/pdf' : res.data.type || request?.file?.file_type || 'image/png';
        url = URL.createObjectURL(new Blob([res.data], { type }));
        setBlobUrl(url);
        setFileState('ready');
      })
      .catch(() => !cancelled && setFileState('error'));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fileId, kind]);

  const changeStatus = async (status, extra = {}) => {
    setBusyStatus(status);
    try {
      await adminUpdatePrintRequestStatus(request.id, { status, ...extra });
      message.success(`Đã chuyển sang "${STATUS_CONFIG[status].label}".`);
      await loadRequest();
      return true;
    } catch (err) {
      message.error(errMsg(err, 'Không thể cập nhật trạng thái.'));
      return false;
    } finally {
      setBusyStatus(null);
    }
  };

  // After printing an approved request, offer to mark it as being printed.
  const offerPrinting = () => {
    if (request?.status !== 'approved') return;
    Modal.confirm({
      title: 'Chuyển sang "Đang in"?',
      content: 'Người gửi sẽ thấy tài liệu của họ đang được in.',
      okText: 'Chuyển',
      cancelText: 'Để sau',
      onOk: () => changeStatus('printing'),
    });
  };

  const printImage = () => {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    frame.srcdoc = `<!doctype html><html><head><style>@page{margin:10mm}html,body{margin:0}img{display:block;max-width:100%;max-height:100vh;margin:0 auto}</style></head><body><img src="${blobUrl}"></body></html>`;
    frame.onload = () => {
      const img = frame.contentDocument.querySelector('img');
      const go = () => {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        setTimeout(() => frame.remove(), 1000);
      };
      if (img.complete) go();
      else img.onload = go;
    };
    document.body.appendChild(frame);
  };

  const handlePrint = () => {
    try {
      if (kind === 'pdf') {
        if (!blobUrl) return;
        const win = frameRef.current?.contentWindow;
        win.focus();
        win.print();
      } else if (kind === 'image') {
        if (!blobUrl) return;
        printImage();
      } else if (kind === 'office') {
        window.open(
          `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(publicFileUrl(request.file))}`,
          '_blank',
          'noopener'
        );
        message.info('Bấm "In" trong trình xem Office vừa mở để in tài liệu.');
      } else {
        handleDownload();
        message.info('Tệp này không xem trước được, hãy mở bằng ứng dụng trên máy để in.');
      }
      offerPrinting();
    } catch {
      // Some browsers refuse to print a frame (e.g. in the app's WebView):
      // open the file so it can be printed from the browser itself.
      if (blobUrl) window.open(blobUrl, '_blank');
      message.info('Trình duyệt không cho in trực tiếp, hãy in từ tab vừa mở.');
    }
  };

  const handleDownload = async () => {
    try {
      let url = blobUrl;
      let temporary = false;
      if (!url) {
        const res = await adminGetPrintRequestFile(id);
        url = URL.createObjectURL(res.data);
        temporary = true;
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (temporary) setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      message.error(errMsg(err, 'Không thể tải tệp về.'));
    }
  };

  const handleOpenNewTab = () => {
    if (kind === 'office') {
      window.open(
        `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(publicFileUrl(request.file))}`,
        '_blank',
        'noopener'
      );
    } else if (blobUrl) {
      window.open(blobUrl, '_blank');
    } else {
      window.open(publicFileUrl(request.file), '_blank', 'noopener');
    }
  };

  const handleDelete = async () => {
    try {
      await adminDeletePrintRequest(request.id);
      message.success('Đã xóa yêu cầu in.');
      router.push('/admin/print-requests');
    } catch (err) {
      message.error(errMsg(err, 'Không thể xóa yêu cầu in.'));
    }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      message.error('Hãy nhập lý do từ chối để người gửi biết cần sửa gì.');
      return;
    }
    const ok = await changeStatus('rejected', { rejection_reason: rejectReason.trim() });
    if (ok) {
      setRejectOpen(false);
      setRejectReason('');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">
        <Skeleton active paragraph={{ rows: 2 }} />
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className={`${CARD} h-[60vh] animate-pulse`} />
          <div className={`${CARD} h-[60vh] animate-pulse`} />
        </div>
      </div>
    );
  }

  if (notFound || !request) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-gray-500 dark:text-neutral-400">
          {notFound ? 'Yêu cầu in này không tồn tại hoặc đã bị xóa.' : 'Không thể tải yêu cầu in. Hãy tải lại trang.'}
        </p>
        <Link href="/admin/print-requests" className="mt-3 inline-block text-sm font-medium text-primary-500 dark:text-[#6bcf60]">
          Về danh sách yêu cầu in
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[request.status] || { color: 'default', label: request.status };
  const transitions = STATUS_TRANSITIONS[request.status] || [];
  // Moving forward is the main action; reject / cancel stop the request.
  const forward = transitions.filter((s) => s !== 'rejected' && s !== 'cancelled');
  const isClass = request.delivery_method === 'delivery_to_class';
  const canPrint = kind === 'office' || kind === 'other' || (fileState === 'ready' && !!blobUrl);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] px-4 py-6 sm:px-6">
      {/* Header */}
      <Link
        href="/admin/print-requests"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Yêu cầu in tài liệu
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {request.title}
            </h1>
            <Tag color={status.color} className="!m-0">
              {status.label}
            </Tag>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            #{request.id} · gửi lúc {fmt(request.created_at)}
            {request.user?.username ? (
              <>
                {' '}bởi{' '}
                <a href={`/${request.user.username}`} target="_blank" rel="noreferrer" className="font-medium">
                  {request.user.username}
                </a>
              </>
            ) : null}
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<Printer className="h-4 w-4" />}
          onClick={handlePrint}
          disabled={!request.file || !canPrint}
          loading={fileState === 'loading'}
        >
          In tài liệu
        </Button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Preview */}
        <section className={`${CARD} flex min-w-0 flex-col overflow-hidden`}>
          <div className="flex flex-wrap items-center gap-3 border-b border-[#eef0ee] px-4 py-3 dark:border-neutral-700">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-[#2b3a2a]">
              <FileText className="h-[18px] w-[18px] text-primary-500 dark:text-[#6bcf60]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {request.file?.file_name || 'Không có tệp'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {[fileExtension(request.file).toUpperCase(), formatFileSize(request.file?.file_size), `${request.pages_count} trang`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            {request.file && (
              <div className="flex flex-shrink-0 gap-1">
                <Button icon={<ExternalLink className="h-4 w-4" />} onClick={handleOpenNewTab}>
                  <span className="hidden sm:inline">Mở tab mới</span>
                </Button>
                <Button icon={<Download className="h-4 w-4" />} onClick={handleDownload}>
                  <span className="hidden sm:inline">Tải về</span>
                </Button>
              </div>
            )}
          </div>

          <div className="relative h-[70vh] min-h-[420px] flex-1 bg-gray-100 lg:h-auto lg:min-h-[70vh] dark:bg-neutral-900">
            {!request.file ? (
              <PreviewMessage icon={FileWarning} text="Yêu cầu này không có tệp đính kèm." />
            ) : kind === 'office' ? (
              <iframe
                title="Xem trước tài liệu"
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicFileUrl(request.file))}`}
                className="h-full w-full border-0"
              />
            ) : kind === 'other' ? (
              <PreviewMessage
                icon={FileWarning}
                text="Không xem trước được loại tệp này. Hãy tải về để mở và in."
              />
            ) : fileState === 'error' ? (
              <PreviewMessage icon={FileWarning} text="Không tải được tệp. Có thể tệp đã bị xóa khỏi máy chủ." />
            ) : fileState !== 'ready' ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Đang tải tài liệu...
              </div>
            ) : kind === 'pdf' ? (
              <iframe ref={frameRef} title="Xem trước tài liệu" src={blobUrl} className="h-full w-full border-0" />
            ) : (
              <div className="flex h-full items-center justify-center overflow-auto p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={blobUrl} alt={request.title} className="max-h-full max-w-full object-contain shadow-sm" />
              </div>
            )}
          </div>
        </section>

        {/* Side panel */}
        <aside className="flex min-w-0 flex-col gap-5">
          {transitions.length > 0 && (
            <section className={`${CARD} p-4`}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Xử lý yêu cầu</h2>
              <div className="mt-3 flex flex-col gap-2">
                {forward.map((s) => {
                  // Of delivered / picked_up, the one matching how the user asked to receive it is the main one.
                  const primary =
                    forward.length === 1 ||
                    (s === 'delivered' && isClass) ||
                    (s === 'picked_up' && !isClass);
                  return (
                    <Button
                      key={s}
                      type={primary ? 'primary' : 'default'}
                      block
                      loading={busyStatus === s}
                      disabled={!!busyStatus && busyStatus !== s}
                      onClick={() => changeStatus(s)}
                    >
                      {ACTION_LABEL[s]}
                    </Button>
                  );
                })}
                <div className="flex gap-2">
                  {transitions.includes('rejected') && (
                    <Button danger block disabled={!!busyStatus} onClick={() => setRejectOpen(true)}>
                      Từ chối
                    </Button>
                  )}
                  {transitions.includes('cancelled') && (
                    <Popconfirm
                      title="Hủy yêu cầu in này?"
                      okText="Hủy yêu cầu"
                      okButtonProps={{ danger: true }}
                      cancelText="Không"
                      onConfirm={() => changeStatus('cancelled')}
                    >
                      <Button block disabled={!!busyStatus} loading={busyStatus === 'cancelled'}>
                        Hủy yêu cầu
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className={`${CARD} p-4`}>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Thông tin</h2>
            <div className="mt-1 divide-y divide-gray-100 dark:divide-neutral-700">
              <InfoRow label="Số trang">{request.pages_count} trang</InfoRow>
              <InfoRow label="Hình thức">{DELIVERY_METHOD_LABEL[request.delivery_method] || '-'}</InfoRow>
              <InfoRow label={isClass ? 'Lớp nhận' : 'Nơi nhận'}>{request.class_or_location || '-'}</InfoRow>
              <InfoRow label="Người xử lý">{request.assigned_staff?.username || 'Chưa có'}</InfoRow>
            </div>
            {request.notes && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-900/20">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Yêu cầu khi in</p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-gray-900 dark:text-gray-100">{request.notes}</p>
              </div>
            )}
            {request.description && (
              <div className="mt-3 rounded-xl bg-gray-50 p-3 dark:bg-neutral-900">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Mô tả</p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{request.description}</p>
              </div>
            )}
            {request.rejection_reason && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-900/20">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">Lý do từ chối</p>
                <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">{request.rejection_reason}</p>
              </div>
            )}
          </section>

          <section className={`${CARD} p-4`}>
            <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Tiến trình</h2>
            <Timeline request={request} />
          </section>

          <Popconfirm
            title="Xóa yêu cầu in này?"
            description="Người gửi sẽ không thấy yêu cầu này nữa."
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={handleDelete}
          >
            <Button type="text" danger icon={<Trash2 className="h-4 w-4" />} className="self-start">
              Xóa yêu cầu
            </Button>
          </Popconfirm>
        </aside>
      </div>

      <Modal
        open={rejectOpen}
        title="Từ chối yêu cầu in"
        okText="Từ chối"
        okButtonProps={{ danger: true, loading: busyStatus === 'rejected' }}
        cancelText="Hủy"
        onOk={submitReject}
        onCancel={() => busyStatus !== 'rejected' && setRejectOpen(false)}
        destroyOnClose
      >
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="reject-reason">
          Lý do (người gửi sẽ thấy)
        </label>
        <Input.TextArea
          id="reject-reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={500}
          showCount
          autoSize={{ minRows: 3, maxRows: 6 }}
          placeholder="Ví dụ: Tệp bị lỗi, không mở được. Hãy gửi lại bản PDF."
        />
      </Modal>
    </div>
  );
}

function PreviewMessage({ icon: Icon, text }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <Icon className="h-10 w-10 text-gray-400 dark:text-neutral-500" />
      <p className="mt-3 max-w-sm text-sm text-gray-500 dark:text-neutral-400">{text}</p>
    </div>
  );
}
