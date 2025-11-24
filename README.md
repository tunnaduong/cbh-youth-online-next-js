# CBH Youth Online – Frontend Next.js

Giao diện web của cộng đồng CBH Youth Online được xây dựng bằng Next.js 14 (App Router). Ứng dụng cung cấp bảng tin, diễn đàn, chat riêng tư/công khai, stories, thư viện ghi âm, trung tâm trợ giúp và hệ thống thông báo đẩy dành cho học sinh tại THPT Chuyên Biên Hòa.

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
- **Nội dung mở rộng**: Chuyên trang youth news, việc làm, quảng cáo, ghi âm, chính sách và landing (`src/app/youth-news`, `src/app/jobs`, `src/app/recordings`).

## Kiến trúc & công nghệ
- **Next.js 14 + React 18**: Kết hợp server components và client components để tối ưu SEO và khả năng tương tác.
- **App Router & layouts**: Phân tách rõ ràng giữa `layout.js`, `not-found.js`, và các route động như `[username]/[tab]`.
- **Tầng dịch vụ API**: Mọi request đều đi qua `src/app/Api.js` kết nối đến backend Laravel qua Axios tuỳ biến (`src/services/api/ApiByAxios.js`, `src/services/api/AxiosCustom.js`).
- **SSR fetch helper**: `src/utils/serverFetch.js` cung cấp tiện ích fetch trên server, tránh viết thủ công.
- **State & context**: Các context tại `src/contexts` quản lý xác thực, thông báo, chat, dữ liệu diễn đàn, top users…
- **Giao diện**: Tailwind CSS, Radix UI, Ant Design, Styled-components, Lucide Icons, Swiper, Lottie.
- **Tiện ích khác**: Moment cấu hình riêng (`src/utils/momentConfig.js`), Markdown editor (`src/components/ui/MarkdownToolbar.js`), service worker push.

## Cấu trúc thư mục
```
src/
├── app/                 # Route Next.js (App Router)
├── components/          # UI & widget dùng lại (chat, stories, modals…)
├── contexts/            # React Context + provider tương ứng
├── hooks/               # Custom hooks (loading, service worker…)
├── services/api/        # Tầng gọi API bằng Axios
├── utils/               # Helpers (assets, cookies, SEO, push notifications…)
├── layouts/             # Các layout chia sẻ
└── assets/              # File Lottie, JSON tĩnh
public/
├── sw.js                # Service Worker push notification
└── icons, ảnh, fonts…
patches/                 # patch-package để vá thư viện bên thứ 3
```

## Yêu cầu hệ thống
- Node.js ≥ 18.18 (khuyến nghị 20 LTS).
- Yarn 1.x hoặc pnpm/npm (dự án dùng Yarn lock).
- Quyền truy cập API backend tại `http://chuyenbienhoa.test` hoặc môi trường staging.
- Trình duyệt hỗ trợ Service Worker khi cần kiểm thử push.

## Thiết lập môi trường
1. **Cài đặt phụ thuộc**
   ```bash
   yarn install
   ```
2. **Tạo file môi trường**
   ```bash
   cp .env.example .env.local
   ```
3. **Điền biến môi trường**
   | Biến | Mô tả |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | URL backend Laravel (ví dụ `https://api.chuyenbienhoa.test/v1.0`). |
   | `NEXT_PUBLIC_HIDE_LOADING` | Ẩn/hiện layer loading toàn cục (`false` để debug). |
   | `NEXT_PUBLIC_GOOGLE_*` | Client ID/secret & redirect URI cho OAuth Google. |
   | `NEXT_PUBLIC_FACEBOOK_*` | Client ID/secret & redirect URI cho OAuth Facebook. |
4. **Chạy dev server**
   ```bash
   yarn dev
   ```
5. **Biên dịch production**
   ```bash
   yarn build
   yarn start
   ```
6. **Lint trước khi mở PR**
   ```bash
   yarn lint
   ```

> 📌 Lưu ý: Nếu cần kiểm thử API từ server components, sử dụng `src/utils/serverFetch.js` thay vì fetch thủ công để giữ nguyên header và token.

## Scripts hữu ích
- `yarn dev`: Khởi chạy Next.js ở `http://localhost:3000`.
- `yarn build`: Build sản phẩm cho production.
- `yarn start`: Chạy server production sau khi build.
- `yarn lint`: Chạy `next lint` với cấu hình trong `.eslintrc.json`.
- `postinstall`: Tự động chạy `patch-package` để áp dụng các bản vá trong thư mục `patches/`.

## Luồng dữ liệu & API
- Toàn bộ endpoint client-side được định nghĩa tập trung tại `src/app/Api.js`, tương ứng với danh sách route `/v1.0/...`.
- `src/services/api/AxiosCustom.js` cấu hình base URL, interceptor token và xử lý lỗi mặc định.
- Với các trang cần dữ liệu sớm (ví dụ `src/app/forum`, `src/app/help`), dữ liệu được tải server-side rồi truyền vào client component để tối ưu SEO.
- Khi cần gọi API từ layout hoặc component dùng chung, ưu tiên đặt logic trong `src/contexts` để tránh lặp lại (ví dụ `NotificationProvider`, `ChatProvider`).

## Thông báo đẩy & realtime
- Service Worker nằm tại `public/sw.js` được đăng ký trong `src/app/ClientProviders.js`.
- Tiện ích `src/utils/pushNotifications.js` chịu trách nhiệm xin quyền, đăng ký VAPID key và gửi subscription thông qua các hàm trong `src/app/Api.js`.
- Chat Provider tự động subscribe sau khi người dùng đăng nhập, kết hợp với backend Laravel để gửi push khi có tin nhắn mới. Tham khảo thêm tài liệu chi tiết trong `WEB_PUSH_NOTIFICATIONS.md`.

## Chất lượng mã & lint
- ESLint cấu hình cho Next.js và Tailwind, chạy qua `yarn lint`.
- Ưu tiên component thuần (`src/components/ui`) và hook tái sử dụng để giữ codebase gọn gàng.
- Khi thêm thư viện bên thứ 3, nếu cần chỉnh sửa, đặt patch vào `patches/` và khai báo rõ ràng.

## Triển khai
- Mặc định deploy lên Vercel (Next.js 14). Đừng quên:
  - Thiết lập `NEXT_PUBLIC_*` trong dashboard môi trường.
  - Bật build cache cho npm/yarn.
  - Cấu hình domain client (ví dụ `https://chuyenbienhoa.test`) để khớp với API backend.
- Nếu deploy self-hosted, dùng `yarn build && yarn start` sau khi reverse proxy qua Nginx/PM2.

## Tài liệu tham khảo
- `BACKGROUND_PUSH_ANALYSIS.md`: Ghi chú phân tích push notification.
- `WEB_PUSH_NOTIFICATIONS.md`: Hướng dẫn chi tiết tích hợp Web Push.
- `CHAT_NOTIFICATION_SUMMARY.md`: Tổng quan xử lý thông báo trong chat.
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS Docs: https://tailwindcss.com/docs

---

💬 Cần hỗ trợ thêm? Tạo issue hoặc ping team FE để được giải đáp nhanh chóng!
