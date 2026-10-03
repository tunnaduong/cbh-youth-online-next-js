# CBH Youth Online – Frontend Next.js

Giao diện web của cộng đồng CBH Youth Online được xây dựng bằng Next.js 14 (App Router). Ứng dụng cung cấp bảng tin, diễn đàn, chat riêng tư/công khai, stories, khám phá (trò chơi, quiz, tài liệu học tập, tra cứu đại học), ví điểm, cửa hàng, trung tâm trợ giúp, trang quản trị `/admin` và hệ thống thông báo đẩy dành cho học sinh tại THPT Chuyên Biên Hòa.

Các repo liên quan: [cbh-youth-online-api](https://github.com/tunnaduong/cbh-youth-online-api) (backend Laravel), [cbh-youth-online-mobile](https://github.com/tunnaduong/cbh-youth-online-mobile) (ứng dụng Expo) và [cbh-youth-online-gift-shop](https://github.com/tunnaduong/cbh-youth-online-gift-shop) (cửa hàng quà tặng, dùng chung cookie đăng nhập `auth_token` trên `.chuyenbienhoa.com`).

## Nội dung chính
- [Tính năng nổi bật](#tính-năng-nổi-bật)
- [Kiến trúc & công nghệ](#kiến-trúc--công-nghệ)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Thiết lập môi trường](#thiết-lập-môi-trường)
- [Scripts hữu ích](#scripts-hữu-ích)
- [Luồng dữ liệu & API](#luồng-dữ-liệu--api)
- [Thông báo đẩy & realtime](#thông-báo-đẩy--realtime)
- [Chất lượng mã & lint](#chất-lượng-mã--lint)
- [Triển khai](#triển-khai)
- [Tài liệu tham khảo](#tài-liệu-tham-khảo)

## Tính năng nổi bật
- **Bảng tin & diễn đàn**: Hiển thị topic, thống kê, bình luận nhiều cấp, bình chọn, lưu bài viết (`src/app/feed`, `src/app/forum`, `src/components/forum`).
- **Hồ sơ & bảng xếp hạng**: Trang người dùng, theo dõi/bỏ theo dõi, bảng điểm và danh hiệu (`src/app/[username]`, `src/contexts/TopUsersContext.js`).
- **Stories & hoạt động thời gian thực**: Chia sẻ stories, đánh dấu đã xem, phản ứng nhanh (`src/components/stories`).
- **Chat riêng tư/công khai**: Tin nhắn 1-1, nhóm và public lounge kèm push notifications (`src/components/chat`).
- **Thông báo & lưu trữ**: Dropdown thông báo, đánh dấu đã đọc, quản lý topic đã lưu (`src/components/notifications`, `src/app/saved`).
- **Trung tâm hỗ trợ & hướng dẫn**: Chuyên mục bài viết hỗ trợ, bộ câu hỏi điểm (`src/app/help`, `src/data/helpArticles.js`).
- **Khám phá**: Trò chơi, quiz (kể cả quiz tự tạo), tài liệu học tập, tra cứu trường đại học (`src/app/explore`).
- **Ví điểm & cửa hàng**: Nạp điểm qua SePay QR, rút điểm, tặng điểm cho bài viết, cửa hàng đổi điểm (`src/app/wallet`, `src/app/shop`).
- **Trang quản trị**: Dashboard `/admin` (Ant Design) quản lý bài viết, bình luận, người dùng, báo cáo, kiểm duyệt, nạp/rút, cửa hàng, xác minh học sinh, góp ý (`src/app/admin`).
- **Nhúng trong ứng dụng di động**: Trang mở với `?app=true` (ghi nhớ theo phiên, `src/utils/appMode.js`) ẩn màn chờ, banner tải app và các nút đăng xuất/về trang chủ trong admin; `/auth/set-token?code=` nhận mã đăng nhập một lần từ app để mở web đã đăng nhập sẵn.
- **Bảo mật tài khoản**: Xác thực hai lớp khi đăng nhập (mã gửi qua email hoặc ứng dụng xác thực, mã khôi phục, ghi nhớ thiết bị) và danh sách thiết bị đã đăng nhập kèm đăng xuất từ xa, trong Cài đặt → Tài khoản (`src/components/settings`, `src/app/login`).
- **Nội dung mở rộng**: Chuyên trang youth news, việc làm, quảng cáo, chính sách và landing (`src/app/youth-news`, `src/app/jobs`, `src/app/ads`, `src/app/policy`).

## Kiến trúc & công nghệ
- **Next.js 14 + React 18**: Kết hợp server components và client components để tối ưu SEO và khả năng tương tác.
- **App Router & layouts**: Phân tách rõ ràng giữa `layout.js`, `not-found.js`, và các route động như `[username]/[tab]`.
- **Tầng dịch vụ API**: Mọi request đều đi qua `src/app/Api.js` kết nối đến backend Laravel qua Axios tuỳ biến (`src/services/api/ApiByAxios.js`, `src/services/api/AxiosCustom.js`).
- **SSR fetch helper**: `src/utils/serverFetch.js` cung cấp tiện ích fetch trên server, tránh viết thủ công.
- **State & context**: Các context tại `src/contexts` quản lý xác thực, thông báo, chat, dữ liệu diễn đàn, top users…
- **Giao diện**: Tailwind CSS, Radix UI, Ant Design, Styled-components, Lucide Icons, Swiper, Lottie.
- **Realtime**: Laravel Echo + pusher-js kết nối Reverb (`src/lib/echo.js`).
- **Tiện ích khác**: Moment cấu hình riêng (`src/utils/momentConfig.js`), Markdown editor (`src/components/ui/MarkdownToolbar.js`), service worker push.

## Cấu trúc thư mục
```
src/
├── app/                 # Route Next.js (App Router)
├── components/          # UI & widget dùng lại (chat, stories, modals…)
├── contexts/            # React Context + provider tương ứng
├── hooks/               # Custom hooks (loading, service worker…)
├── services/api/        # Tầng gọi API bằng Axios
├── lib/                 # Echo realtime, deep link, profile theme…
├── utils/               # Helpers (assets, cookies, SEO, push notifications, app mode…)
├── layouts/             # Các layout chia sẻ
└── assets/              # File Lottie, JSON tĩnh
public/
├── sw.js                # Service Worker push notification
└── icons, ảnh, fonts…
e2e/                     # Kiểm thử Playwright
```

## Yêu cầu hệ thống
- Node.js ≥ 18.18 (CI dùng Node 22).
- npm (dự án dùng `package-lock.json`).
- Quyền truy cập API backend tại `https://api.chuyenbienhoa.com` hoặc môi trường staging.
- Trình duyệt hỗ trợ Service Worker khi cần kiểm thử push.

## Thiết lập môi trường
1. **Cài đặt phụ thuộc**
   ```bash
   npm install
   ```
2. **Tạo file môi trường**
   ```bash
   cp .env.example .env.local
   ```
3. **Điền biến môi trường**
   | Biến | Mô tả |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | Host backend Laravel, không kèm `/v1.0` (ví dụ `https://api.chuyenbienhoa.com`). |
   | `NEXT_PUBLIC_HIDE_LOADING` | Ẩn/hiện layer loading toàn cục (`false` để debug). |
   | `NEXT_PUBLIC_GOOGLE_*` | Client ID/secret & redirect URI cho OAuth Google. |
   | `NEXT_PUBLIC_FACEBOOK_*` | Client ID/secret & redirect URI cho OAuth Facebook. |
   | `NEXT_PUBLIC_REVERB_*` | App key, host, port, scheme cho realtime (Reverb). |
4. **Chạy dev server**
   ```bash
   npm run dev
   ```
5. **Biên dịch production**
   ```bash
   npm run build
   npm start
   ```
6. **Lint trước khi mở PR**
   ```bash
   npm run lint
   ```

> 📌 Lưu ý: Nếu cần kiểm thử API từ server components, sử dụng `src/utils/serverFetch.js` thay vì fetch thủ công để giữ nguyên header và token.

## Scripts hữu ích
- `npm run dev`: Khởi chạy Next.js ở `http://localhost:3000`.
- `npm run build`: Build sản phẩm cho production.
- `npm start`: Chạy server production sau khi build.
- `npm run lint`: Chạy `next lint` với cấu hình trong `.eslintrc.json`.
- `npm run test:e2e`: Chạy kiểm thử Playwright trong `e2e/`.
- `postinstall`: Chạy `patch-package` (hiện chưa có thư mục `patches/`).

## Luồng dữ liệu & API
- Toàn bộ endpoint client-side được định nghĩa tập trung tại `src/app/Api.js`, tương ứng với danh sách route `/v1.0/...`. Xác thực bằng Sanctum bearer token lưu trong cookie `auth_token` (dùng chung cho mọi subdomain `.chuyenbienhoa.com`).
- `src/services/api/AxiosCustom.js` cấu hình base URL, interceptor token và xử lý lỗi mặc định.
- Với các trang cần dữ liệu sớm (ví dụ `src/app/forum`, `src/app/help`), dữ liệu được tải server-side rồi truyền vào client component để tối ưu SEO.
- Khi cần gọi API từ layout hoặc component dùng chung, ưu tiên đặt logic trong `src/contexts` để tránh lặp lại (ví dụ `NotificationProvider`, `ChatProvider`).

## Thông báo đẩy & realtime
- Service Worker nằm tại `public/sw.js` được đăng ký trong `src/app/ClientProviders.js`.
- Tiện ích `src/utils/pushNotifications.js` chịu trách nhiệm xin quyền, đăng ký VAPID key và gửi subscription thông qua các hàm trong `src/app/Api.js`.
- Chat Provider tự động subscribe sau khi người dùng đăng nhập, kết hợp với backend Laravel để gửi push khi có tin nhắn mới. Tham khảo thêm tài liệu chi tiết trong `WEB_PUSH_NOTIFICATIONS.md`.

## Chất lượng mã & lint
- ESLint cấu hình cho Next.js và Tailwind, chạy qua `npm run lint`.
- Ưu tiên component thuần (`src/components/ui`) và hook tái sử dụng để giữ codebase gọn gàng.
- Khi thêm thư viện bên thứ 3, nếu cần chỉnh sửa, đặt patch vào `patches/` và khai báo rõ ràng.

## Triển khai
- Mặc định deploy lên Vercel (Next.js 14), kèm bản preview trên Netlify. Đừng quên:
  - Thiết lập `NEXT_PUBLIC_*` trong dashboard môi trường.
  - Bật build cache cho npm.
  - Cấu hình domain client (`https://chuyenbienhoa.com`) để khớp với API backend.
- Nhánh mặc định: **`main`** - nếu không có yêu cầu khác, tạo nhánh mới từ `main` mới nhất rồi mở pull request vào `main`.
- Nhánh `main` được bảo vệ: mọi thay đổi phải qua pull request, cần review và vượt qua kiểm thử Playwright E2E cùng các bản deploy Vercel.
- Nếu deploy self-hosted, dùng `npm run build && npm start` sau khi reverse proxy qua Nginx/PM2.

## Tài liệu tham khảo
- `BACKGROUND_PUSH_ANALYSIS.md`: Ghi chú phân tích push notification.
- `WEB_PUSH_NOTIFICATIONS.md`: Hướng dẫn chi tiết tích hợp Web Push.
- `CHAT_NOTIFICATION_SUMMARY.md`: Tổng quan xử lý thông báo trong chat.
- `SEPAY_QR_CODE_DOCS.md`, `SEPAY_WEBHOOK_DOCS.md`, `SEPAY_LARAVEL_DOCS.md`: Tích hợp thanh toán SePay.
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS Docs: https://tailwindcss.com/docs

---

💬 Cần hỗ trợ thêm? Tạo issue hoặc ping team FE để được giải đáp nhanh chóng!
