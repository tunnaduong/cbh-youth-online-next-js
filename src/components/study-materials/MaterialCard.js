"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Eye, Star, FileText, Check } from "lucide-react";
import { timeAgoInVietnamese } from "@/utils/dateFormat";

/**
 * Màu chấm tròn đại diện danh mục. Giữ nguyên chuỗi class ở đây (không ghép
 * động) để Tailwind không loại bỏ khi build.
 */
const CATEGORY_DOTS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
];

function categoryDot(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_DOTS[hash % CATEGORY_DOTS.length];
}

function formatCount(value) {
  const n = Number(value) || 0;
  if (n < 1000) return String(n);
  return (
    (n / 1000)
      .toFixed(n < 10000 ? 1 : 0)
      .replace(".", ",")
      .replace(",0", "") + "k"
  );
}

export default function MaterialCard({ material }) {
  const [previewFailed, setPreviewFailed] = useState(false);

  const author = material.author || {};
  const authorName = author.profile_name || author.username || "Ẩn danh";
  const categoryName = material.category?.name;
  const showPreview = Boolean(material.preview_path) && !previewFailed;

  return (
    <Link
      href={`/explore/study-materials/${material.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none dark:border-neutral-700/80 dark:bg-neutral-800 dark:hover:border-primary-500/50 dark:focus-visible:ring-offset-neutral-900"
    >
      {/* Ảnh xem trước tài liệu */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-neutral-900">
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={material.preview_path}
            alt={`Xem trước: ${material.title}`}
            loading="lazy"
            onError={() => setPreviewFailed(true)}
            className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          // Nền giấy kẻ dòng cho tài liệu chưa có ảnh xem trước
          <div
            className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom,transparent_0,transparent_calc(100%_-_1px),rgb(0_0_0/0.06)_calc(100%_-_1px))] bg-[length:100%_1.25rem] dark:bg-[linear-gradient(to_bottom,transparent_0,transparent_calc(100%_-_1px),rgb(255_255_255/0.06)_calc(100%_-_1px))]"
            aria-hidden="true"
          >
            <FileText
              className="h-10 w-10 text-gray-300 dark:text-neutral-600"
              strokeWidth={1.25}
            />
          </div>
        )}

        {/* Nhãn giá / trạng thái */}
        <div className="absolute right-3 top-3">
          {material.is_purchased ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-sky-700 shadow-sm ring-1 ring-sky-600/20 backdrop-blur dark:bg-neutral-900/90 dark:text-sky-300 dark:ring-sky-400/25">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Đã mua
            </span>
          ) : material.is_free ? (
            <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary-700 shadow-sm ring-1 ring-primary-600/20 backdrop-blur dark:bg-neutral-900/90 dark:text-primary-300 dark:ring-primary-400/25">
              Miễn phí
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-700 shadow-sm ring-1 ring-amber-600/20 backdrop-blur dark:bg-neutral-900/90 dark:text-amber-300 dark:ring-amber-400/25">
              {material.price} điểm
            </span>
          )}
        </div>
      </div>

      {/* Nội dung */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
          {categoryName ? (
            <>
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${categoryDot(
                  categoryName
                )}`}
                aria-hidden="true"
              />
              <span className="truncate">{categoryName}</span>
            </>
          ) : (
            <span className="truncate">Chưa phân loại</span>
          )}
          {material.created_at && (
            <>
              <span className="text-gray-300 dark:text-neutral-600">·</span>
              <span className="shrink-0 font-medium normal-case tracking-normal">
                {timeAgoInVietnamese(material.created_at)}
              </span>
            </>
          )}
        </div>

        <h3 className="line-clamp-2 min-h-[2.625rem] text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-300">
          {material.title}
        </h3>

        {material.description && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-gray-500 dark:text-neutral-400">
            {material.description}
          </p>
        )}

        {/* Chân thẻ: tác giả + số liệu */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-neutral-700/70">
          <div className="flex min-w-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${author.username}/avatar`}
              alt=""
              loading="lazy"
              className="h-6 w-6 shrink-0 rounded-full bg-gray-200 object-cover dark:bg-neutral-700"
            />
            <span
              className="truncate text-xs text-gray-600 dark:text-neutral-400"
              title={authorName}
            >
              {authorName}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-gray-400 dark:text-neutral-500">
            <span
              className="flex items-center gap-1"
              title={`${material.download_count || 0} lượt tải`}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              {formatCount(material.download_count)}
            </span>
            <span
              className="flex items-center gap-1"
              title={`${material.view_count || 0} lượt xem`}
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              {formatCount(material.view_count)}
            </span>
            {material.average_rating > 0 && (
              <span
                className="flex items-center gap-1 text-amber-500 dark:text-amber-400"
                title={`${material.average_rating}/5 từ ${
                  material.ratings_count || 0
                } đánh giá`}
              >
                <Star
                  className="h-3.5 w-3.5 fill-current"
                  strokeWidth={1.75}
                />
                {material.average_rating}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
