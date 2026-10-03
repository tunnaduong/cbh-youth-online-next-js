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
 * Key phải khớp ProfileThemeService::OPTIONS['name_font'] phía API.
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

/**
 * Fonts the API hosts (GET /v1.0/name-fonts): any `name_font` key that isn't
 * bundled above. The list is fetched once; each font becomes an @font-face
 * rule plus a `.name-font-srv-<key>` class, so the browser only downloads a
 * font file when a name using it is actually on screen - and new fonts added
 * on the server work without a new build.
 */
let serverFontsPromise = null;

export function ensureServerNameFonts() {
  if (typeof window === "undefined") return Promise.resolve([]);

  if (!serverFontsPromise) {
    serverFontsPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1.0/name-fonts`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => (res.ok ? res.json() : { fonts: [] }))
      .then(({ fonts = [] }) => {
        const clean = (value) => String(value).replace(/["\\\n\r<>]/g, "");
        const css = fonts
          .filter((font) => /^[a-z0-9]+$/.test(font.key))
          .map(
            (font) =>
              // The files are single-weight; the 100-900 range stops the
              // browser from faking bold on top of them.
              `@font-face{font-family:"${clean(font.family)}";src:url("${clean(font.url)}") format("truetype");font-weight:100 900;font-display:swap;}` +
              `.name-font-srv-${font.key}{font-family:"${clean(font.family)}",ui-sans-serif,system-ui,sans-serif;}`
          )
          .join("\n");

        const style = document.createElement("style");
        style.dataset.nameFonts = "server";
        style.textContent = css;
        document.head.appendChild(style);

        return fonts;
      })
      .catch(() => {
        // Let a later render try again; names fall back to the default font.
        serverFontsPromise = null;
        return [];
      });
  }

  return serverFontsPromise;
}

export function getNameFontClass(key) {
  if (!key || key === "default") return "";
  if (NAME_FONTS[key]) return NAME_FONTS[key].className;
  if (!/^[a-z0-9]+$/.test(key)) return "";

  ensureServerNameFonts();
  return `name-font-srv-${key}`;
}
