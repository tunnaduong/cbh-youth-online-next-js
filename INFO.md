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

## Design system

**Mandatory for every new or changed page or component.** This is how the site looks today; build from it instead of inventing a look. The class strings below are copied from the code - when in doubt, open the reference file and copy from there.

The site carries two generations of styling. **New work follows the current one**: the navbar (`components/include/navbar.js`, `navStyles.js`), the sidebar (`components/layout/SidebarNav.js`), the home page (`components/home/*`, start with `HomeCard.js`) and the account-security blocks (`components/settings/DeviceSessions.js`, `PasskeySettings.js`, `TwoFactorSettings.js`). Older pages (the post page's `post-container shadow-lg rounded-xl`, `long-shadow`, the `components/ui/PrimaryButton.js` family from the Laravel starter, Bootstrap-like classes in `globals.css` such as `.modal`, `.row`, `.col-md-*`) still work but are **not** a model: don't copy them into new code, and when you rework one of those areas move it to the current look.

### Foundations

- **Stack**: Tailwind 3 (`tailwind.config.js`, `darkMode: "class"`) for layout and almost all styling; **antd 5** for controls and overlays; **lucide-react** for icons; a few Radix/shadcn-style pieces in `components/ui`. Global CSS lives in `src/app/globals.css`.
- **Font**: Inter everywhere (`* { font-family: "Inter" }`, antd `fontFamily` token). Name styles (`StyledName`) are the only other fonts.
- **Brand green**: `#319527` = Tailwind `primary-500` (scale `primary-50 #f3fbf2`, `100 #e3f8e0`, `200 #c7f0c2`, `300 #9ae392`, `400 #65cd5b`, `500 #319527`, `600 #287421`, `700 #245c1f`) = antd `colorPrimary`. Write `primary-500`, not `[#319527]` and not `green-600`.
- **Custom greys**: `gray-600` is `#585858` and `gray-700` is `#3C3C3C` (overridden in the Tailwind config), so `dark:bg-gray-700` equals the dark card colour. Prefer the `neutral-*` names for dark mode in new code.

### Colours (light → dark pairs)

| Role | Classes |
| --- | --- |
| Page background | set on `<body>`: `#F8F8F8` light, `#2c2f2e` dark (`.dark` rule in `globals.css`). Don't paint page-sized wrappers. |
| Card / panel | `bg-white dark:!bg-[var(--main-white)]` (`--main-white` is `#3c3c3c` in dark) - or `dark:bg-neutral-700` for a card inside a settings panel |
| Inset box inside a card | `bg-gray-50 dark:bg-neutral-800` |
| Neutral fill (icon holder, chip, thumbnail placeholder, skeleton bar) | `bg-gray-100 dark:bg-neutral-600` (`dark:bg-neutral-700` when it sits on the page rather than on a card); skeleton bars `bg-gray-200 dark:bg-neutral-600` |
| Border | cards `border-gray-200 dark:border-neutral-600` (home cards use `border-[#EBEFEA]`); dividers `divide-gray-100`/`divide-gray-200` + `dark:divide-neutral-600`; form controls `border-gray-300 dark:border-neutral-500` |
| Text - primary | `text-gray-900 dark:text-white` (or `dark:text-neutral-100`) |
| Text - body | `text-gray-700 dark:text-gray-300` |
| Text - secondary / hint | `text-gray-500 dark:text-gray-400` (or `dark:text-neutral-400`) |
| Text - icon, muted | `text-gray-400 dark:text-neutral-400` |
| Green text / link | `text-primary-500 hover:text-primary-600 dark:text-[#6bcf60] dark:hover:text-[#86dc7c]` - `primary-500` is too dark on the dark surfaces, always add the lighter green |
| Green fill | `bg-primary-500 hover:bg-primary-600` with `text-white` (the code writes `!text-white` on a `<Link>` so global link rules can't override it) |
| Green tint (hover of an outline button, soft badge) | `bg-primary-50 dark:bg-[#2b3a2a]`, text `text-primary-600 dark:text-[#86dc7c]` |
| Success badge | `bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300` |
| Error text | `text-red-500` (`dark:text-red-400` on large blocks); destructive buttons are antd `danger` |
| Warning text | `text-amber-600 dark:text-amber-400` |
| Hover on a row / ghost button | `hover:bg-gray-100 dark:hover:bg-neutral-700` |

**Dark mode rule**: every colour class needs its `dark:` partner - a background, border or text colour without one is a bug. The `dark` class is on `<body>` (set by `src/contexts/themeContext.js`; settings are light / dark / auto), so `dark:` utilities can't style `<body>` itself. antd follows the same theme through `AntdProvider` (`resolvedTheme` → `darkAlgorithm`); when JS needs to know, use `useTheme().resolvedTheme` or `useIsDarkMode()` (`src/hooks/useIsDarkMode.js`), never `theme === "dark"` (it can be `"auto"`).

### Layout and responsive rules

- Shell: `HomeLayout` = fixed navbar (`h-[69px]`, `bg-white/90 backdrop-blur-xl`, `dark:bg-[#2c2f2e]/90`, bottom border) + left sidebar (only from `xl`) + content (`mt-[4.3rem]` below the navbar) + right sidebar + footer; `DefaultLayout` = the navbar and the content only. Sticky side content sits at `lg:top-[88px]`.
- Content widths: home `mx-auto w-full max-w-[1240px]`; feed and post column `md:max-w-[775px] mx-auto w-full`; settings-style pages `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`; a form column inside a section `max-w-sm`.
- Page gutters: `px-3 sm:px-4`; vertical rhythm between cards `space-y-4 sm:space-y-5` / `gap-4 sm:gap-5`.
- Breakpoints (mobile first): `xs` 475px (custom), `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. What changes where: `sm` loosens padding and shows button labels; `md` switches the post layout to a row; `lg` shows the navbar search field and the two-column home grid (`lg:grid-cols-[minmax(0,1fr)_320px]`); `xl` shows the left sidebar and hides the mobile menu / "create" button.
- Every page must work at 360px wide: stack with `flex-col` first, add `min-w-0` + `truncate` / `break-words` to text beside fixed-size items, wrap action rows with `flex-wrap gap-2`, never give a fixed width without a `max-w-full`. Wide tables scroll inside their own box.
- Pages opened by the mobile app (`isInApp()`, `src/utils/appMode.js`) hide site chrome that makes no sense there - keep that working when you add header or account UI.

### Shapes, spacing, shadows

- **Radii**: cards and large panels `rounded-2xl`; buttons, inputs, nav items, list rows, thumbnails and inset boxes `rounded-xl`; small controls and menu items `rounded-lg`; chips, badges, avatars and icon buttons `rounded-full`. (antd controls keep their own radius; add `shape="round"` for a pill button.)
- **Spacing**: card padding `p-4 sm:p-5`; expandable-card header `p-4`; rows `py-2.5`-`py-4` with `gap-3`; icon + text `gap-2`/`gap-3`; chips `px-2.5 py-0.5`; section blocks inside a settings tab are separated by `mt-8 pt-8 border-t border-gray-200 dark:border-gray-700`.
- **Shadows**: cards are flat - border plus at most `shadow-[0_1px_3px_rgba(16,24,40,0.04)]`. `shadow-sm` for a raised button, `shadow-lg` only for popovers and dropdown menus. No `long-shadow` on new work.

### Typography

| Use | Classes |
| --- | --- |
| Page title | `text-3xl font-bold text-gray-900 dark:text-white` (subtitle `mt-2 text-gray-600 dark:text-gray-400`) |
| Settings tab title | `text-lg font-semibold` |
| Section / block title | `text-base font-semibold text-gray-900 dark:text-white` |
| Card header (home) | `text-[15px] font-semibold text-gray-900 dark:text-neutral-100`, with an 18px lucide icon in `text-primary-500` (`SectionHeader` in `HomeCard.js`) |
| Row / item title | `text-sm font-medium` (`text-[15px] font-semibold leading-snug` for a post title in a list) |
| Body, hints | `text-sm text-gray-500 dark:text-gray-400` |
| Meta, timestamps, chips | `text-xs` or `text-[12px]`/`text-[13px]`; chips `text-xs font-medium` |
| Form label | `block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2` |
| Long-form content (posts, help) | `prose dark:prose-invert` via `components/ui/MarkdownRenderer.js` |

Weights: `font-medium` (default emphasis), `font-semibold` (titles, buttons), `font-bold` (page titles, counters). Truncate single lines with `truncate`, multi-line with `line-clamp-2`.

### Components

- **Card**: use `HomeCard` (`components/home/HomeCard.js`): `rounded-2xl border border-[#EBEFEA] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.04)] dark:border-neutral-600 dark:!bg-[var(--main-white)]` + `p-4 sm:p-5`. With a header use `SectionHeader` (icon, title, optional "Xem tất cả" link).
- **List inside a card**: `divide-y divide-gray-100 dark:divide-neutral-600`, rows `flex items-center gap-3 py-3`.
- **Expandable item card** (`DeviceSessions.js`): `<li className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-600 dark:bg-neutral-700">`, header is a real `<button type="button" aria-expanded aria-controls>` with `flex w-full items-center gap-3 p-4 text-left`; icon holder `h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-600` with a `h-6 w-6 text-primary-500 dark:text-[#6bcf60]` icon; body `px-4 pb-4` with an inset box `rounded-xl border border-gray-200 bg-gray-50 px-3.5 dark:border-neutral-600 dark:bg-neutral-800`.
- **Chips / badges**: `rounded-full px-2.5 py-0.5 text-xs font-medium` + neutral `bg-gray-100 text-gray-700 dark:bg-neutral-600 dark:text-neutral-200` or success `bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`. Counter badge on an icon: `NAV_BADGE_CLASS`.
- **Buttons - when to use which**:
  - Inside forms, settings, dialogs and admin: **antd `Button`** - `type="primary"` for the one main action, default for secondary, `danger` for destructive, `type="link"` for an inline text action, `loading={busy}` while it runs, `block` / `shape="round"` as needed. Pair buttons in `flex flex-wrap gap-2`.
  - Navigation and page chrome (navbar, sidebar, home cards): plain `<Link>` / `<button>` with Tailwind - filled `flex h-10 items-center gap-1.5 rounded-xl bg-primary-500 px-4 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-primary-600`; outline / "load more" `rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-primary-500 transition hover:bg-primary-50 disabled:opacity-60 dark:border-neutral-600 dark:text-[#6bcf60] dark:hover:bg-[#2b3a2a]`; ghost `h-10 rounded-xl px-3.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700`; round icon button `NAV_ICON_BUTTON_CLASS`.
  - Not the `components/ui/PrimaryButton.js` / `SecondaryButton.js` / `DangerButton.js` set (grey, uppercase - legacy).
- **Nav item** (`SidebarNav.js`): `flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors`; active `bg-primary-500 !text-white shadow-[0_4px_12px_rgba(49,149,39,0.28)]`; idle `text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white`; set `aria-current="page"`.
- **Forms**: antd `Input`, `Input.Password`, `Select`, `Switch`, `Checkbox`, `DatePicker` (40px high, transparent background, themed border - configured once in `AntdProvider`, don't restyle per use). Label above (class in the table), help text below as `mt-1 text-xs text-gray-500 dark:text-gray-400`, error below as `mt-1 text-xs text-red-500` (or `components/ui/InputError.js`). Keep a form column to `max-w-sm`. A setting with a switch: `flex items-center justify-between py-3`, text block `min-w-0`, `<Switch className="ml-4 flex-shrink-0" />`.
- **Search field** (navbar): `h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-16 text-sm placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100` + dark pair.
- **Modals / drawers**: antd `Modal` (`className="custom-modal"` for the compact padding and top offset defined in `globals.css`) and `Drawer`; their dark colours come from `AntdProvider`. Don't build overlays by hand.
- **Avatars**: `UserAvatar` (`HomeCard.js`) - round, `border border-gray-100 bg-gray-200 dark:border-neutral-600`, wrapped in the user's avatar frame when a `theme` is passed (`components/profile/UserAvatar.js`, or `AvatarFrameWrap` around an existing avatar). The frame overflows the avatar a little, so its parent must not be `overflow-hidden`.
- **User names - one line, always**: wherever a user's name is shown and the API sends their theme (`profile_theme`, or `theme` on the profile itself), draw it with **`UserName`** (`components/profile/UserName.js`): `<UserName name theme verified>{trailing}</UserName>`. It renders the name in the user's name style (`StyledName`: font + effect, **always visible, never hover-only**), then the Pro name icon (`NameIcon`, glyph from the API's `name_icon_emoji`), the verified tick (`ui/Badges`, `primary-500`) and any trailing children (tier badge, role chip).
  - The row is `inline-flex min-w-0 items-center`: **only the name truncates** (`truncate`, ellipsis); the icon, the tick, the trailing children and neighbouring metadata (date, counters) are `flex-shrink-0` siblings, so nothing wraps under the name or gets cut off - on mobile too. The parent must let it shrink: give it `flex min-w-0 items-center` (and `min-w-0` up the chain). Never put `line-clamp-*`, `break-words` or a block wrapper on a name beside a tick.
  - `@username` goes through **`StyledUsername`** (plain unless the theme says `username_style: "name"`).
  - The signed-in user's own theme comes from `useOwnProfileTheme(currentUser)` (`src/hooks`), which the appearance editor updates on save - use it for anything drawn from `currentUser` (navbar, composer, optimistic items).
  - The name icon is decoration (`aria-hidden`, no background, never green) and must never look like the verified tick. Don't put it inside `StyledName` (gradient effects make its content transparent).
  - A list whose API response has no theme stays plain - don't guess one.

### Feedback

- **Result of an action**: antd `message.success(...)` / `message.error(...)` (`message.warning` / `message.info` when that's what it is). Error text: `error.response?.data?.message || "Có lỗi xảy ra."` - the API answers in Vietnamese, the site's language.
- **Confirm before destructive actions**: antd `Popconfirm` on the button (`title`, optional `description`, `okText`, `cancelText="Hủy"`), or `Modal.confirm` when there is more to explain. Both get the theme through `AntdProvider`'s `holderRender`.
- **Inline errors** under the field while the user is still in the form; a `message` for the outcome.

### Loading, empty and error states

- **Lists and cards**: skeletons shaped like the content - `animate-pulse` wrappers with `rounded bg-gray-200 dark:bg-neutral-600` bars (`LatestPosts.js`, `RankingCard.js`, `components/home/skeletonPost.js`), or antd `Skeleton`.
- **Media** (images, videos, embeds): put the `media-loading` class on the `<img>` / `<video>` or on a wrapper behind it (shimmer defined in `globals.css`; `MediaLoadingWatcher` removes it once loaded). `.iframe-wrapper` shimmers by itself. Give media a fixed box (`aspect-video`, explicit height) so nothing jumps.
- **A small block that is loading**: a hint line `Đang tải...` in the secondary text style; **a button**: antd `loading`; **a refresh icon**: `animate-spin`. antd `Spin` only for a full panel with no meaningful skeleton.
- **Empty**: one centred line `py-10 text-center text-sm text-gray-500 dark:text-neutral-400` (antd `Empty` in admin tables).
- **Error**: the same line saying what failed and what to do ("Hãy tải lại trang."), `text-red-500` only for an error the user caused.

### Icons

**lucide-react** for all new icons: `h-4 w-4` inside buttons and chips, `h-[18px] w-[18px]` in card headers and detail rows, `h-5 w-5` in lists, `h-6 w-6` in a 48px holder, `h-[21px]`-`h-[22px]` in the navbar; colour by text class (`text-gray-400`, `text-primary-500 dark:text-[#6bcf60]`), `flex-shrink-0` beside text. `@ant-design/icons` only inside antd-heavy admin screens. `react-ionicons` and `react-icons` exist in older components - don't add new uses.

### Motion

`transition-colors` (or `transition`) on anything with a hover state; `animate-pulse` for skeletons; `animate-spin` for a running refresh. Nothing else moves by default - no entrance animations on new content. The shimmer respects `prefers-reduced-motion`.

### Language and accessibility

- **All UI text is Vietnamese**, written in the code (there is no i18n layer). Match the existing voice: short, sentence case, "bạn". Dates: `dayjs(...).format("HH:mm DD/MM/YYYY")`.
- Use real elements: `<button type="button">` for actions, `<Link>` for navigation, headings in order (`h1` page, `h2` card, `h3` block). Icon-only buttons need `aria-label` (Vietnamese) or an `sr-only` label; toggles and expanders need `aria-expanded` / `aria-controls`; images need `alt` (empty for decoration).
- Client-only values (`window`, storage, theme, app mode) are read in `useEffect` so the server render matches.

### Keeping this section true

Every new or changed page or component must follow this section. If the part you touch is in the older style, bring it in line. When a deliberate, large redesign changes these rules (new card style, new palette, new navigation), **update this section in the same commit** - it must always describe the site as it is, not as it was.

## Recent work (newest first, as of 2026-10)
- **Passkey login starts in the same turn as the tap (PR #37; not built locally):** on phones the system passkey sheet did not open - mobile browsers (Safari on iPhone/iPad above all) only open it when the request starts while the tap is being handled. `handlePasskeyLogin` now calls `getPasskey()` first, before any state update or `await`, with options from `prepareLoginOptions().takeReady()`; the options are refreshed every minute and when the tab becomes visible (`refresh()`), so a tap never has to wait for the network.
- **Passkeys: any authenticator, on every device; relying party is `www.chuyenbienhoa.com` (branch `fix/passkey-any-authenticator`; not built locally):** the API no longer asks for the device's own authenticator, so "Thêm passkey" is shown on every browser that has WebAuthn (PCs without Windows Hello can use a fingerprint reader, a security key or a phone; phones use their own screen lock) - `PasskeySettings.js` only adds a note when the device has no screen lock. Passkeys now belong to `www.chuyenbienhoa.com` (the bare domain redirects there, and the mobile app can only verify its association with a host that does not redirect); `public/.well-known/assetlinks.json` lists the www site too.
- **Tier icon after every name; changeable from Pro (PR #36; not built locally):** `NameIcon` (so every `UserName`) shows, in this order: the preset glyph a Pro member picked (`name_icon_emoji`), the tier icon they picked (`name_icon_tier`), else the icon of the tier they are in (`profile_theme.member_tier`, or `UserName`'s `tier` prop). Posts and comments no longer add a separate `MemberTierBadge` next to the name. The editor's icon picker lists the six tier icons before the presets.
- **"Pro" tier (2000 points), appearance everywhere, one-line names (PR #36; not built locally):**
  - Tier id `pro`, shown as "Thành viên Pro": name icon (`profile_theme.name_icon`, glyph from `name_icon_emoji`), `@username` drawn like the name (`username_style = name`), emoji / decorative Unicode in names. Editor: `ProfileCustomizer.js` (icon picker, username switch); settings show a hint and the API's `errors.profile_name` under "Họ và tên".
  - `src/components/profile/UserName.js` is **the** way to show a user's name: one line, the name truncates, then name icon, verified tick and trailing content never wrap (see Design system). With `NameIcon.js`, `StyledUsername.js`. Used in posts, comments, home cards, stories, profile header, rankings, saved posts, search, notifications, chat and the navbar user menu (own theme via `src/hooks/useOwnProfileTheme.js`).
  - `StyledName.js`: effects are always visible (no longer hover-only in lists); emoji inside gradient names keep their colours; wrapped gradient names use `box-decoration-break: clone`.
- **Two-factor by approval on a logged-in device (method `device`; PR #36; not built locally):** settings switch "Xác nhận trên thiết bị đã đăng nhập" in `TwoFactorSettings.js` (password, no code: `setupTwoFactorDevice`). Login: `src/components/auth/DeviceApprovalStep.js` shows a two-digit number and polls (`startLoginApproval`, `getLoginApprovalStatus` every 2.5s), with "Dùng mã khôi phục" as the way out. Logged-in browsers: `src/components/LoginApprovalPrompt.js` (mounted in `ClientProviders.js`) shows the request with three numbers to pick from, deny and "Để sau"; it refreshes on tab focus and on the realtime event `.login.approval` on the user channel.
- **Logged-in devices as expandable cards, with the login method (PR #36; not built locally):** `DeviceSessions.js` shows one card per login (icon, device name, "platform version • last active", chips for "Thiết bị này" and the login method) that opens to a boxed list - model, platform + version, login method (`login_method` / `login_two_factor` from `GET /sessions`), logged in, last active - and a "Đăng xuất" button.
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
