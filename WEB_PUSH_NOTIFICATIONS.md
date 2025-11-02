# Web Push Notifications trong Next.js

## 📋 Tổng quan

Web Push Notifications cho phép website gửi thông báo ngay cả khi:
- ✅ Người dùng không mở tab
- ✅ Trình duyệt đã bị đóng (nhưng Service Worker vẫn hoạt động)
- ✅ Người dùng đang ở trang khác

## 🔧 Các thành phần chính

### 1. Service Worker (`/public/sw.js`)

Service Worker là script chạy ngầm trong trình duyệt, cho phép:
- Nhận push messages từ server
- Hiển thị notifications
- Xử lý click events trên notifications

**Đã implement:**
- ✅ Push event handler (nhận push messages)
- ✅ Notification click handler (navigate khi click)
- ✅ Cache management (giới hạn 10MB)

### 2. Push Subscription

Để nhận push notifications, mỗi user cần "subscribe" (đăng ký).

**Quy trình:**
1. User cho phép notifications (`Notification.requestPermission()`)
2. Service Worker được đăng ký
3. Tạo PushSubscription với VAPID public key
4. Gửi subscription về server để lưu

**File:** `src/utils/pushNotifications.js`

### 3. VAPID Keys

VAPID (Voluntary Application Server Identification) keys là cặp public/private key để:
- Xác thực server khi gửi push notifications
- Bảo mật communication giữa server và browser

**Đã có trong:**
- `.env` (backend): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- API endpoint: `/v1.0/notifications/vapid-public-key`

### 4. Server-side Push Sending

**Backend (Laravel):**
- ✅ `PushNotificationService` - service để gửi push notifications
- ✅ `ChatController::sendChatPushNotifications()` - gửi push khi có tin nhắn mới
- ✅ Database table: `cyo_notification_subscriptions` - lưu subscriptions

**Library:** `minishlink/web-push` (PHP)

## 📁 File Structure

```
cbh-youth-online-next-js/
├── public/
│   └── sw.js                          # Service Worker (chạy ngầm)
├── src/
│   ├── utils/
│   │   └── pushNotifications.js      # Utilities cho push subscriptions
│   ├── contexts/provider/
│   │   └── ChatProvider.js           # Tự động subscribe khi login
│   └── app/
│       └── ClientProviders.js         # Đăng ký Service Worker sớm
└── cbh-youth-online-api/
    ├── app/Services/
    │   └── PushNotificationService.php # Gửi push notifications
    └── app/Http/Controllers/
        └── ChatController.php         # Gửi push khi có tin nhắn
```

## 🔄 Flow hoạt động

### Khi user login:

1. **Client (Next.js):**
   ```
   ChatProvider → subscribeToChatPush() 
   → requestNotificationPermission()
   → registerServiceWorker()
   → subscribeToPushNotifications() (với VAPID key)
   → Gửi subscription về server
   ```

2. **Server (Laravel):**
   ```
   NotificationController@subscribe
   → Lưu subscription vào database
   → cyo_notification_subscriptions table
   ```

### Khi có tin nhắn mới:

1. **Server (Laravel):**
   ```
   ChatController@sendMessage
   → sendChatPushNotifications()
   → Lấy subscriptions của recipient từ database
   → Gửi push notification qua Web Push API
   ```

2. **Service Worker:**
   ```
   push event
   → Parse notification data
   → showNotification()
   → Browser hiển thị notification
   ```

3. **User clicks notification:**
   ```
   notificationclick event
   → Navigate đến URL (chat conversation)
   ```

## ✅ Checklist Implementation

### Frontend (Next.js)
- ✅ Service Worker registration (`ClientProviders.js`)
- ✅ Push subscription utilities (`pushNotifications.js`)
- ✅ Auto-subscribe on login (`ChatProvider.js`)
- ✅ Service Worker với push handler (`public/sw.js`)

### Backend (Laravel)
- ✅ VAPID keys configuration
- ✅ PushNotificationService
- ✅ Subscription storage (database)
- ✅ Push sending cho chat messages
- ✅ API endpoints cho subscription management

## 🧪 Testing

### Test push notifications:

1. **Đăng nhập vào app**
2. **Cho phép notifications** (browser sẽ hiện popup)
3. **Kiểm tra console logs:**
   ```
   [ClientProviders] Service Worker registered
   [pushNotifications] subscribeToPushNotifications CALLED
   [ChatProvider] Successfully subscribed to chat push notifications
   ```

4. **Test gửi tin nhắn:**
   - Gửi tin nhắn từ user khác
   - Đóng tab hoặc browser
   - Thông báo sẽ hiện ngay cả khi tab đã đóng!

### Kiểm tra subscription:

```bash
# Check database
SELECT * FROM cyo_notification_subscriptions WHERE user_id = YOUR_USER_ID;
```

### Kiểm tra Service Worker:

1. Mở DevTools → Application → Service Workers
2. Verify Service Worker đang active
3. Check "Network" tab → xem có requests đến `/v1.0/notifications/subscribe`

## 🔒 Security & Best Practices

### ✅ Đã implement:

1. **HTTPS required** (production)
   - Push notifications chỉ hoạt động trên HTTPS (hoặc localhost)

2. **VAPID keys**
   - Public key: Client-side (safe to expose)
   - Private key: Server-side only (never expose)

3. **User permission**
   - Phải có permission từ user trước khi subscribe

4. **Cache management**
   - Giới hạn cache size (10MB)
   - Tự động cleanup old entries

### ⚠️ Lưu ý:

1. **Notification permission có thể bị từ chối**
   - Cần handle gracefully
   - Không spam user với permission requests

2. **Service Worker có thể bị unregister**
   - User có thể xóa trong browser settings
   - Cần re-subscribe khi Service Worker được re-register

3. **Push subscription có thể expire**
   - Browser có thể revoke subscription
   - Handle invalid subscriptions (404/410 status)

## 📚 Resources

- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)

## 🐛 Debugging

### Console logs:

**Frontend:**
- `[pushNotifications]` - Push subscription process
- `[ChatProvider]` - Chat push subscription
- `[Service Worker]` - Service Worker events

**Backend:**
- Check `storage/logs/laravel.log` cho push sending logs

### Common issues:

1. **"Registration failed - missing applicationServerKey"**
   - ✅ Fixed: VAPID key được fetch từ API đúng cách

2. **"Permission denied"**
   - User đã từ chối notifications
   - Reset trong browser settings

3. **No notifications khi tab đóng**
   - Check Service Worker đã được register chưa
   - Check subscription đã được lưu trong database chưa

