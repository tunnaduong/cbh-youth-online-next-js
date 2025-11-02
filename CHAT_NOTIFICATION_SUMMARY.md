# Tóm Tắt: Browser Notification Cho Chat

## 📋 Tổng Quan

Tính năng browser notification cho chat được implement để hiển thị thông báo khi có tin nhắn mới, ngay cả khi chat widget đang đóng hoặc minimized.

## 🎯 Tính Năng Chính

1. **Tự động yêu cầu quyền notification** khi user mở chat widget lần đầu
2. **Phát hiện tin nhắn mới** qua polling conversations mỗi 10 giây
3. **Hiển thị browser notification** khi có tin nhắn mới
4. **Thông minh**: Chỉ hiển thị notification khi:
   - Permission đã được granted
   - Tin nhắn không phải của chính user (`!message.is_myself`)
   - Conversation không đang được mở trong chat widget (hoặc chat đang minimized)
5. **Notification info**: Hiển thị tên người gửi, preview tin nhắn (50 ký tự), avatar
6. **Auto-close**: Notification tự đóng sau 5 giây
7. **Click action**: Click notification sẽ focus window và đóng notification

## 📁 Các File Liên Quan

### 1. Core Logic - ChatProvider

**File**: `src/contexts/provider/ChatProvider.js`

**Chức năng**:

- Quản lý permission request (`requestNotificationPermission`)
- Detect tin nhắn mới (`checkForNewMessages`)
- Hiển thị notification (`new Notification(...)`)
- Polling conversations mỗi 10 giây để detect updates
- Track previous conversations để so sánh

**Các phần quan trọng**:

- Line 28: `notificationPermissionRequestedRef` - Track xem đã request permission chưa
- Line 27: `previousConversationsRef` - Lưu conversations trước đó để so sánh
- Line 30-223: `checkForNewMessages` - Function chính để detect và hiển thị notification
- Line 398-455: `requestNotificationPermission` - Request permission từ browser
- Line 462-464: Gọi `requestNotificationPermission` khi mở chat lần đầu
- Line 225-245: `loadConversations` - Polling conversations, gọi `checkForNewMessages`
- Line 532-546: Polling conversations mỗi 10 giây khi user logged in

**Logic detect tin nhắn mới**:

- So sánh `created_at` của `latest_message` giữa lần poll trước và hiện tại
- Nếu `created_at` khác nhau → có tin nhắn mới
- Chỉ hiển thị notification nếu điều kiện thỏa mãn (permission, không phải own message, conversation không đang mở)

### 2. Chat Widget Integration

**File**: `src/components/chat/ChatWidget.js`

**Chức năng**:

- Component hiển thị chat widget
- Khi click icon chat trên navbar → gọi `toggleChat()` → trigger `openChat()` → request permission

### 3. Navbar Integration

**File**: `src/components/include/navbar.js`

**Chức năng**:

- Icon chat trigger `toggleChat()` khi click
- Hiển thị badge đỏ với số tin nhắn chưa đọc (dựa trên `unread_count`)

**Code**:

- Line 42: Import `useChatContext` để lấy `toggleChat` và `conversations`
- Line 45-48: Tính tổng unread messages
- Line 390-394: Hiển thị badge đỏ khi có unread messages

### 4. Context Export

**File**: `src/contexts/Support.js`

**Chức năng**:

- Export hook `useChatContext()` để các component dễ dùng

### 5. Context Definition

**File**: `src/contexts/ChatContext.js`

**Chức năng**:

- Định nghĩa ChatContext với các state và functions

### 6. Context Index

**File**: `src/contexts/index.js`

**Chức năng**:

- Export ChatContext và ChatProvider

### 7. Provider Setup

**File**: `src/app/ClientProviders.js`

**Chức năng**:

- Wrap app với ChatProvider để tất cả components có thể access chat context

## 🔄 Luồng Hoạt Động

### 1. Khi User Mở Chat Lần Đầu

```
User click icon chat
→ toggleChat()
→ openChat()
→ requestNotificationPermission()
→ Browser hiển thị dialog "Allow notifications?"
→ User chọn Allow/Deny
→ Permission được lưu trong browser
```

### 2. Phát Hiện Tin Nhắn Mới

```
User logged in
→ Polling conversations mỗi 10 giây (line 542-545)
→ loadConversations() được gọi
→ checkForNewMessages() so sánh conversations mới với previous
→ Nếu có latest_message.created_at khác nhau
→ Kiểm tra điều kiện:
   - Permission granted? ✓
   - Tin nhắn không phải own? ✓
   - Conversation không đang mở? ✓
→ Hiển thị Notification
```

### 3. Polling Schedule

