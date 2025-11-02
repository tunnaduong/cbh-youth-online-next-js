#!/bin/bash

# Test Push Notifications Script
# Usage: ./test-push.sh

echo "🚀 Testing Push Notifications"
echo "================================"
echo ""

# Safari endpoint (current working subscription)
ENDPOINT="https://web.push.apple.com/QFUd8RZsNLP8SqNSdSE4Z5hzRpGq8MUsHyyHhTX3ezIR9Zgi2Y5Pd5UlAzthIFESQPvE5pEkCI8pSBI0WZdFwSUXqZqqoAO14PCCxEkr10SGTzGtqPm35U2VmCBhvCv_4uT6Pd2aW0m4gdwmDfgtbVpjOPpBmPQg5SpzHQIv7zM"
KEY="BF34ZEb46pNxObu9c4cDM2FORB/C0m9XOfeEVRVg6CiMuUF+Av0wNhPhhDWBu9QvZSYBKsMEXYfZKtEDEm3Yqj8="
AUTH="pcI2Y+5C4Hb4Ts8jAGUpTg=="
VAPID_SUBJECT="mailto:cbhyouthonline@gmail.com"
VAPID_PUBLIC="BIxVx6n-oJdEc05EQDjIEjI5d86vW3J4-s1JAUiqlWou5XNm6bPtjHrnjVCdZQaZrJ7egufvNb0YU-7nJuszLyo"
VAPID_PRIVATE="mwaW-Lqvi0a-22agFtM85TCKkizlrhOrkDbRi6IIHoI"

echo "📱 Sending test notification..."
echo ""
echo "Test scenarios:"
echo "1. Tab mở: Nên nhận được thông báo"
echo "2. Tab đóng, Safari vẫn mở: Nên nhận được thông báo"
echo "3. Safari hoàn toàn đóng: KHÔNG nhận được (Safari limitation)"
echo ""
echo "Sending notification in 5 seconds..."
sleep 5

npx web-push send-notification \
  --endpoint="$ENDPOINT" \
  --key="$KEY" \
  --auth="$AUTH" \
  --payload="{\"title\":\"Test Background\",\"body\":\"$(date '+%H:%M:%S') - Kiểm tra thông báo nền 🚀\",\"data\":{\"url\":\"/\"}}" \
  --vapid-subject="$VAPID_SUBJECT" \
  --vapid-pubkey="$VAPID_PUBLIC" \
  --vapid-pvtkey="$VAPID_PRIVATE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Push sent successfully!"
  echo ""
  echo "📝 Notes:"
  echo "- Safari: Push chỉ hoạt động khi browser đang mở"
  echo "- Chrome/Firefox: Push hoạt động ngay cả khi browser đóng"
  echo "- macOS: Check System Preferences > Notifications"
else
  echo ""
  echo "❌ Failed to send push"
  echo "Subscription may have expired. Please refresh the page and try again."
fi
