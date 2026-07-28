"use client";

import { FileText, Video } from "lucide-react";

function resolveFileUrl(url) {
  if (!url) return url;
  return url.startsWith("http") || url.startsWith("blob:")
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}

export default function ReplyPreviewBubble({ replyTo, isOwn, onClick }) {
  if (!replyTo) return null;

  const senderName =
    replyTo.sender?.profile_name || replyTo.sender?.username || "Ai đó";

  const renderContent = () => {
    const type = replyTo.type;
    if (type === "image") {
      return (
        <span className="flex items-center gap-1 truncate">
          {replyTo.file_url && (
            <img
              src={resolveFileUrl(replyTo.file_url)}
              alt=""
              className="w-6 h-6 rounded object-cover flex-shrink-0"
            />
          )}
          <span className="truncate opacity-80">Hình ảnh</span>
        </span>
      );
    }
    if (type === "video") {
      return (
        <span className="flex items-center gap-1 truncate">
          <Video className="w-4 h-4 flex-shrink-0 opacity-70" />
          <span className="truncate opacity-80">Video</span>
        </span>
      );
    }
    if (type === "file") {
      return (
        <span className="flex items-center gap-1 truncate">
          <FileText className="w-4 h-4 flex-shrink-0 opacity-70" />
          <span className="truncate opacity-80">Tệp đính kèm</span>
        </span>
      );
    }
    return (
      <span className="truncate opacity-80">
        {replyTo.content || "Tin nhắn"}
      </span>
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-0 min-w-full text-left mb-1.5 rounded px-2 py-1 border-l-[3px] opacity-80 hover:opacity-100 transition-opacity ${
        isOwn
          ? "bg-[#267a1e] border-white/60 text-white"
          : "bg-black/10 dark:bg-white/10 border-[#319527] text-gray-700 dark:text-gray-200"
      }`}
    >
      <p className="text-[11px] font-medium opacity-70 mb-0.5 truncate">
        {senderName}
      </p>
      <div className="text-[12px] flex min-w-0 overflow-hidden">
        {renderContent()}
      </div>
    </button>
  );
}
