'use client';

import { useState } from 'react';
import { Button, Input, Select, InputNumber, message } from 'antd';
import { createPrintRequest, uploadFile } from '@/app/Api';

const DELIVERY_METHODS = [
  { value: 'delivery_to_class', label: 'Giao tới lớp' },
  { value: 'pickup_at_office', label: 'Nhận tại văn phòng' },
];

export default function PrintRequestForm({ onSuccess, onCancel }) {
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
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

      // Upload file first
      // The upload endpoint requires `uid` (the owner) and answers with the
      // body in response.data (axios wraps it).
      const currentUser = JSON.parse(localStorage.getItem('CURRENT_USER') || 'null');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uid', currentUser?.id);
      const uploadResponse = await uploadFile(formData);
      const fileId = uploadResponse.data.id;

      // Create print request
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tệp tin <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900 dark:file:text-primary-300"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {file ? `Đã chọn: ${file.name}` : 'Tối đa 50MB'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tiêu đề <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="Ví dụ: Đề cương ôn tập môn Toán lớp 11"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Mô tả (tùy chọn)
        </label>
        <Input.TextArea
          placeholder="Ghi chú thêm về tài liệu..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Số trang <span className="text-red-500">*</span>
        </label>
        <InputNumber
          min={1}
          max={1000}
          value={form.pages_count}
          onChange={(value) => setForm({ ...form, pages_count: value })}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hình thức giao nhận <span className="text-red-500">*</span>
        </label>
        <Select
          value={form.delivery_method}
          onChange={(value) => setForm({ ...form, delivery_method: value })}
          options={DELIVERY_METHODS}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Lớp học / Địa chỉ <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder={form.delivery_method === 'delivery_to_class' ? 'Ví dụ: 11A1' : 'Ví dụ: Phòng 101, Văn phòng Đoàn'}
          value={form.class_or_location}
          onChange={(e) => setForm({ ...form, class_or_location: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ghi chú thêm (tùy chọn)
        </label>
        <Input.TextArea
          placeholder="Ví dụ: In màu, sắp xếp theo thứ tự..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-neutral-600">
        <Button onClick={onCancel}>Hủy</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Gửi yêu cầu
        </Button>
      </div>
    </form>
  );
}
