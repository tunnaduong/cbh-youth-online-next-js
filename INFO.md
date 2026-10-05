# INFO — CBH Youth Online — Web (Next.js)

> **For AI agents.** Project map for agents working in this repo: how it connects to the sibling repos, features, structure, setup, conventions and recent work. Humans: see `README.md`. Keep this file current - add to **Recent work** and update other sections whenever you change the repo.

- **Default branch: `main`** - unless the user names another branch, branch off an up-to-date `main` and open a PR into it (direct pushes are rejected).
- **Find code via this file first**: check the project structure / features sections below before grepping the repo by hand.

The web app at **https://chuyenbienhoa.com** (also `www.`): the student community/forum for THPT Chuyên Biên Hòa (Hà Nam). It's built with Next.js 14 (App Router) and React 18. The UI text is in Vietnamese. All data comes from the Laravel API.

> Read **How the repos connect** and **Conventions** before changing auth, cookies or anything under `/admin`.

---

## Sibling repos

| Repo (local path) | What it is |
| --- | --- |
| [cbh-youth-online-api](https://github.com/tunnaduong/cbh-youth-online-api) | Laravel API at `https://api.chuyenbienhoa.com`, routes under `/v1.0/...`. Auth is Sanctum bearer tokens. Realtime is Reverb/Pusher. |
| [cbh-youth-online-next-js](https://github.com/tunnaduong/cbh-youth-online-next-js) | **This repo**: the main website, including the `/admin` dashboard. |
| [cbh-youth-online-mobile](https://github.com/tunnaduong/cbh-youth-online-mobile) | Expo / React Native app (iOS + Android). It opens some web pages in its in-app browser or in WebViews. |
| [cbh-youth-online-gift-shop](https://github.com/tunnaduong/cbh-youth-online-gift-shop) | Gift shop at `giftshop.chuyenbienhoa.com` (Next.js 16, TypeScript). It has no login of its own and reads this site's cookie. |

## How the repos connect

- **API base URL:** `NEXT_PUBLIC_API_URL`, the host only, e.g. `https://api.chuyenbienhoa.com`. Call paths include `/v1.0/...`. On the client it's used by `src/services/api/AxiosCustom.js`; on the server by `src/utils/serverFetch.js`, which falls back to the production URL. All client endpoint wrappers live in `src/app/Api.js`.
- **Auth:**
  - **What's stored:** a Sanctum token kept in the `auth_token` cookie, plus localStorage `TOKEN` and `CURRENT_USER`.
  - **Where the cookie is set:** `src/utils/cookies.js` (`setAuthCookie`). On `*.chuyenbienhoa.com` it sets `domain=.chuyenbienhoa.com`, so the gift shop and other subdomains share the login. It lasts 30 days and is `secure` only in production, so it still works on `http://localhost`.
  - **Server reads:** `serverFetch` reads the same cookie for SSR.
  - **Which token wins:** `getTokenFromAnywhere()` prefers the cookie over localStorage.
- **Handoff from the mobile app (`/auth/set-token`)**, `src/app/auth/set-token/page.js`:
  - `?code=<64 chars>` is a single-use code that expires after 60 seconds. The mobile app gets it from `POST /v1.0/web-session/handoff`. This page swaps it for a new web token via `POST /v1.0/web-session/redeem`, using plain `fetch`. It deliberately avoids axios: a bad code returns 401, and the axios 401 handler would sign out the existing web session.
  - `?access=` / `?refresh=` are used by the Google/Facebook OAuth callbacks (`src/app/login/{google,facebook}/callback/route.js`).
  - `?return=` only accepts same-site paths. `//host` and `/\host` are rejected (open-redirect fix).
- **App mode (`?app=true`):** `src/utils/appMode.js` `isInApp()` remembers the flag in sessionStorage (`cbh_app_mode`) for the whole session. The mobile WebView also sets the flag before every page load. In app mode the site hides:
  - the web splash (`LoadingWrapper`)
  - the "open in app" banner (`AppBanner`)
  - in admin: "Về trang chủ" (back to home), the theme toggle, and the avatar dropdown (Trang chủ / Đăng xuất)

  The games and quiz pages (`src/app/explore/...`) still check `?app=true` directly.
- **Theme from the app:** the mobile WebView writes localStorage `theme` (`light`/`dark`) before the page loads. `src/contexts/themeContext.js` reads it.
- **Realtime:** `src/lib/echo.js` (Laravel Echo + pusher-js, configured by the `NEXT_PUBLIC_REVERB_*` variables). Web push uses `public/sw.js` and `src/utils/pushNotifications.js`; see `WEB_PUSH_NOTIFICATIONS.md`.

## Features (from `src/app`)

| Area | Routes / notes |
| --- | --- |
| Home / feed | `/` (home feed, `components/home`), `/feed` |
| Forum | `/forum/[forumId]/[subforumId]`; posts at `/[username]/posts/[id]-[slug]` |
| Composer | `/composer`: rich editor (TipTap, mentions, slash commands, image compression) |
| Profiles | `/[username]`, `/[username]/[tab]`. Discord-style profile theme: frames, effects, name styles, points milestones (`src/lib/profileTheme.js`, `src/lib/nameFonts.js`) |
| Chat | `/chat` (private and group chat, realtime), `/invite/[token]` (group invite) |
| Stories | `src/components/stories` (viewer, overlays in `src/lib/storyOverlays.js`) |
| Explore | `/explore`, `/explore/games` (+`[slug]`), `/explore/quiz` (+`custom`), `/explore/study-materials` (+`[id]`, `upload`), `/explore/universities` |
| Points & money | `/wallet` (+`deposit`, `withdraw`; SePay QR, see `SEPAY_*.md`), `/guide/points`, `/users/ranking` |
| Shop | `/shop` (the main gift shop is the separate repo) |
| Search / saved / archives | `/search`, `/saved`, `/my-archives` |
| Lookup | `/lookup`, `/lookup/grades` |
| Content pages | `/youth-news`, `/jobs`, `/ads`, `/about`, `/contact`, `/help` (+`[categorySlug]`), `/policy/{forum-rules,privacy,terms}`, `/feedback` |
| Account | `/login` (+ Google/Facebook OAuth, two-factor code step), `/register`, `/password/reset`, `/email/verify`, `/settings` (+`appearance`; the Account tab holds two-factor settings and logged-in devices, `src/components/settings`), `/unsubscribe`, `/auth/{set-token,complete}` |
| Links | `/link/[token]` (outbound-link warning page; the token is the URL in base64url, shared format with the app), `/open/[type]/[value]` (app deep-link opener), `/api/link-preview` (OG preview cards) |
| Easter egg | `/egg` (rewritten to `public/egg.html` in `next.config.mjs`) |
| Admin | `/admin/*`: dashboard, posts, comments, moderation, reports, users, student verifications, deposits, withdrawals, feedback, messages, notifications, study materials, shop (categories, products, orders) |

### How admin sign-in works
- `src/app/admin/AdminShell.js` checks the sessionStorage flag `cbh_admin_session`. Without it, it redirects to `/admin/login?next=<path>`.
- `/admin/login` (`src/app/admin/login/page.js`) has two paths:
  - **If an `auth_token` cookie already exists:** it sets the flag and goes to `next`, which must be an `/admin…` path. This doesn't check the role; the API's admin endpoints are what enforce it.
  - **The login form:** it signs in and requires `role === "admin"`.

## Project structure

```
src/
├── app/                  # App Router routes (see Features). Api.js = all client API calls
│   ├── admin/            # Admin dashboard (antd). AdminShell.js = layout/nav/auth gate, _components/ = ResourceTable, charts
│   ├── auth/set-token/   # Login handoff (OAuth callbacks + mobile ?code=)
│   └── api/link-preview/ # Route handler for OG link previews
├── components/           # UI by area: chat, forum, home, profile, stories, wallet, shop, settings, modals, ui (shadcn-style), maintenance
│   ├── AppBanner.js      # "Open in app" banner (hidden in app mode)
│   └── LoadingWrapper.js # Initial web splash (hidden in app mode)
├── contexts/             # Auth, Chat, ForumData, Notification, TopUsers, theme; provider/ holds the providers
├── hooks/                # Composer, mention/slash input, view tracking, service worker, useIsDarkMode
├── layouts/              # DefaultLayout, HomeLayout, HelpCenterLayout
├── lib/                  # echo.js (realtime), deepLink.js, profileTheme, nameFonts, storyOverlays, mentionMarkdown
├── services/api/         # AxiosCustom.js (instance + interceptors), ApiByAxios.js (get/post/put/patch/delete)
├── utils/                # cookies.js (auth cookie), appMode.js, serverFetch.js, savedAccounts.js (account switcher), clientInfo.js (device headers), twoFactorDevice.js (remembered-device cookie), externalLink, linkPreview, seo, pushNotifications…
└── data/                 # Static content: help articles, explore features
public/                   # sw.js (push), egg.html, images, robots.txt, ads.txt
e2e/                      # Playwright: smoke.spec.ts, routes.spec.ts (every static route must render)
.well-known/              # apple-app-site-association (iOS universal links; served as JSON via vercel.json/netlify.toml)
.cursor/rules/            # api-routes.mdc = snapshot of the API route list (handy reference)
```

## Setup

The repo uses **npm**: there's a `package-lock.json`, CI runs `npm ci`, and `.npmrc` sets `legacy-peer-deps=true`. CI uses Node 22. `postinstall` runs `patch-package`, though there's currently no `patches/` folder.

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint         # next lint (also enforced during build: ignoreDuringBuilds=false)
npm run test:e2e     # Playwright; builds and starts the app on 127.0.0.1:3000 itself
```

The first time, run `npx playwright install chromium` before `test:e2e`.

### Environment variables (`.env.example`)
| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API host, e.g. `https://api.chuyenbienhoa.com` (no `/v1.0`) |
| `NEXT_PUBLIC_HIDE_LOADING` | `true` turns off the initial splash |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` | Google OAuth |
| `NEXT_PUBLIC_FACEBOOK_CLIENT_ID/SECRET/REDIRECT_URI` | Facebook OAuth |
| `NEXT_PUBLIC_REVERB_APP_KEY/HOST/PORT/SCHEME` | Realtime (Reverb) |

`next.config.mjs` lists the image hosts allowed by `next/image` (`api.chuyenbienhoa.com`, `cbh-youth-online-api.test`) and the `/egg` rewrite.

## Deploy and branch rules
- It deploys on **Vercel** (several projects: `cbh-youth-online-next-js`, `cbhonline`, `cbhtest`) and on a **Netlify** preview (`chuyenbienhoa`).
- **`main` is protected.** Direct pushes are rejected. Changes have to go through a pull request with:
  - an approving review (you can't approve your own PR; the owner is `tunnaduong`)
  - the **Playwright E2E** check passing (`.github/workflows/e2e.yml`)
  - successful Vercel Preview and Production deployments

  Work on a feature branch, open a PR, and click "Update branch" if it falls behind `main`.

## Conventions
- **Commits:** conventional style, with the message body in **Vietnamese**, e.g. `feat(auth): …`, `fix(admin): …`.
- **Styling:** Tailwind (`dark:` variants; dark mode comes from a `dark` class on `<body>` set by `themeContext`). The admin uses **antd 5** with `ConfigProvider` + `vi_VN`. Also used: Radix/shadcn-style `components/ui`, lucide/antd icons.
- **API calls:** go through `src/app/Api.js` → `ApiByAxios` → `AxiosCustom`.
  - **Request interceptor:** adds `Authorization: Bearer <cookie or localStorage token>`, plus `X-Socket-Id` for Echo `toOthers()`.
  - **On a 401:** removes the dead token from `SAVED_ACCOUNTS`. If that token is still the active one, it clears `TOKEN`, `CURRENT_USER` and the cookie, then redirects to `/login`. So never send a request whose expected failure is a 401 (like redeeming a code) through axios.
  - **When the API is unreachable:** it shows the maintenance screen (`components/maintenance`).
- **SSR data:** use `src/utils/serverFetch.js`. It forwards the cookie token.
- **New static routes:** add them to `e2e/routes.spec.ts`.
- **Client-only checks** (`window`, sessionStorage, app mode) belong in a `useEffect` so hydration matches the server render.

## Recent work (newest first, as of 2026-10)
- **App-association files for native mobile passkeys; device-only passkeys; no rank for admins (branch `feat/native-passkey-association`; checked by the CI build, not run in a browser):**
  - `public/.well-known/apple-app-site-association` (moved from the repo root, where it was never served) and new `public/.well-known/assetlinks.json` (package `com.fatties.youth` + the SHA-256 of the APK signing certificate - **add a line when the app is signed with another key**). iOS and Android read them from the bare domain `chuyenbienhoa.com` (the passkeys' relying party) and **do not follow redirects**.
  - `next.config.mjs` `redirects()`: bare domain → `www` for everything **except `/.well-known`**. It replaces the domain-level redirect in Vercel, which also redirected those two files. **The Vercel project must have `chuyenbienhoa.com` set to serve the site (not "redirect to www")** for this to take effect; until then the mobile app's passkeys answer "not configured".
  - Passkeys are created on the device itself (the API asks for the platform authenticator): `PasskeySettings` hides "Thêm passkey" on a device without a screen lock / Windows Hello and says why.
  - Home page: `ProfileCard` / `RankingCard` show no rank for admins (they are not in the ranking; the API now sends `rank: null`).
- **Passkey on Android / in-app browsers (PR #33; not built or run, no Android device at hand):** `webauthn.js` times the prompt (`runPrompt`): a `NotAllowedError` within 1s means the browser never opened it, and `passkeyErrorMessage` then says to use Chrome and check screen lock + Google account (Android) instead of the generic text. `inEmbeddedBrowser()` spots another app's built-in browser (Android WebView `; wv)`, Facebook, Instagram, Zalo, TikTok, Line), where the passkey API exists but refuses everything: the error says to open the site in Chrome/Safari and `PasskeySettings.js` shows that hint up front. `prepareLoginOptions().take()` waits for a fetch already under way instead of starting a second one.
- **Uploads: 720p at 30 fps, smaller files (PR #33; checked by CI build, not run in a browser):** `videoCompression.js` drops frames above 30 fps (`MAX_FPS`), encodes at up to 2.5 Mbps (was 4.7) and only skips re-encoding for a file that is already H.264, 720p, 30 fps and within that bitrate; photos are JPEG quality 80 (was 85) in `imageUpload.js`.
- **Two-factor: option to skip it on Google/Facebook/Apple logins (branch `fix/passkey-feedback`, PR #33; not built or run):** a switch in `TwoFactorSettings.js`, shown while two-factor is on (`status.skip_social_login`, `PUT /v1.0/two-factor/social-login {skip}` via `setTwoFactorSocialLogin`). On by default on the API. Also: `e2e/routes.spec.ts` no longer waits for `networkidle` on navigation (the home page never goes idle; it timed out /, /chat and /auth/set-token in CI).
- **Sessions handed over by the mobile app (PR #32; not run):** `/auth/set-token?logout=1` drops the session and revokes it on the API when the app handed it over; a new `?code=` handoff revokes the previous app-handed session. App-handed sessions carry a `cbh_session_source=app` cookie (`markSessionFromApp`/`isSessionFromApp`/`clearSessionSource` in `utils/cookies.js`, cleared by `setAuthCookie`/`removeAuthCookie`). `utils/clientInfo.js` labels the device: user agent containing `CBHYouthApp/` → "WebView trong ứng dụng CBH Youth", app-handed browser → "<browser> · mở từ ứng dụng".
- **Passkey hand-off link + gradient clear (PR #32; not run):** `/auth/passkey` shows a "Quay lại ứng dụng" link to the app's return URL once the passkey is accepted (in-app browsers can refuse a scripted redirect to an app link); the gradient colour pickers in `ProfileCustomizer.js` have a clear button that goes back to a single colour.
- **Client-side media compression + review fixes (PR #32; not built or run):** the API no longer compresses uploads, so the browser does. `src/utils/videoCompression.js` re-encodes MP4/MOV to 720p H.264 with WebCodecs (mp4box + mp4-muxer loaded on demand from jsDelivr; audio copied as is) and falls back to the original file whenever it can't (no WebCodecs, other containers, undecodable codec, already small). `src/utils/mediaCompression.js` (`compressMediaForUpload`) wraps it with a "Đang nén video... N%" notice and is called in chat (`ChatProvider`, `PublicChat`), comments (`PostClient`) and stories (`CreateStoryModal`); the composer (`usePostComposer`, `CreatePostModal`) shows its own "Đang nén ảnh/video..." stage; photos now use the old server limits (1470px wide, quality 85), including inline/pasted images. Review fixes: `/admin/login` sends 2FA accounts to `/login`; theme "auto" is now saved; `MediaLoadingWatcher` also clears already-loaded media and listens for `loadedmetadata`; the email-code text no longer claims a code was sent when it wasn't; server font labels in `PointsMilestones`.
- **Post videos keep a 16:9 box (PR #32; not run):** `<video>` in `PostItem.js` has `aspect-video`, `playsInline` and a poster when the API sends `video_thumbnail_urls`, so a video that hasn't loaded or can't be decoded no longer collapses into a controls bar that looks like an audio player. The actual cause of "videos render as audio" was server-side: videos were compressed to H.265, which Chrome/Firefox can't decode (fixed in the API, which now encodes H.264; existing videos need `php artisan videos:reencode-hevc`).
- **Passkey login, server fonts, gradient colours, story styles, media shimmer, antd dark-mode fix (PR #32, branch `feat/name-style-premium`; not built or run):**
  - **Passkey login (not a 2FA method):** a key button beside the social logins on `/login` logs in with the device's passkey - nothing typed, no two-factor step (`handlePasskeyLogin`, `src/utils/webauthn.js`). Settings → Tài khoản → "Passkey" (`src/components/settings/PasskeySettings.js`) lists/adds/removes passkeys (adding asks for the password). `/auth/passkey` is the page the **mobile app** opens in its in-app browser: it runs the prompt and returns a one-time code to the app's deep link (`#app_challenge=…&scheme=…`). Passkeys are bound to `chuyenbienhoa.com` (API `WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGINS`), so they don't work on preview deploys or localhost unless the API is configured for that origin.
  - **Server-hosted name fonts:** `getNameFontClass` returns `name-font-srv-<key>` for any key not bundled in `NAME_FONTS`, and `ensureServerNameFonts()` fetches `GET /v1.0/name-fonts` once and injects the `@font-face` rules. `flex`/`grotesk` now come from there too (the Google Fonts `@import`s are gone). Labels for these come from the editor options (`option.label`).
  - **Gradient theme colours (1500 points):** `primary_color_2` / `accent_color_2` / `banner_color_2` in `normalizeTheme`; `themeStops()` feeds `themeGradient`/`getSurfaceStyle`, `getBannerStyle` draws a banner gradient. `ProfileCustomizer` shows a "Màu chuyển sắc" row under each colour (locked below the tier, from `editor.color_gradient`).
  - **Stories:** tray and viewer show the author's `profile_theme`: `StyledName` for the name, and the avatar frame (Khung) replaces the plain ring when one is picked (unchanged ring otherwise).
  - **Media loading:** `.media-loading` shimmer class (globals.css) on post videos, collage/comment image placeholders, chat images/videos, story cards, link previews, profile cover and gallery; `.iframe-wrapper` embeds shimmer too. `MediaLoadingWatcher` (in `layout.js`) removes the class once the element has loaded.
  - **Dark mode fix:** `ThemeContext` now exposes `resolvedTheme`; `AntdProvider` uses it (with theme "auto" on a dark system antd modals/inputs/pickers stayed light) and passes the theme to static `Modal.confirm`/`message` via `ConfigProvider.config({ holderRender })`.
- **Name style: 2 fonts, 2 effects, new 1500-point tier (branch `feat/name-style-premium`; not built or run):** (the two fonts are now server-hosted, see above) effects `rainbow` (animated, ignores the picked colours) and `outline` (text colour = `name_colors[0]`, border = `name_colors[1]`) in `getNameEffect`; `NameStyleModal` hides the colour pickers for rainbow and shows two for outline. New tier `premium` ("Thành viên cao cấp", 1500 points) added to `MemberTierBadge`, the profile milestone descriptions and `PointsInfoSidebar`. Needs the API change that adds the keys and the tier.
- **Admin users: reset password / turn off 2FA (PR #31; not run):** `/admin/users` rows get "Đặt lại mật khẩu" (shows the temporary password once in a dialog; disabled for admins) and, for accounts with two-factor on, "Tắt 2FA" plus a `2FA` tag in the status column. API: `POST /v1.0/admin/users/{id}/{reset-password,reset-two-factor}`.
- **2FA: several methods at once + recovery-code download (PR #31; not run):** `TwoFactorSettings.js` now has one switch per method (email code, authenticator app) instead of a single switch with a method picker; both can be on. Adding a second method keeps the existing recovery codes. The recovery-code panel has a "Tải tệp .txt" button beside copy. On the login code step the user picks the method when the challenge lists more than one (`methods`), and picking email sends the code if none went out yet (`email_sent`); the OAuth callbacks pass both fields through the hand-off cookie. Needs the matching API change (`methods` in status/challenge, `method` on confirm/disable/verify).
- **2FA settings switch fixes (PR #31; from code review, not run):** in `TwoFactorSettings.js` the switch now follows the step in progress (on while setting up, off while confirming turn-off) and clicking it back cancels that step, instead of staying put and locked. Cancelling a setup waits for the server before the controls unlock, so a quick restart can't be wiped by the late cancel request. Enter in an empty code box no longer submits. On the login code step, "Quay lại đăng nhập" clears the wrong-code message. Also: the authenticator QR code is forced black-on-white (it was invisible in dark mode); confirm buttons stay off until their password/code field is filled, and Enter submits; "send code" and "forget devices" ignore double clicks; `DeviceSessions.js` asks before logging a device out.
- **Two-factor login, 2FA settings, logged-in devices (PR #31, branch `feat/two-factor-auth`; written on a machine without Node, so check the PR's CI and try it before merging).** Needs the API changes already on the API repo's `main` (two-factor endpoints, `/v1.0/sessions`, four migrations).
  - **Login** (`src/app/login/LoginClient.js`): when `POST /v1.0/login` answers `two_factor_required`, the page shows a code step (app/email code or a recovery code, "remember this device", resend for email) and finishes through `verifyTwoFactorLogin`. A 410 `challenge_expired` sends the user back to the password step.
  - **Google/Facebook** (`src/app/login/{google,facebook}/callback/route.js`): a challenge from `/login/oauth` is handed to `/login` in a 10-minute `two_factor_challenge` cookie; the routes also forward the `tf_device` cookie and the browser's device headers.
  - **Remembered device token** lives in the `tf_device` cookie (60 days, `src/utils/twoFactorDevice.js`), a cookie rather than localStorage so the OAuth server routes can read it.
  - **Settings → Tài khoản** (`src/components/settings/`): `TwoFactorSettings.js` (switch, email code or authenticator app with antd `QRCode`, recovery codes, remembered devices) and `DeviceSessions.js` (device name, model, platform + version, last active; log out one / all others).
  - **Device headers**: `src/utils/clientInfo.js` builds `X-Client-Platform: web`, `X-Client-Version`, `X-Device-Name` (OS) and `X-Device-Model` (browser), added to every axios request in `AxiosCustom.js`. `NEXT_PUBLIC_APP_VERSION` is set from `package.json` in `next.config.mjs`.
- **App mode for admin (PR #29, merged):** added `utils/appMode.js` and made the splash and app banner hide for the whole session. In app mode admin hides home/theme/logout. Admin no longer scrolls sideways on phones: the inner `Layout` has `minWidth: 0` so wide tables scroll inside their own box, and the header padding is 12px on small screens.
- **Admin returns to the right page after login (PR #29, merged):** `AdminShell` passes `?next=` and `/admin/login` returns there, including when a cookie is already present.
- **Login handoff from the mobile app (PR #29, merged):** `/auth/set-token?code=` redeems the code through the API, and `return` is limited to same-site paths. Matching API endpoints: `POST /v1.0/web-session/{handoff,redeem}`.
- **OG link preview cards** in posts and chat messages (`/api/link-preview`, `utils/linkPreview.js`; PR #28).
- **Discord-style profile customization:** name styles and avatar frames shown on posts, comments, chat, rankings and notifications; theme editor with frames, effects and points milestones.
- **Composer:** compresses images before upload so posting many images no longer hangs (#25).
- **Auth cookie on localhost:** stopped silently dropping it on http (#24); `secure` is now only set in production.
- **Post images:** switched to antd `Image.PreviewGroup` (react-photo-collage removed).
- **Profile:** "Thích" (likes) stat opens the liked-posts tab with sorting; mobile stats use desktop-style cards; member milestone badge on desktop.
- **Points:** "Tặng điểm cho tác giả" (gift points to the author) in the post `…` menu.
- **Blocking:** after you block someone you're taken off their profile or chat and the chat list refreshes.

## More docs in this repo
`WEB_PUSH_NOTIFICATIONS.md`, `BACKGROUND_PUSH_ANALYSIS.md`, `CHAT_NOTIFICATION_SUMMARY.md` (push/chat notifications); `SEPAY_LARAVEL_DOCS.md`, `SEPAY_QR_CODE_DOCS.md`, `SEPAY_WEBHOOK_DOCS.md` (wallet deposits via SePay).
