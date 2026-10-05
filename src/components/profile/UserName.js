"use client";

import StyledName from "@/components/profile/StyledName";
import NameIcon from "@/components/profile/NameIcon";
import Badges from "@/components/ui/Badges";

/**
 * Một hàng tên người dùng, luôn nằm trên MỘT dòng:
 *   tên (theo kiểu tên, tự cắt "…" khi dài) + biểu tượng tên + tích xác minh
 *   + nội dung theo sau (`children`: huy hiệu mốc, ngày giờ, nhãn vai trò...).
 *
 * Chỉ có tên được co lại; biểu tượng, tích và `children` không co
 * (`flex-shrink-0`) nên không bao giờ rớt xuống dòng hay bị cắt. Phần tử cha
 * phải cho phép co: đặt `min-w-0` lên nó (và lên `className` ở đây đã có sẵn).
 *
 * Props:
 *   name          — tên hiển thị
 *   theme         — `profile_theme` của người dùng từ API, hoặc null
 *   variant       — như `StyledName`; mặc định "compact" cho danh sách
 *   verified      — hiện tích xác minh
 *   className     — class của cả hàng (cỡ chữ, màu, độ đậm)
 *   nameClassName — class thêm cho riêng phần tên
 *   badgeClassName — class thêm cho tích xác minh
 */
export default function UserName({
  name,
  theme = null,
  variant = "compact",
  verified = false,
  className = "",
  nameClassName = "",
  badgeClassName = "",
  children,
}) {
  return (
    <span className={`inline-flex min-w-0 max-w-full items-center ${className}`}>
      <StyledName
        theme={theme}
        variant={variant}
        // The padding keeps tall script fonts and glows from being clipped by
        // the overflow that truncation needs; the margin gives the space back.
        className={`-my-[0.15em] min-w-0 truncate py-[0.15em] ${nameClassName}`}
      >
        {name}
      </StyledName>
      <NameIcon theme={theme} />
      {verified && (
        <Badges color="text-primary-500" className={`flex-shrink-0 ${badgeClassName}`} />
      )}
      {children}
    </span>
  );
}

/**
 * Chuẩn hoá các kiểu `verified` mà API trả (true, 1, "1").
 */
export function isVerified(value) {
  return value === true || value === 1 || value === "1";
}
