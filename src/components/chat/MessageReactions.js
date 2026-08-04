"use client";

import { Popover } from "antd";
import { X, CornerUpLeft, Forward, Undo2, Pencil, Copy, Eye } from "lucide-react";
import { BsEmojiSmile } from "react-icons/bs";
import {
  BsHandThumbsUpFill,
  BsHeartFill,
  BsEmojiLaughingFill,
  BsEmojiAstonishedFill,
  BsEmojiFrownFill,
  BsEmojiAngryFill,
} from "react-icons/bs";

export const REACTION_TYPES = [
  { type: "like", Icon: BsHandThumbsUpFill, color: "#2078f4" },
  { type: "love", Icon: BsHeartFill, color: "#f33e58" },
  { type: "haha", Icon: BsEmojiLaughingFill, color: "#f7b125" },
  { type: "wow", Icon: BsEmojiAstonishedFill, color: "#f7b125" },
  { type: "sad", Icon: BsEmojiFrownFill, color: "#f7b125" },
  { type: "angry", Icon: BsEmojiAngryFill, color: "#e9710f" },
];

const REACTION_MAP = REACTION_TYPES.reduce((acc, r) => {
  acc[r.type] = r;
  return acc;
}, {});

const REACTION_LABELS = {
  like: "Thích",
  love: "Yêu thích",
  haha: "Haha",
  wow: "Wow",
  sad: "Buồn",
  angry: "Phẫn nộ",
};

// Who-reacted popover content
function WhoReactedContent({ summary }) {
  if (!summary?.length) {
    return <p className="text-sm text-gray-400 text-center py-2">Chưa có cảm xúc nào.</p>;
  }
  return (
    <div className="flex flex-col gap-3 max-h-72 overflow-y-auto" style={{ minWidth: 200, maxWidth: 280 }}>
      {summary.map((s) => {
        const r = REACTION_MAP[s.type];
        if (!r) return null;
        const { Icon, color } = r;
        return (
          <div key={s.type}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {REACTION_LABELS[s.type]}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">• {s.count} lượt</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-1">
              {(s.users || []).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-0.5">
                  <span className="text-sm text-gray-800 dark:text-gray-200">{u.profile_name || u.username}</span>
                  {u.count > 1 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-3">×{u.count}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * @param {object} props
 * @param {boolean} [props.inline] - render as a flex row instead of absolutely positioned (for public chat)
 */
export default function MessageReactions({
  reactions,
  isOwn,
  open,
  onOpenChange,
  onReact,
  onRemove,
  onReply,
  onForward,
  onRecall,
  onEdit,
  onCopy,
  onViewSeenBy,
  inline = false,
}) {
  const summary = reactions?.summary || [];
  const total = reactions?.total || 0;
  const myReactions = reactions?.my_reactions || [];

  // Top 2 most frequent reaction types for badge
  const topTwo = [...summary].sort((a, b) => b.count - a.count).slice(0, 2);

  const pickerContent = (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex items-center gap-1">
        {REACTION_TYPES.map(({ type, Icon, color }) => (
          <button
            key={type}
            type="button"
            onClick={() => { onReact(type); onOpenChange(false); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:scale-125 transition-transform"
            title={REACTION_LABELS[type]}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </button>
        ))}
        {myReactions.length > 0 && (
          <button
            type="button"
            onClick={() => { onRemove(); onOpenChange(false); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-300"
            title="Xóa tất cả cảm xúc"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {onReply && (
        <button
          type="button"
          onClick={() => { onReply(); onOpenChange(false); }}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-sm text-gray-700 dark:text-gray-200"
        >
          <CornerUpLeft className="w-4 h-4" />
          Trả lời
        </button>
      )}
      {onForward && (
        <button
          type="button"
          onClick={() => { onForward(); onOpenChange(false); }}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-sm text-gray-700 dark:text-gray-200"
        >
          <Forward className="w-4 h-4" />
          Chuyển tiếp
        </button>
      )}
      {onCopy && (
        <button
          type="button"
          onClick={() => { onCopy(); onOpenChange(false); }}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-sm text-gray-700 dark:text-gray-200"
        >
          <Copy className="w-4 h-4" />
          Sao chép
        </button>
      )}
      {isOwn && onViewSeenBy && (
        <button
          type="button"
          onClick={() => { onViewSeenBy(); onOpenChange(false); }}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-sm text-gray-700 dark:text-gray-200"
        >
          <Eye className="w-4 h-4" />
          Lượt xem
        </button>
      )}
      {isOwn && onEdit && (
        <button
          type="button"
          onClick={() => { onEdit(); onOpenChange(false); }}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-sm text-gray-700 dark:text-gray-200"
        >
          <Pencil className="w-4 h-4" />
          Sửa tin nhắn
        </button>
      )}
      {isOwn && onRecall && (
        <button
          type="button"
          onClick={() => { onRecall(); onOpenChange(false); }}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-sm text-red-600 dark:text-red-400"
        >
          <Undo2 className="w-4 h-4" />
          Thu hồi
        </button>
      )}
    </div>
  );

  const reactionBadge = total > 0 ? (
    <Popover
      trigger="click"
      placement={isOwn ? "topRight" : "topLeft"}
      title="Cảm xúc tin nhắn"
      content={<WhoReactedContent summary={summary} />}
      styles={{ body: { padding: "8px 4px" } }}
    >
      <button
        type="button"
        className="flex items-center gap-0.5 bg-white dark:bg-neutral-700 rounded-full shadow px-1.5 py-0.5 border border-gray-200 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-400 transition"
      >
        {topTwo.map((s) => {
          const r = REACTION_MAP[s.type];
          if (!r) return null;
          const { Icon, color } = r;
          return (
            <span key={s.type} className="w-3.5 h-3.5 flex items-center justify-center">
              <Icon className="w-3 h-3" style={{ color }} />
            </span>
          );
        })}
        <span className="text-[11px] text-gray-600 dark:text-gray-300 ml-0.5">{total}</span>
      </button>
    </Popover>
  ) : null;

  const threeDotButton = (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={onOpenChange}
      placement={isOwn ? "topRight" : "topLeft"}
      content={pickerContent}
      styles={{ body: { padding: 4 } }}
    >
      <button
        type="button"
        className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-neutral-700 shadow border border-gray-200 dark:border-neutral-600 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
        title="Cảm xúc & tùy chọn"
      >
        <BsEmojiSmile className="w-3.5 h-3.5" />
      </button>
    </Popover>
  );

  const buttons = (inline || isOwn) ? (
    <>{threeDotButton}{reactionBadge}</>
  ) : (
    <>{reactionBadge}{threeDotButton}</>
  );

  if (inline) {
    return (
      <div className="flex items-center gap-1 mt-1 justify-start">
        {buttons}
      </div>
    );
  }

  return (
    <div
      className={`absolute -bottom-2 z-10 flex items-center gap-1 ${
        isOwn ? "-left-2" : "-right-2"
      }`}
    >
      {buttons}
    </div>
  );
}
