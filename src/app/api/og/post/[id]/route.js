import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_CACHE_HEADERS,
  loadFonts,
  loadLogo,
  fetchApi,
  fetchImage,
  truncate,
  formatCount,
} from "@/lib/og/shared";
import { markdownToBlocks } from "@/lib/og/markdown";
import {
  Frame,
  Chip,
  Stat,
  Avatar,
  VerifiedTick,
  MarkdownPreview,
} from "@/lib/og/components";
import { renderFallbackCard } from "@/lib/og/fallback";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const id = String(params.id).match(/^\d+/)?.[0];
  const [fonts, logo] = await Promise.all([loadFonts(), loadLogo()]);
  const options = { ...OG_SIZE, fonts, headers: OG_CACHE_HEADERS };

  let post = null;
  try {
    post = id ? (await fetchApi(`/v1.0/topics/${id}`))?.post : null;
  } catch {
    post = null;
  }
  // Private / followers-only / missing posts answer 4xx: show the plain brand
  // card so nothing about them leaks through the image.
  if (!post) {
    return renderFallbackCard({ logo, options, label: "Bài viết" });
  }

  const anonymous = !!post.anonymous;
  const author = post.author || {};
  const authorName = anonymous
    ? "Người dùng ẩn danh"
    : author.profile_name || author.username;
  const handle = anonymous ? null : `@${author.username}`;

  const [avatar, cover] = await Promise.all([
    anonymous
      ? null
      : fetchImage(`${process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com"}/v1.0/users/${author.username}/avatar`),
    fetchImage(post.image_urls?.[0]),
  ]);

  const blocks = markdownToBlocks(post.description || post.content);
  const score = (post.votes || []).reduce(
    (sum, v) => sum + (Number(v.vote_value) || 0),
    0
  );
  // The API sends a rounded count such as "15+" (or a malformed "00+")
  const replyCount = parseInt(post.reply_count, 10) || 0;
  const comments = replyCount > 0 ? `${replyCount}+` : "0";
  const hasCover = !!cover;

  // No line-clamp in the renderer: pick the size from the title's length so it
  // fits two lines (or three smaller ones), cutting the text at what fits.
  // 0.72em is a conservative average glyph width for bold capitals.
  const titleWidth = hasCover ? 690 : 1090;
  const perLine = (size) => Math.floor(titleWidth / (size * 0.72));
  const bigSize = hasCover ? 48 : 58;
  const big = post.title.trim().length <= perLine(bigSize) * 2 - 2;
  const titleSize = big ? bigSize : 38;
  const titleLines = big ? 2 : 3;
  const titleText = truncate(post.title, perLine(titleSize) * titleLines - 3);

  return new ImageResponse(
    (
      <Frame
        logo={logo}
        right={post.subforum?.name ? <Chip>{truncate(post.subforum.name, 28)}</Chip> : null}
      >
        <div style={{ display: "flex", flex: 1, gap: 36, marginTop: 26, minHeight: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.16,
                letterSpacing: -1,
                color: "#111827",
                maxHeight: Math.ceil(titleSize * 1.16 * titleLines),
                overflow: "hidden",
              }}
            >
              {titleText}
            </div>

            {blocks.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  flex: 1,
                  marginTop: 22,
                  padding: "22px 28px",
                  borderRadius: 24,
                  background: "#ffffff",
                  border: "1px solid #e1ebe0",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
                  overflow: "hidden",
                }}
              >
                <MarkdownPreview blocks={blocks} />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 90,
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(255,255,255,0), #ffffff)",
                  }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", flex: 1 }} />
            )}
          </div>

          {hasCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              width={340}
              style={{
                height: "100%",
                objectFit: "cover",
                borderRadius: 24,
                border: "1px solid #e1ebe0",
              }}
              alt=""
            />
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 22,
            height: 58,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <Avatar src={avatar} name={authorName} size={56} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 800 }}>
                  {truncate(authorName, 32)}
                </span>
                {author.verified && !anonymous ? <VerifiedTick size={24} /> : null}
              </div>
              <span style={{ fontSize: 20, color: "#6b7280" }}>
                {[handle, post.created_at].filter(Boolean).join("  ·  ")}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Stat icon="up" value={formatCount(score)} />
            <Stat icon="comment" value={comments} />
            <Stat icon="eye" value={formatCount(post.view_count)} />
          </div>
        </div>
      </Frame>
    ),
    options
  );
}
