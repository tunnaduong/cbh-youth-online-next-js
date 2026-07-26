"use client";

import { Popover } from "antd";
import { X } from "lucide-react";
import {
  BsEmojiSmile,
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
      {REACTION_TYPES.map(({ type, Icon, color }) => (
        <button
          key={type}
          type="button"
          onClick={() => onReact(type === myReaction ? null : type)}
          className={`w-8 h-8 flex items-center justify-center rounded-full hover:scale-125 transition-transform ${
            myReaction === type
              ? "ring-2 ring-[#319527] bg-green-50 dark:bg-neutral-700"
              : ""
          }`}
          title={type}
        >
          <Icon className="w-5 h-5" style={{ color }} />
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
            className="flex items-center gap-0.5 bg-white dark:bg-neutral-700 rounded-full shadow px-1.5 py-0.5 border border-gray-200 dark:border-neutral-600"
          >
            {summary.slice(0, 3).map((s) => {
              const r = REACTION_MAP[s.type];
              if (!r) return null;
              const { Icon, color } = r;
              return (
                <span
                  key={s.type}
                  className={`w-3.5 h-3.5 flex items-center justify-center rounded-full ${
                    myReaction === s.type ? "ring-1 ring-[#319527]" : ""
                  }`}
                >
                  <Icon className="w-3 h-3" style={{ color }} />
                </span>
              );
            })}
            <span className="text-[11px] text-gray-600 dark:text-gray-300 ml-0.5">
              {total}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-neutral-700 shadow border border-gray-200 dark:border-neutral-600 text-gray-500 dark:text-gray-300"
            title="React"
          >
            <BsEmojiSmile className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Popover>
  );
}
