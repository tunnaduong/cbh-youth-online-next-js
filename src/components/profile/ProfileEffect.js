"use client";

import { useEffect, useState } from "react";
import { normalizeTheme, themeColors } from "@/lib/profileTheme";

// Fixed (not random) positions so server and client render the same markup.
const SPOTS = [
  [8, 18], [22, 62], [35, 12], [48, 44], [61, 76], [73, 24], [86, 58],
  [14, 84], [29, 36], [42, 90], [55, 8], [68, 50], [80, 88], [93, 30],
  [5, 46], [18, 6], [39, 70], [52, 26], [64, 94], [77, 40], [90, 12],
];

// Discord plays a profile effect briefly each time the profile is opened.
const PLAY_MS = 6000;

/**
 * Hiệu ứng động phủ lên ảnh bìa/thẻ trang cá nhân (kiểu Profile Effect của
 * Discord). Đặt trong phần tử `relative overflow-hidden`. Chạy khoảng 6 giây
 * rồi mờ dần; đổi `replayKey` để chạy lại (trình chỉnh sửa dùng khi đổi hiệu
 * ứng). Không chạy khi bật prefers-reduced-motion (CSS ẩn đi).
 */
export default function ProfileEffect({ theme, replayKey }) {
  const normalized = normalizeTheme(theme);
  const effect = normalized?.profile_effect || "none";
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    setPlaying(true);
    const timer = setTimeout(() => setPlaying(false), PLAY_MS);
    return () => clearTimeout(timer);
  }, [effect, replayKey]);

  if (effect === "none") return null;

  const [primary, accent] = themeColors(normalized);

  return (
    <div
      aria-hidden="true"
      className={`profile-effect absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${
        playing ? "opacity-100" : "opacity-0"
      }`}
    >
      {effect === "sparkles" &&
        SPOTS.map(([x, y], i) => (
          <span
            key={i}
            className="profile-effect-sparkle absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${(i % 7) * 0.35}s`,
              color: i % 3 === 0 ? "#fde68a" : "#ffffff",
              fontSize: `${10 + (i % 4) * 4}px`,
            }}
          >
            ✦
          </span>
        ))}

      {effect === "hearts" &&
        SPOTS.slice(0, 14).map(([x], i) => (
          <span
            key={i}
            className="profile-effect-heart absolute bottom-0"
            style={{
              left: `${x}%`,
              animationDelay: `${(i % 7) * 0.5}s`,
              animationDuration: `${3 + (i % 3)}s`,
              color: i % 2 ? "#f472b6" : "#fb7185",
              fontSize: `${12 + (i % 3) * 6}px`,
            }}
          >
            ♥
          </span>
        ))}

      {effect === "snow" &&
        SPOTS.map(([x], i) => (
          <span
            key={i}
            className="profile-effect-snow absolute -top-3 rounded-full bg-white"
            style={{
              left: `${x}%`,
              width: `${3 + (i % 3) * 2}px`,
              height: `${3 + (i % 3) * 2}px`,
              animationDelay: `${(i % 7) * 0.4}s`,
              animationDuration: `${3.5 + (i % 4) * 0.7}s`,
              boxShadow: "0 0 4px rgba(255,255,255,0.9)",
            }}
          />
        ))}

      {effect === "aurora" && (
        <>
          <span
            className="profile-effect-aurora absolute -inset-x-1/4 -top-1/2 h-[120%] rounded-full blur-3xl opacity-70"
            style={{ background: `radial-gradient(closest-side, ${primary}, transparent)` }}
          />
          <span
            className="profile-effect-aurora absolute -inset-x-1/4 -top-1/3 h-full rounded-full blur-3xl opacity-60"
            style={{
              background: `radial-gradient(closest-side, ${accent}, transparent)`,
              animationDelay: "-3s",
              animationDirection: "reverse",
            }}
          />
          {SPOTS.slice(0, 10).map(([x, y], i) => (
            <span
              key={i}
              className="profile-effect-sparkle absolute text-white"
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.3}s`, fontSize: "9px" }}
            >
              ✦
            </span>
          ))}
        </>
      )}
    </div>
  );
}
