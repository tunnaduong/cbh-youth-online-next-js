import { ImageResponse } from "next/og";
import { Frame, Chip } from "./components";
import { GREEN_DARK } from "./shared";

/** Brand-only card: unknown / private content and the generic pages. */
export function renderFallbackCard({
  logo,
  options,
  label,
  title = "Diễn đàn học sinh Chuyên Biên Hòa",
  description = "Cộng đồng học sinh THPT Chuyên Biên Hòa, Hà Nam: hỏi đáp, chia sẻ, tin tức và tài liệu.",
}) {
  return new ImageResponse(
    (
      <Frame logo={logo} right={label ? <Chip>{label}</Chip> : null}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: title.length > 40 ? 68 : 84,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -2,
              color: "#111827",
              maxHeight: 300,
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              lineHeight: 1.4,
              color: "#4b5563",
              maxHeight: 140,
              overflow: "hidden",
            }}
          >
            {description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            color: GREEN_DARK,
          }}
        >
          chuyenbienhoa.com
        </div>
      </Frame>
    ),
    options
  );
}
