import { BRAND, GREEN, GREEN_DARK, GREEN_SOFT } from "./shared";

/* Satori (next/og) renders a subset of CSS: every element with more than one
   child needs display:flex, and there is no emoji font - icons are inline SVG. */

const ICONS = {
  up: "M12 19V5M5 12l7-7 7 7",
  comment: "M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l2-5.3A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
};

export function Icon({ name, size = 22, color = "#6b7280" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export function VerifiedTick({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill={GREEN} />
      <path
        d="M7 12.5l3.2 3.2L17 8.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Stat({ icon, value, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 999,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        fontSize: 24,
        fontWeight: 700,
        color: "#374151",
      }}
    >
      <Icon name={icon} size={22} />
      <span>{value}</span>
      {label ? (
        <span style={{ fontWeight: 400, color: "#6b7280" }}>{label}</span>
      ) : null}
    </div>
  );
}

export function Chip({ children, strong = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "9px 20px",
        borderRadius: 999,
        fontSize: 24,
        fontWeight: 700,
        background: strong ? GREEN : GREEN_SOFT,
        color: strong ? "#ffffff" : GREEN_DARK,
      }}
    >
      {children}
    </div>
  );
}

/** Round avatar; falls back to the first letter on a green disc. */
export function Avatar({ src, name, size = 56, ring = false }) {
  const border = ring ? "6px solid #ffffff" : "2px solid #e5e7eb";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        width={size}
        height={size}
        style={{ borderRadius: 999, objectFit: "cover", border }}
        alt=""
      />
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 999,
        background: GREEN,
        color: "#ffffff",
        fontSize: size * 0.46,
        fontWeight: 800,
        border,
      }}
    >
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Common frame: soft green backdrop, brand row on top, content below.
 * `right` is shown in the top-right corner (forum name, type of page...).
 */
export function Frame({ logo, right, children, padding = 52 }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding,
        fontFamily: "Inter",
        color: "#111827",
        backgroundColor: "#f6fbf5",
        backgroundImage:
          "radial-gradient(circle at 100% 0%, #c7f0c2 0%, rgba(199,240,194,0) 45%), radial-gradient(circle at 0% 100%, #e3f8e0 0%, rgba(227,248,224,0) 50%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={46} height={46} alt="" />
          <span style={{ fontSize: 28, fontWeight: 800, color: GREEN_DARK }}>
            {BRAND}
          </span>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

const BLOCK_STYLES = {
  h: { fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1.3 },
  p: { fontSize: 26, fontWeight: 400, color: "#374151", lineHeight: 1.45 },
  li: { fontSize: 26, fontWeight: 400, color: "#374151", lineHeight: 1.4 },
  quote: { fontSize: 26, fontWeight: 400, color: "#4b5563", lineHeight: 1.4 },
  code: { fontSize: 22, fontWeight: 400, color: "#d1fae5", lineHeight: 1.45 },
};

export function MarkdownPreview({ blocks }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {blocks.map((b, i) => {
        const style = BLOCK_STYLES[b.type];
        if (b.type === "li") {
          return (
            <div key={i} style={{ display: "flex", gap: 14, flexShrink: 0 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  marginTop: 12,
                  borderRadius: 999,
                  background: GREEN,
                  flexShrink: 0,
                }}
              />
              <div style={{ ...style, display: "flex", flex: 1 }}>{b.text}</div>
            </div>
          );
        }
        if (b.type === "quote") {
          return (
            <div
              key={i}
              style={{
                display: "flex",
                borderLeft: `6px solid ${GREEN}`,
                paddingLeft: 16,
                flexShrink: 0,
              }}
            >
              <div style={{ ...style, display: "flex" }}>{b.text}</div>
            </div>
          );
        }
        if (b.type === "code") {
          return (
            <div
              key={i}
              style={{
                display: "flex",
                padding: "12px 18px",
                borderRadius: 14,
                flexShrink: 0,
                background: "#1f2937",
              }}
            >
              <div style={{ ...style, display: "flex", whiteSpace: "pre-wrap" }}>
                {b.text}
              </div>
            </div>
          );
        }
        return (
          <div key={i} style={{ ...style, display: "flex", flexShrink: 0 }}>
            {b.text}
          </div>
        );
      })}
    </div>
  );
}
