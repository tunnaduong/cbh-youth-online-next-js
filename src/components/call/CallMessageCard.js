"use client";

import { useCallContext } from "@/contexts/Support";
import { Phone, PhoneMissed, Video } from "lucide-react";

function formatSeconds(secs) {
  if (!secs && secs !== 0) return "";
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallMessageCard({ message, conversationId, isMyself }) {
  const { startCall } = useCallContext();
  const meta = message?.metadata || {};
  const isVideo = meta.call_type === "video";
  const status = meta.status;
  const isMissed =
    status === "missed" ||
    status === "rejected" ||
    status === "busy" ||
    status === "cancelled" ||
    meta.end_reason === "missed" ||
    meta.end_reason === "rejected" ||
    meta.end_reason === "cancelled";

  const duration = meta.duration ? formatSeconds(meta.duration) : null;

  const titleText = isMissed
    ? isVideo
      ? "Cuộc gọi video nhỡ"
      : "Cuộc gọi nhỡ"
    : isVideo
    ? "Cuộc gọi video"
    : "Cuộc gọi thoại";

  const subtitleText = isMissed
    ? isMyself
      ? "Không có câu trả lời"
      : "Cuộc gọi nhỡ"
    : duration
    ? `Đã kết thúc · ${duration}`
    : "Đã kết thúc";

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border shadow-sm text-xs transition-all ${
        isMyself
          ? "bg-primary-50/70 border-primary-200/80 dark:bg-[#1c351c] dark:border-[#2f5e2d]"
          : "bg-white/95 border-gray-200/80 dark:bg-[#252825] dark:border-neutral-700"
      }`}
    >
      {/* Compact Icon circle */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isMissed
            ? "bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-400 dark:border dark:border-red-900/40"
            : "bg-primary-100 text-primary-600 dark:bg-[#203f1e] dark:text-[#4ade80] dark:border dark:border-[#2d5c2b]"
        }`}
      >
        {isMissed ? (
          <PhoneMissed className="w-3.5 h-3.5" />
        ) : isVideo ? (
          <Video className="w-3.5 h-3.5" />
        ) : (
          <Phone className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Info details */}
      <div className="flex flex-col min-w-0 pr-1">
        <span
          className={`font-semibold text-xs leading-tight truncate ${
            isMissed
              ? "text-red-600 dark:text-red-400"
              : "text-gray-900 dark:text-neutral-100"
          }`}
        >
          {titleText}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-neutral-400 leading-tight">
          {subtitleText}
        </span>
      </div>

      {/* Quick Callback Button */}
      {conversationId && (
        <button
          onClick={() => startCall(conversationId, isVideo ? "video" : "audio")}
          className="ml-auto px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-[11px] font-medium text-gray-700 dark:text-neutral-200 border border-transparent dark:border-neutral-600 flex-shrink-0 transition-colors"
        >
          Gọi lại
        </button>
      )}
    </div>
  );
}
