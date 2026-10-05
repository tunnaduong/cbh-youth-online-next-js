"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "antd";
import { Lock } from "lucide-react";

/**
 * Lưới chọn một tuỳ chọn (khung avatar, hiệu ứng, khung hồ sơ...) trong
 * modal, giống các hộp "Change Decoration / Change Effect" của Discord.
 * Tuỳ chọn chưa mở khoá vẫn chọn được để xem thử — chỉ không lưu được.
 *
 * Props:
 *   options      — [{ key, required_points, unlocked }] từ theme_editor
 *   value        — key đang dùng trong bản nháp
 *   renderOption — (key) => nội dung minh hoạ của ô
 *   gridClassName — số cột của lưới (mặc định 3 cột)
 *   onApply(key)
 */
export default function OptionPickerModal({
  open,
  title,
  options,
  value,
  renderOption,
  onApply,
  onClose,
  gridClassName = "grid-cols-3",
}) {
  const [selected, setSelected] = useState(value);

  useEffect(() => {
    if (open) setSelected(value);
  }, [open, value]);

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      width={560}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            onClick={() => {
              onApply(selected);
              onClose();
            }}
          >
            Áp dụng
          </Button>
        </div>
      }
    >
      <div className={`grid ${gridClassName} gap-2 max-h-[60vh] overflow-y-auto py-2 px-0.5`}>
        {options.map((option) => (
          <OptionTile
            key={option.key}
            selected={selected === option.key}
            option={option}
            onClick={() => setSelected(option.key)}
          >
            {renderOption(option.key)}
          </OptionTile>
        ))}
      </div>
    </Modal>
  );
}

export function OptionTile({ selected, option, onClick, children }) {
  const locked = option && !option.unlocked;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3 text-sm transition-colors hover:border-primary-500 ${
        selected
          ? "border-primary-500 bg-[#e9f1e9] dark:bg-[#1d281b]"
          : "border-gray-200 dark:border-neutral-600"
      }`}
    >
      {locked && (
        // z-20: the samples (effect overlay, frame at z-10) must not cover it.
        <span className="absolute top-1 right-1 z-20 flex items-center gap-0.5 rounded-full bg-gray-900/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <Lock className="w-2.5 h-2.5" />
          {option.required_points}
        </span>
      )}
      {children}
    </button>
  );
}
