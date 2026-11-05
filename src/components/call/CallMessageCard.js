"use client";

import { useCallContext } from "@/contexts/Support";
import { Phone, PhoneMissed, PhoneOff, Video } from "lucide-react";

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
    meta.end_reason === "rejected";

  const duration = meta.duration ? formatSeconds(meta.duration) : null;

  return (
    <div
      className={`flex items-center gap-3.5 p-3.5 rounded-2xl max-w-sm border shadow-sm transition-all ${
        isMyself
          ? "bg-primary-50/80 border-primary-200 dark:bg-primary-950/30 dark:border-primary-900/50"
          : "bg-white border-gray-200 dark:bg-neutral-800 dark:border-neutral-700"
      }`}
    >
      {/* Icon circle */}
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isMissed
            ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
            : "bg-primary-100 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400"
        }`}
      >
        {isMissed ? (
          <PhoneMissed className="w-5 h-5" />
        ) : isVideo ? (
          <Video className="w-5 h-5" />
        ) : (
          <Phone className="w-5 h-5" />
        )}
      </div>

      {/* Info details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {message?.content ||
            (isMissed
              ? isVideo
                ? "Cuộc gọi video nhỡ"
                : "Cuộc gọi nhỡ"
              : isVideo
              ? "Cuộc gọi video"
              : "Cuộc gọi thoại")}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
          {duration ? (
            <span>Thời lượng: {duration}</span>
          ) : (
            <span>{isMissed ? "Không có câu trả lời" : "Đã kết thúc"}</span>
          )}
        </div>
      </div>

      {/* Quick Callback Button */}
      {conversationId && (
        <button
          onClick={() => startCall(conversationId, isVideo ? "video" : "audio")}
          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-xs font-semibold text-gray-800 dark:text-gray-200 flex-shrink-0 transition-colors"
        >
          Gọi lại
        </button>
      )}
    </div>
  );
}
