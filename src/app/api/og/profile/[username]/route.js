import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_CACHE_HEADERS,
  GREEN,
  GREEN_DARK,
  loadFonts,
  loadLogo,
  fetchApi,
  fetchImage,
  truncate,
  formatCount,
} from "@/lib/og/shared";
import { Frame, Chip, Stat, Avatar, VerifiedTick } from "@/lib/og/components";
import { renderFallbackCard } from "@/lib/og/fallback";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const [fonts, logo] = await Promise.all([loadFonts(), loadLogo()]);
  const options = { ...OG_SIZE, fonts, headers: OG_CACHE_HEADERS };

  let data = null;
  try {
    data = await fetchApi(
      `/v1.0/users/${encodeURIComponent(params.username)}/profile`
    );
  } catch {
    data = null;
  }
  const user = data?.user || data;
  if (!user?.username) {
    return renderFallbackCard({ logo, options, label: "Hồ sơ" });
  }

  const profile = user.profile || {};
  const stats = user.stats || {};
  const name = profile.profile_name || user.username;
  const tier = user.member_tier || data?.member_tier;
  const bio = truncate(profile.bio, 150);
  const isAdmin = profile.role === "admin";

  const [avatar, cover] = await Promise.all([
    fetchImage(profile.profile_picture),
    fetchImage(profile.cover_photo_url, 3 * 1024 * 1024),
  ]);

  return new ImageResponse(
    (
      <Frame
        logo={logo}
        right={<Chip>Hồ sơ thành viên</Chip>}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            marginTop: 26,
            position: "relative",
            borderRadius: 28,
            background: "#ffffff",
            border: "1px solid #e1ebe0",
            boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
            overflow: "hidden",
          }}
        >
          {/* banner: the cover photo, else a green gradient */}
          <div
            style={{
              display: "flex",
              height: 170,
              ...(cover
                ? {}
                : {
                    backgroundImage: `linear-gradient(120deg, ${GREEN_DARK}, ${GREEN} 55%, #65cd5b)`,
                  }),
            }}
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                width={1096}
                height={170}
                style={{ objectFit: "cover" }}
                alt=""
              />
            ) : null}
          </div>

          <div style={{ display: "flex", padding: "0 40px", marginTop: -64 }}>
            <Avatar src={avatar} name={name} size={152} ring />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "14px 40px 0",
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 50, fontWeight: 800, letterSpacing: -1 }}>
                {truncate(name, 28)}
              </span>
              {profile.verified ? <VerifiedTick size={38} /> : null}
              {isAdmin ? <Chip strong>Quản trị viên</Chip> : null}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 4,
                fontSize: 26,
                color: "#6b7280",
              }}
            >
              <span>@{user.username}</span>
              {tier?.name ? (
                <span style={{ color: GREEN_DARK, fontWeight: 700 }}>
                  · {tier.name}
                </span>
              ) : null}
            </div>
            {bio ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 14,
                  fontSize: 28,
                  lineHeight: 1.4,
                  color: "#374151",
                  maxHeight: 80,
                  overflow: "hidden",
                }}
              >
                {bio}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 12, marginTop: "auto", paddingBottom: 26 }}>
              <Stat icon="file" value={formatCount(stats.posts)} label="bài viết" />
              <Stat icon="users" value={formatCount(stats.followers)} label="người theo dõi" />
              <Stat icon="star" value={formatCount(stats.activity_points)} label="điểm" />
            </div>
          </div>
        </div>
      </Frame>
    ),
    options
  );
}
