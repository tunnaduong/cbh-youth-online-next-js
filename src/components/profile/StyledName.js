"use client";

import { useState } from "react";
import { getNameEffect, normalizeTheme } from "@/lib/profileTheme";
import { getNameFontClass } from "@/lib/nameFonts";

/**
 * Tên hiển thị theo kiểu tên (phông + hiệu ứng) trong theme của người dùng.
 * Không có theme thì hiển thị như một <span> bình thường.
 *
 * Props:
 *   theme   — `theme` của người dùng từ API, hoặc null
 *   variant — "full": luôn hiện phông + hiệu ứng (trang cá nhân, xem trước)
 *             "compact": chỉ hiện phông, rê chuột mới hiện hiệu ứng — giống
 *             cách Discord hiển thị tên trong tin nhắn, cho danh sách dài
 *             như bài viết/bình luận đỡ rối mắt.
 */
export default function StyledName({
  theme,
  variant = "full",
  className = "",
  children,
}) {
  const [hovered, setHovered] = useState(false);
  const normalized = normalizeTheme(theme);

  if (!normalized) {
    return <span className={className}>{children}</span>;
  }

  const showEffect = variant === "full" || hovered;
  const effect = showEffect ? getNameEffect(normalized) : null;
  const classes = [className, getNameFontClass(normalized.name_font), effect?.className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={effect?.style}
      onMouseEnter={variant === "compact" ? () => setHovered(true) : undefined}
      onMouseLeave={variant === "compact" ? () => setHovered(false) : undefined}
    >
      {children}
    </span>
  );
}
