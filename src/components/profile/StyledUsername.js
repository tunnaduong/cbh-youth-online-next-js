"use client";

import StyledName from "@/components/profile/StyledName";
import { usernameFollowsName } from "@/lib/profileTheme";

/**
 * `@username` của người dùng. Mặc định là chữ thường; khi theme đặt
 * `username_style: "name"` (mốc Pro) thì vẽ bằng phông + hiệu ứng của
 * tên qua `StyledName`.
 *
 * Props:
 *   username — không kèm "@"
 *   theme    — `profile_theme` của người dùng từ API, hoặc null
 *   variant  — như `StyledName` ("compact": rê chuột mới hiện hiệu ứng)
 *   prefix   — mặc định "@"
 */
export default function StyledUsername({
  username,
  theme,
  variant = "compact",
  prefix = "@",
  className = "",
}) {
  if (!username) return null;

  const text = `${prefix}${username}`;

  if (!usernameFollowsName(theme)) {
    return <span className={className}>{text}</span>;
  }

  return (
    <StyledName theme={theme} variant={variant} className={className}>
      {text}
    </StyledName>
  );
}
