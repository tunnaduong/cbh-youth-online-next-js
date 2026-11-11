'use client';

import { useRef, useState } from 'react';
import { Button, Input, Select, InputNumber, message } from 'antd';
import { FileText, UploadCloud, X } from 'lucide-react';
import { createPrintRequest, uploadFile } from '@/app/Api';

const DELIVERY_METHODS = [
  { value: 'delivery_to_class', label: 'Giao tới lớp' },
  { value: 'pickup_at_office', label: 'Nhận tại văn phòng' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png';

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
const HINT = 'mt-1 text-xs text-gray-500 dark:text-gray-400';

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Required() {
  return <span className="text-red-500">*</span>;
}

export default function PrintRequestForm({ onSuccess, onCancel }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    pages_count: 1,
    delivery_method: 'delivery_to_class',
    class_or_location: '',
    notes: '',
  });

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    // Reset so picking the same file again after removing it still fires.
    e.target.value = '';
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      message.error('Kích thước file không được vượt quá 50MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      message.error('Vui lòng chọn tệp tin.');
      return;
    }

    if (!form.title.trim()) {
      message.error('Vui lòng nhập tiêu đề.');
      return;
    }

    if (!form.class_or_location.trim()) {
      message.error('Vui lòng nhập lớp hoặc địa chỉ.');
      return;
    }

    try {
      setLoading(true);

      // The upload endpoint requires `uid` (the owner) and answers with the
      // body in response.data (axios wraps it).
      const currentUser = JSON.parse(localStorage.getItem('CURRENT_USER') || 'null');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uid', currentUser?.id);
      const uploadResponse = await uploadFile(formData);
      const fileId = uploadResponse.data.id;

      await createPrintRequest({
        ...form,
        file_id: fileId,
      });

      onSuccess();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu in.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isClass = form.delivery_method === 'delivery_to_class';

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-4 sm:p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Gửi tài liệu cần in</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tải tệp lên, cho biết số trang và nơi nhận. Bạn sẽ theo dõi được trạng thái ở danh sách bên dưới.
        </p>

        <div className="mt-5 space-y-5">
          {/* File */}
          <div>
            <span className={LABEL}>
              Tệp tin <Required />
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleFileChange}
              className="sr-only"
              id="print-file"
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-neutral-600 dark:bg-neutral-800">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-[#2b3a2a]">
                  <FileText className="h-5 w-5 text-primary-500 dark:text-[#6bcf60]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-500 transition-colors hover:bg-primary-50 dark:text-[#6bcf60] dark:hover:bg-[#2b3a2a]"
                >
                  Đổi tệp
                </button>
                <button
                  type="button"
                  aria-label="Bỏ tệp đã chọn"
                  onClick={() => setFile(null)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="print-file"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-primary-400 hover:bg-primary-50 dark:border-neutral-500 dark:bg-neutral-800 dark:hover:border-[#6bcf60] dark:hover:bg-[#2b3a2a]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-neutral-700">
                  <UploadCloud className="h-6 w-6 text-primary-500 dark:text-[#6bcf60]" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Chọn tệp để in</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  PDF, Word, Excel, PowerPoint hoặc ảnh · tối đa 50MB
                </p>
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="print-title" className={LABEL}>
              Tiêu đề <Required />
            </label>
            <Input
              id="print-title"
              placeholder="Ví dụ: Đề cương ôn tập môn Toán lớp 11"
              value={form.title}
              maxLength={255}
              onChange={(e) => update('title')(e.target.value)}
            />
          </div>

          {/* Pages + delivery */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="print-pages" className={LABEL}>
                Số trang <Required />
              </label>
              <InputNumber
                id="print-pages"
                min={1}
                max={1000}
                value={form.pages_count}
                onChange={update('pages_count')}
                className="!w-full"
              />
            </div>
            <div>
              <label htmlFor="print-delivery" className={LABEL}>
                Hình thức nhận <Required />
              </label>
              <Select
                id="print-delivery"
                value={form.delivery_method}
                onChange={update('delivery_method')}
                options={DELIVERY_METHODS}
                className="w-full"
              />
            </div>
          </div>

          {/* Class / location */}
          <div>
            <label htmlFor="print-location" className={LABEL}>
              {isClass ? 'Lớp nhận' : 'Nơi nhận'} <Required />
            </label>
            <Input
              id="print-location"
              placeholder={isClass ? 'Ví dụ: 11A1' : 'Ví dụ: Phòng 101, Văn phòng Đoàn'}
              value={form.class_or_location}
              maxLength={255}
              onChange={(e) => update('class_or_location')(e.target.value)}
            />
            <p className={HINT}>
              {isClass ? 'Tài liệu sẽ được mang tới lớp này.' : 'Bạn sẽ tới đây nhận tài liệu khi đã in xong.'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="print-description" className={LABEL}>
              Mô tả <span className="font-normal text-gray-400 dark:text-neutral-400">(tùy chọn)</span>
            </label>
            <Input.TextArea
              id="print-description"
              placeholder="Nội dung tài liệu, dùng cho môn nào..."
              value={form.description}
              maxLength={1000}
              onChange={(e) => update('description')(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 5 }}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="print-notes" className={LABEL}>
              Yêu cầu khi in <span className="font-normal text-gray-400 dark:text-neutral-400">(tùy chọn)</span>
            </label>
            <Input.TextArea
              id="print-notes"
              placeholder="Ví dụ: In màu, in hai mặt, đóng ghim..."
              value={form.notes}
              maxLength={500}
              onChange={(e) => update('notes')(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 5 }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-4 py-3 sm:px-5 dark:border-neutral-600">
        <Button onClick={onCancel} disabled={loading}>
          Hủy
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Gửi yêu cầu
        </Button>
      </div>
    </form>
  );
}
