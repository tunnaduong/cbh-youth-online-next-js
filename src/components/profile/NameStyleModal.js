"use client";

import { useEffect, useState } from "react";
import { Button, ColorPicker, Modal } from "antd";
import StyledName from "@/components/profile/StyledName";
import { OptionTile } from "@/components/profile/OptionPickerModal";
import { NAME_FONTS } from "@/lib/nameFonts";
import { OPTION_LABELS } from "@/lib/profileTheme";

const pickHex = (color) => color.toHexString().slice(0, 7).toLowerCase();

/**
 * Modal "Kiểu tên" (Display Name Style của Discord): phông chữ, hiệu ứng và
 * màu tên, xem trước ngay trên tên của người dùng.
 *
 * Props:
 *   theme    — bản nháp hiện tại (để xem trước)
 *   options  — theme_editor.options (name_font / name_effect)
 *   onApply({ name_font, name_effect, name_colors })
 *   prefix   — "name" (mặc định) hoặc "username": cùng một modal sửa kiểu
 *              riêng của @tên người dùng (username_font / username_effect /
 *              username_colors)
 *   title    — tiêu đề modal
 */
export default function NameStyleModal({
  open,
  theme,
  options,
  profileName,
  onApply,
  onClose,
  prefix = "name",
  title = "Kiểu tên",
}) {
  const [style, setStyle] = useState(null);
  const fontField = `${prefix}_font`;
  const effectField = `${prefix}_effect`;
  const colorsField = `${prefix}_colors`;

  useEffect(() => {
    if (open) {
      setStyle({
        [fontField]: theme[fontField],
        [effectField]: theme[effectField],
        [colorsField]: theme[colorsField],
      });
    }
  }, [open, theme, fontField, effectField, colorsField]);

  if (!style) return null;

  // The samples are drawn by StyledName, which reads the name_* fields.
  const preview = {
    ...theme,
    name_font: style[fontField],
    name_effect: style[effectField],
    name_colors: style[colorsField],
  };
  const set = (patch) => setStyle((current) => ({ ...current, ...patch }));
  const setColor = (index, hex) =>
    set({ [colorsField]: style[colorsField].map((c, i) => (i === index ? hex : c)) });

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      width={620}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="primary"
            onClick={() => {
              onApply(style);
              onClose();
            }}
          >
            Áp dụng
          </Button>
        </div>
      }
    >
      <div className="max-h-[65vh] overflow-y-auto px-0.5">
        <div className="my-3 rounded-xl bg-gray-100 dark:bg-neutral-700 py-5 text-center text-3xl font-bold">
          <StyledName theme={preview} className="text-gray-900 dark:text-white">
            {profileName}
          </StyledName>
        </div>

        <p className="text-sm font-semibold mb-2 dark:text-neutral-200">Phông chữ</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {options[fontField].map((option) => (
            <OptionTile
              key={option.key}
              option={option}
              selected={style[fontField] === option.key}
              onClick={() => set({ [fontField]: option.key })}
            >
              <StyledName
                theme={{ ...preview, name_font: option.key, name_effect: "none" }}
                className="text-base text-gray-900 dark:text-neutral-100 truncate max-w-full"
              >
                {NAME_FONTS[option.key]?.label || option.label || option.key}
              </StyledName>
            </OptionTile>
          ))}
        </div>

        <p className="text-sm font-semibold mt-5 mb-2 dark:text-neutral-200">Hiệu ứng</p>
        <div className="grid grid-cols-3 gap-2">
          {options[effectField].map((option) => (
            <OptionTile
              key={option.key}
              option={option}
              selected={style[effectField] === option.key}
              onClick={() => set({ [effectField]: option.key })}
            >
              <StyledName
                theme={{ ...preview, name_effect: option.key }}
                className="font-bold text-2xl text-gray-900 dark:text-neutral-100"
              >
                Aa
              </StyledName>
              <span className="text-xs dark:text-neutral-300">
                {OPTION_LABELS.name_effect[option.key] || option.key}
              </span>
            </OptionTile>
          ))}
        </div>

        {style[effectField] !== "none" && style[effectField] !== "rainbow" && (
          <>
            <p className="text-sm font-semibold mt-5 mb-2 dark:text-neutral-200">
              {style[effectField] === "outline" ? "Màu chữ và màu viền" : "Màu"}
            </p>
            <div className="flex gap-3">
              {(["gradient", "outline"].includes(style[effectField]) ? [0, 1] : [0]).map((index) => (
                <ColorPicker
                  key={index}
                  value={style[colorsField][index]}
                  disabledAlpha
                  onChange={(color) => setColor(index, pickHex(color))}
                >
                  <button
                    type="button"
                    aria-label={`Chọn màu tên ${index + 1}`}
                    className="w-14 h-10 rounded-lg border border-gray-300 dark:border-neutral-500"
                    style={{ backgroundColor: style[colorsField][index] }}
                  />
                </ColorPicker>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