- **Conversations**: Mỗi 10 giây (10000ms) - để detect tin nhắn mới
- **Messages trong conversation đang mở**: Mỗi 5 giây (5000ms) - để update messages
- **Service Worker updates**: Mỗi 5 phút (300000ms) - chỉ để detect app updates, KHÔNG liên quan chat

## 🎨 Notification Display

### Nội Dung Notification

- **Title**:
  - Private chat: `{senderName}` (tên người gửi)
  - Group chat: `{senderName} trong {conversationName}`
- **Body**: Preview tin nhắn (tối đa 50 ký tự)
- **Icon**: Avatar của người gửi (từ `participants[0].avatar_url`)
- **Tag**: `chat-{conversationId}-{message.created_at}` - để prevent duplicate
- **Auto-close**: Sau 5 giây
- **Click action**: Focus window và đóng notification

## 📝 Logic So Sánh Tin Nhắn Mới

**Vấn đề**: API không trả về `id` trong `latest_message`, chỉ có `created_at`

**Giải pháp**: So sánh `created_at` thay vì `id`

```javascript
const hasNewMessage =
  previousConversation &&
  previousConversation.latest_message &&
  previousConversation.latest_message.created_at &&
  previousConversation.latest_message.created_at !==
    conversation.latest_message.created_at;
```

## 🚫 Điều Kiện KHÔNG Hiển Thị Notification

1. Browser không support notifications
2. Permission chưa được granted (`Notification.permission !== "granted"`)
3. Tin nhắn là của chính user (`message.is_myself === true`)
4. Conversation đang được mở trong chat widget (`isOpen && !isMinimized && selectedConversationId === conversation.id`)
5. Không có `latest_message` hoặc không có `created_at`

## 🔍 Debug Logs

Code có nhiều console.log để debug:

- `[ChatProvider] Notification permission granted!`
- `[ChatProvider] Showing notification for:`
- `[ChatProvider] Skipping notification - own message`
- `[ChatProvider] Skipping notification - conversation is open`
- `[ChatProvider] No new message detected`
- `[ChatProvider] First time seeing conversation:`

## 📊 Performance

- **Polling frequency**: 10 giây cho conversations (tối ưu balance giữa real-time và server load)
- **Memory**: Lưu previous conversations trong `useRef` để tránh re-render
- **Network**: Chỉ poll khi user logged in và có Service Worker

## ⚙️ Cấu Hình

**Polling Intervals** (trong `ChatProvider.js`):

- Line 542-545: Conversations polling - 10 giây (10000ms)
- Line 494-507: Messages polling - 5 giây (5000ms)

**Notification Settings** (trong `checkForNewMessages`):

- Line 161-163: Auto-close sau 5 giây
- Line 152: Tag để prevent duplicate notifications

## 📌 Lưu Ý

1. **Service Worker 5 phút**: Chỉ để check app updates, KHÔNG ảnh hưởng đến chat polling
2. **API Response**: `latest_message` không có `id`, phải dùng `created_at` để so sánh
3. **Sender Name**: API trả về `sender` là string (username hoặc guest_name), không phải object
4. **Polling**: Chỉ hoạt động khi tab/app đang mở, không hoạt động khi browser đóng hoàn toàn
5. **Unread Badge**: Hiển thị trên icon chat trong navbar (tính tổng `unread_count` từ tất cả conversations)

## 🔗 Dependencies

- **Browser API**: `Notification` API (native browser API)
- **React Hooks**: `useState`, `useEffect`, `useCallback`, `useRef`
- **Context**: `useAuthContext` (để check `loggedIn`)

## 📦 Tất Cả Các File Liên Quan

1. `src/contexts/provider/ChatProvider.js` - **Core logic**
2. `src/contexts/ChatContext.js` - Context definition
3. `src/contexts/Support.js` - Export `useChatContext` hook
4. `src/contexts/index.js` - Export ChatContext và ChatProvider
5. `src/components/chat/ChatWidget.js` - Chat widget component
6. `src/components/include/navbar.js` - Navbar với icon chat và unread badge
7. `src/app/ClientProviders.js` - Setup ChatProvider
8. `src/app/Api.js` - API functions (`getConversations`, `getMessages`, etc.)

## 🎯 Kết Luận

Tính năng browser notification cho chat đã được implement hoàn chỉnh với:

- ✅ Auto-request permission khi mở chat
- ✅ Polling để detect tin nhắn mới (10 giây)
- ✅ Smart notification (chỉ hiển thị khi cần)
- ✅ Unread badge trên navbar
- ✅ Debug logs đầy đủ

**Không cần Push API subscriptions** nếu chỉ cần notifications khi tab/app đang mở.
