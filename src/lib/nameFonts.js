import {
  Oswald,
  Dancing_Script,
  Grandstander,
  Lexend,
  Grenze_Gotisch,
  VT323,
  Protest_Guerrilla,
  Bangers,
  Tektur,
  Bungee,
  Patrick_Hand,
} from "next/font/google";

/**
 * Phông chữ cho tên hiển thị (kiểu Display Name Styles của Discord).
 *
 * Chỉ dùng Google Fonts có bộ ký tự tiếng Việt — font thiếu dấu sẽ làm vỡ
 * tên. `preload: false` nên file font chỉ được tải khi trang thực sự hiển
 * thị một tên dùng font đó.
 *
 * Key phải khớp ProfileThemeService::NAME_FONTS phía API.
 */
// next/font needs literal options on every call (no shared object/spread).
const oswald = Oswald({
  subsets: ["latin", "vietnamese"],
  weight: "600",
  display: "swap",
  preload: false,
});
const dancingScript = Dancing_Script({
  subsets: ["latin", "vietnamese"],
  weight: "700",
  display: "swap",
  preload: false,
});
const grandstander = Grandstander({
  subsets: ["latin", "vietnamese"],
  weight: "800",
  display: "swap",
  preload: false,
});
const lexend = Lexend({
  subsets: ["latin", "vietnamese"],
  weight: "600",
  display: "swap",
  preload: false,
});
const grenzeGotisch = Grenze_Gotisch({
  subsets: ["latin", "vietnamese"],
  weight: "700",
  display: "swap",
  preload: false,
});
const vt323 = VT323({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  display: "swap",
  preload: false,
});
const protestGuerrilla = Protest_Guerrilla({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  display: "swap",
  preload: false,
  // next/font has no fallback metrics for this font and warns on every build.
  adjustFontFallback: false,
});
const bangers = Bangers({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  display: "swap",
  preload: false,
});
const tektur = Tektur({
  subsets: ["latin", "vietnamese"],
  weight: "700",
  display: "swap",
  preload: false,
});
const bungee = Bungee({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  display: "swap",
  preload: false,
});
const patrickHand = Patrick_Hand({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  display: "swap",
  preload: false,
});

export const NAME_FONTS = {
  default: { label: "Mặc định", className: "" },
  condensed: { label: "Cao gọn", className: oswald.className },
  script: { label: "Thư pháp", className: dancingScript.className },
  bubbly: { label: "Tròn trịa", className: grandstander.className },
  modern: { label: "Hiện đại", className: lexend.className },
  gothic: { label: "Cổ điển", className: grenzeGotisch.className },
  // VT323 is drawn small for its size - bump it so it lines up with the rest.
  pixel: { label: "Pixel", className: `${vt323.className} text-[1.25em] leading-none` },
  spooky: { label: "Gai góc", className: protestGuerrilla.className },
  comic: { label: "Truyện tranh", className: `${bangers.className} tracking-wide` },
  tech: { label: "Công nghệ", className: tektur.className },
  heavy: { label: "Đậm chất", className: bungee.className },
  handwritten: { label: "Viết tay", className: patrickHand.className },
};

export function getNameFontClass(key) {
  return NAME_FONTS[key]?.className || "";
}
