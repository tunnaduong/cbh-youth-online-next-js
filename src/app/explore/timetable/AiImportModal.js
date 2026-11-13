"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input, Modal } from "antd";
import { ImagePlus, Sparkles, X } from "lucide-react";
import { aiImportTimetable } from "@/app/Api";

const PLACEHOLDER = `Ví dụ:
Sáng tiết 1 từ 7h30 đến 8h15
Ra chơi 15p
Tiết 2 8h30 đến 9h15
...
Thứ 2: Toán, Văn, Anh, Lý`;

// "Nhập bằng AI": free text and/or a photo of the timetable → the API's model
// drafts the schedule, which only fills the editor (the user checks and saves).
export default function AiImportModal({ open, onClose, current, loggedIn, onResult }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Ảnh phải là JPG, PNG hoặc WebP.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError("Ảnh tối đa 8 MB.");
      return;
    }
    setError("");
    setFile(f);
  };

  const submit = async () => {
    if (busy || (!text.trim() && !file)) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      if (text.trim()) form.append("text", text.trim());
      if (file) form.append("image", file);
      if (current) form.append("current", JSON.stringify(current));
      const res = await aiImportTimetable(form);
      onResult(res.data.data, res.data.note || "");
      setText("");
      setFile(null);
    } catch (err) {
      setError(err?.response?.data?.message || "AI chưa đọc được thời khóa biểu, bạn thử lại nhé.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => !busy && onClose()}
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-[18px] w-[18px] text-primary-500 dark:text-[#6bcf60]" />
          Nhập bằng AI
        </span>
      }
      footer={null}
      centered
      destroyOnClose={false}
    >
      {!loggedIn ? (
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Đăng nhập để dùng tính năng nhập thời khóa biểu bằng AI.</p>
          <Link
            href="/login?continue=/explore/timetable"
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary-500 px-4 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-primary-600"
          >
            Đăng nhập
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Viết thời khóa biểu theo cách bạn quen (giờ vào tiết, giờ ra chơi, tên môn từng thứ...) hoặc chọn ảnh chụp
            thời khóa biểu. AI sẽ điền vào lịch để bạn kiểm tra trước khi lưu.
          </p>
          <div>
            <label htmlFor="tkb-ai-text" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nội dung
            </label>
            <Input.TextArea
              id="tkb-ai-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              rows={8}
              maxLength={4000}
            />
          </div>
          <div>
            <p className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Ảnh thời khóa biểu (không bắt buộc)</p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickFile} />
            {preview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Ảnh thời khóa biểu đã chọn" className="h-[104px] w-[104px] rounded-xl border border-gray-200 object-cover dark:border-neutral-600" />
                <button
                  type="button"
                  aria-label="Bỏ ảnh"
                  onClick={() => setFile(null)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-primary-500 transition-colors hover:bg-primary-50 dark:border-neutral-500 dark:text-[#6bcf60] dark:hover:bg-[#2b3a2a]"
              >
                <ImagePlus className="h-4 w-4" />
                Chọn ảnh
              </button>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="primary"
            block
            loading={busy}
            disabled={!text.trim() && !file}
            icon={!busy && <Sparkles className="h-4 w-4" />}
            onClick={submit}
          >
            {busy ? "AI đang đọc..." : "Đọc thời khóa biểu"}
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Chỉ có khung giờ mà chưa có tên môn? AI giữ tên môn trong lịch hiện tại theo thứ tự tiết. Mỗi ngày dùng được 30
            lần.
          </p>
        </div>
      )}
    </Modal>
  );
}
