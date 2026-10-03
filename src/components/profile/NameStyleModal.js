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
 */
export default function NameStyleModal({ open, theme, options, profileName, onApply, onClose }) {
  const [style, setStyle] = useState(null);

  useEffect(() => {
    if (open) {
      setStyle({
        name_font: theme.name_font,
        name_effect: theme.name_effect,
        name_colors: theme.name_colors,
      });
    }
  }, [open, theme]);

  if (!style) return null;

  const preview = { ...theme, ...style };
  const set = (patch) => setStyle((current) => ({ ...current, ...patch }));
  const setColor = (index, hex) =>
    set({ name_colors: style.name_colors.map((c, i) => (i === index ? hex : c)) });

  return (
    <Modal
      open={open}
      title="Kiểu tên"
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
          {options.name_font.map((option) => (
            <OptionTile
              key={option.key}
              option={option}
              selected={style.name_font === option.key}
              onClick={() => set({ name_font: option.key })}
            >
              <StyledName
                theme={{ ...preview, name_font: option.key, name_effect: "none" }}
                className="text-base text-gray-900 dark:text-neutral-100 truncate max-w-full"
              >
                {NAME_FONTS[option.key]?.label || option.key}
              </StyledName>
            </OptionTile>
          ))}
        </div>

        <p className="text-sm font-semibold mt-5 mb-2 dark:text-neutral-200">Hiệu ứng</p>
        <div className="grid grid-cols-3 gap-2">
          {options.name_effect.map((option) => (
            <OptionTile
              key={option.key}
              option={option}
              selected={style.name_effect === option.key}
              onClick={() => set({ name_effect: option.key })}
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

        {style.name_effect !== "none" && style.name_effect !== "rainbow" && (
          <>
            <p className="text-sm font-semibold mt-5 mb-2 dark:text-neutral-200">
              {style.name_effect === "outline" ? "Màu chữ và màu viền" : "Màu"}
            </p>
            <div className="flex gap-3">
              {(["gradient", "outline"].includes(style.name_effect) ? [0, 1] : [0]).map((index) => (
                <ColorPicker
                  key={index}
                  value={style.name_colors[index]}
                  disabledAlpha
                  onChange={(color) => setColor(index, pickHex(color))}
                >
                  <button
                    type="button"
                    aria-label={`Chọn màu tên ${index + 1}`}
                    className="w-14 h-10 rounded-lg border border-gray-300 dark:border-neutral-500"
                    style={{ backgroundColor: style.name_colors[index] }}
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
