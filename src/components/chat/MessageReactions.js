"use client";

import { Popover } from "antd";
import { X } from "lucide-react";

export const REACTION_TYPES = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😆" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😠" },
];

const REACTION_EMOJI = REACTION_TYPES.reduce((acc, r) => {
  acc[r.type] = r.emoji;
  return acc;
}, {});

export default function MessageReactions({
  reactions,
  isOwn,
  open,
  onOpenChange,
  onReact,
  onRemove,
}) {
  const summary = reactions?.summary || [];
  const total = reactions?.total || 0;
  const myReaction = reactions?.my_reaction || null;

  const pickerContent = (
    <div className="flex items-center gap-1 p-1">
      {REACTION_TYPES.map((r) => (
        <button
          key={r.type}
          type="button"
          onClick={() => onReact(r.type === myReaction ? null : r.type)}
          className={`text-xl w-8 h-8 flex items-center justify-center rounded-full hover:scale-125 transition-transform ${
            myReaction === r.type
              ? "ring-2 ring-[#319527] bg-green-50 dark:bg-neutral-700"
              : ""
          }`}
          title={r.type}
        >
          {r.emoji}
        </button>
      ))}
      {myReaction && (
        <button
          type="button"
          onClick={onRemove}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-300"
          title="Bỏ react"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={onOpenChange}
      placement={isOwn ? "topRight" : "topLeft"}
      content={pickerContent}
      styles={{ body: { padding: 4 } }}
    >
      <div
        className={`absolute -bottom-2 z-10 ${
          isOwn ? "-left-2" : "-right-2"
        }`}
      >
        {total > 0 ? (
          <button
            type="button"
            className="flex items-center gap-0.5 bg-white dark:bg-neutral-700 rounded-full shadow px-1.5 py-0.5 text-xs border border-gray-200 dark:border-neutral-600"
          >
            {summary.slice(0, 3).map((s) => (
              <span
                key={s.type}
                className={
                  myReaction === s.type
                    ? "ring-1 ring-[#319527] rounded-full"
                    : ""
                }
              >
                {REACTION_EMOJI[s.type] || "👍"}
              </span>
            ))}
            <span className="text-gray-600 dark:text-gray-300 ml-0.5">
              {total}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-neutral-700 shadow border border-gray-200 dark:border-neutral-600 text-xs"
            title="React"
          >
            🙂
          </button>
        )}
      </div>
    </Popover>
  );
}
