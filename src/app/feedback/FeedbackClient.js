"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input, message } from "antd";
import { Bug, CheckCircle2, ImagePlus, Lightbulb, MessageSquare, X } from "lucide-react";
import { useAuthContext } from "@/contexts/Support";
import { submitFeedback } from "@/app/Api";
import { uploadInlineImage } from "@/utils/imageUpload";

const { TextArea } = Input;

const MAX_IMAGES = 4;
const MIN_LENGTH = 10;

const TYPES = [
  { value: "bug", label: "Báo lỗi", desc: "Có gì đó không hoạt động đúng", Icon: Bug },
  { value: "suggestion", label: "Góp ý", desc: "Đề xuất tính năng, cải thiện", Icon: Lightbulb },
  { value: "other", label: "Khác", desc: "Câu hỏi hoặc ý kiến khác", Icon: MessageSquare },
];

const PLACEHOLDERS = {
  bug: "Mô tả lỗi bạn gặp: bạn đang làm gì, điều gì xảy ra và bạn mong đợi điều gì...",
  suggestion: "Bạn muốn diễn đàn có thêm tính năng gì, hoặc cải thiện điều gì?",
  other: "Chia sẻ với chúng mình điều bạn muốn nói...",
};

function deviceInfo() {
  if (typeof navigator === "undefined") return null;
  return `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight}`.slice(0, 255);
}

export default function FeedbackClient() {
  const { loggedIn, currentUser } = useAuthContext();
  const [type, setType] = useState("bug");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [images, setImages] = useState([]); // [{ url, preview }]
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [pageUrl, setPageUrl] = useState(null);
  const fileInputRef = useRef(null);

  // The page someone was on when they hit "Góp ý" is the most useful context
  // for a bug report.
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    setPageUrl(from || document.referrer || null);
  }, []);

  const handlePickImages = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES - images.length);
    e.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadInlineImage(file, currentUser?.id);
        setImages((prev) => [...prev, { url, preview: URL.createObjectURL(file) }]);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || err?.message || "Tải ảnh lên thất bại");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (content.trim().length < MIN_LENGTH) {
      message.warning(`Vui lòng mô tả chi tiết hơn (ít nhất ${MIN_LENGTH} ký tự).`);
      return;
    }
    if (!loggedIn && !email.trim()) {
      message.warning("Vui lòng nhập email để chúng mình có thể phản hồi bạn.");
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        type,
        content: content.trim(),
        image_urls: images.map((i) => i.url),
        contact_email: email.trim() || undefined,
        platform: "web",
        device_info: deviceInfo(),
        page_url: pageUrl ? pageUrl.slice(0, 500) : undefined,
      });
      setDone(true);
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const first = errors && Object.values(errors)[0]?.[0];
      message.error(
        first ||
          (err?.response?.status === 429
            ? "Bạn gửi quá nhanh, vui lòng thử lại sau ít phút."
            : err?.response?.data?.message || "Gửi thất bại, vui lòng thử lại.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(false);
    setContent("");
    setImages([]);
    setType("bug");
  };

  if (done) {
    return (
      <div className="px-4 py-10 max-w-[680px] mx-auto w-full">
        <div className="bg-white dark:bg-[var(--main-white)] rounded-2xl border border-gray-200 dark:border-neutral-600 p-8 text-center">
          <CheckCircle2 className="mx-auto text-primary-500" size={56} />
          <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Đã gửi thành công!</h1>
          <p className="mt-2 text-gray-600 dark:text-neutral-300">
            Cảm ơn bạn đã dành thời gian góp ý. Đội ngũ phát triển sẽ xem xét sớm nhất có thể.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={reset}>Gửi góp ý khác</Button>
            <Link href="/">
              <Button type="primary">Về trang chủ</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-[680px] mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Góp ý & Báo lỗi</h1>
      <p className="mt-1 text-gray-600 dark:text-neutral-400 text-[15px]">
        Mọi ý kiến của bạn đều giúp diễn đàn tốt hơn mỗi ngày.
      </p>

      <div className="mt-5 bg-white dark:bg-[var(--main-white)] rounded-2xl border border-gray-200 dark:border-neutral-600 p-5 flex flex-col gap-5">
        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-neutral-200 mb-2">Bạn muốn gửi gì?</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TYPES.map(({ value, label, desc, Icon }) => {
              const active = type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  aria-pressed={active}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? "border-primary-500 bg-primary-50 dark:bg-[#2b3a2a]"
                      : "border-gray-200 hover:border-gray-300 dark:border-neutral-600 dark:hover:border-neutral-500"
                  }`}
                >
                  <Icon size={20} className={active ? "text-primary-500 shrink-0" : "text-gray-500 dark:text-neutral-400 shrink-0"} />
                  <span>
                    <span className="block font-semibold text-[14px] text-gray-900 dark:text-white">{label}</span>
                    <span className="block text-[12px] text-gray-500 dark:text-neutral-400">{desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-neutral-200 mb-2">Nội dung</div>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDERS[type]}
            autoSize={{ minRows: 5, maxRows: 14 }}
            maxLength={5000}
            showCount
          />
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-neutral-200 mb-2">
            Ảnh chụp màn hình <span className="font-normal text-gray-500">(tùy chọn, tối đa {MAX_IMAGES})</span>
          </div>
          {loggedIn ? (
            <div className="flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <div key={img.url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-600">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    aria-label="Xóa ảnh"
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-neutral-600 flex flex-col items-center justify-center text-gray-500 dark:text-neutral-400 hover:border-primary-500 hover:text-primary-500 disabled:opacity-60"
                >
                  <ImagePlus size={20} />
                  <span className="text-[11px] mt-1">{uploading ? "Đang tải..." : "Thêm ảnh"}</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handlePickImages}
              />
            </div>
          ) : (
            <p className="text-[13px] text-gray-500 dark:text-neutral-400">
              <Link href="/login?continue=/feedback" className="text-primary-500">Đăng nhập</Link> để đính kèm ảnh chụp màn hình.
            </p>
          )}
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-neutral-200 mb-2">
            Email liên hệ {loggedIn && <span className="font-normal text-gray-500">(tùy chọn)</span>}
          </div>
          {/* No type="email": @tailwindcss/forms restyles [type="email"] inputs
              (square corners, dark border) over antd's own look. inputMode
              still brings up the email keyboard on phones. */}
          <Input
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={loggedIn ? "Để trống nếu dùng email tài khoản" : "email@example.com"}
            maxLength={255}
          />
        </div>

        <Button type="primary" size="large" loading={submitting} disabled={uploading} onClick={handleSubmit}>
          Gửi
        </Button>
      </div>
    </div>
  );
}
