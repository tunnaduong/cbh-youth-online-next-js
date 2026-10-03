# INFO — CBH Youth Online — Web (Next.js)

> **For AI agents.** Project map for agents working in this repo: how it connects to the sibling repos, features, structure, setup, conventions and recent work. Humans: see `README.md`. Keep this file current - add to **Recent work** and update other sections whenever you change the repo.

- **Default branch: `main`** - unless the user names another branch, branch off an up-to-date `main` and open a PR into it (direct pushes are rejected).

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
| Account | `/login` (+ Google/Facebook OAuth), `/register`, `/password/reset`, `/email/verify`, `/settings` (+`appearance`), `/unsubscribe`, `/auth/{set-token,complete}` |
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
├── components/           # UI by area: chat, forum, home, profile, stories, wallet, shop, modals, ui (shadcn-style), maintenance
│   ├── AppBanner.js      # "Open in app" banner (hidden in app mode)
│   └── LoadingWrapper.js # Initial web splash (hidden in app mode)
├── contexts/             # Auth, Chat, ForumData, Notification, TopUsers, theme; provider/ holds the providers
├── hooks/                # Composer, mention/slash input, view tracking, service worker, useIsDarkMode
├── layouts/              # DefaultLayout, HomeLayout, HelpCenterLayout
├── lib/                  # echo.js (realtime), deepLink.js, profileTheme, nameFonts, storyOverlays, mentionMarkdown
├── services/api/         # AxiosCustom.js (instance + interceptors), ApiByAxios.js (get/post/put/patch/delete)
├── utils/                # cookies.js (auth cookie), appMode.js, serverFetch.js, savedAccounts.js (account switcher), externalLink, linkPreview, seo, pushNotifications…
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
- **App mode for admin (PR #29, `feat/mobile-web-session`):** added `utils/appMode.js` and made the splash and app banner hide for the whole session. In app mode admin hides home/theme/logout. Admin no longer scrolls sideways on phones: the inner `Layout` has `minWidth: 0` so wide tables scroll inside their own box, and the header padding is 12px on small screens.
- **Admin returns to the right page after login (PR #29):** `AdminShell` passes `?next=` and `/admin/login` returns there, including when a cookie is already present.
- **Login handoff from the mobile app (PR #29):** `/auth/set-token?code=` redeems the code through the API, and `return` is limited to same-site paths. Matching API endpoints: `POST /v1.0/web-session/{handoff,redeem}`.
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
