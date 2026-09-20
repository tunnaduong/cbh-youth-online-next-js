"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Star,
  Zap,
  MessageSquare,
  ThumbsUp,
  CalendarCheck,
  CheckCircle2,
  Flame,
  ChevronRight,
  Gift,
  Trophy,
  Ticket,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { dailyCheckin, getCheckinStatus } from "@/app/Api";
import { useAuthContext } from "@/contexts/Support";
import { message } from "antd";

const HOW_TO_EARN = [
  { icon: <Star className="w-4 h-4 text-yellow-500" />, label: "Đăng bài viết mới", points: "+10 điểm" },
  { icon: <ThumbsUp className="w-4 h-4 text-blue-500" />, label: "Nhận vote từ thành viên", points: "+5 điểm" },
  { icon: <MessageSquare className="w-4 h-4 text-green-500" />, label: "Bình luận bài viết", points: "+2 điểm" },
  { icon: <Zap className="w-4 h-4 text-purple-500" />, label: "Hoàn thành đố vui", points: "+điểm theo độ khó" },
  { icon: <CalendarCheck className="w-4 h-4 text-orange-500" />, label: "Điểm danh hàng ngày", points: "+5→20 điểm" },
];

const TIERS = [
  { name: "Tập sự", min: 50, color: "text-gray-500", bg: "bg-gray-100 dark:bg-neutral-700" },
  { name: "Tích cực", min: 150, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
  { name: "Tiêu biểu", min: 500, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/30" },
  { name: "Kỳ cựu", min: 1000, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/30" },
];

const STREAK_REWARDS = [
  { day: 1, pts: 5 }, { day: 2, pts: 7 }, { day: 3, pts: 9 },
  { day: 4, pts: 11 }, { day: 5, pts: 13 }, { day: 6, pts: 15 }, { day: 7, pts: 20 },
];

export default function PointsInfoSidebar() {
  const { loggedIn } = useAuthContext();
  const [checkinStatus, setCheckinStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    getCheckinStatus()
      .then((res) => setCheckinStatus(res?.data || res))
      .catch(() => {});
  }, [loggedIn]);

  const handleCheckin = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await dailyCheckin();
      const data = res?.data || res;
      if (data?.already_checked_in) {
        message.info("Bạn đã điểm danh hôm nay rồi!");
      } else {
        message.success(
          `🎉 Điểm danh thành công! +${data.points_awarded} điểm (Ngày ${data.streak_day} liên tiếp)`
        );
        setCheckinStatus({
          checked_in_today: true,
          streak_day: data.streak_day,
          next_reward: null,
        });
      }
    } catch {
      message.error("Không thể điểm danh. Vui lòng thử lại.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="w-[280px] shrink-0 hidden xl:flex flex-col gap-3 pt-6 pb-6">
      {/* Điểm danh hàng ngày */}
      {loggedIn && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Điểm danh hàng ngày</h3>
          </div>

          {/* Streak indicator */}
          <div className="flex gap-1 mb-3">
            {STREAK_REWARDS.map(({ day, pts }) => {
              const streakDay = checkinStatus?.streak_day || 0;
              const isToday = checkinStatus?.checked_in_today && day === streakDay;
              const isPast = day < streakDay || (checkinStatus?.checked_in_today && day <= streakDay);
              return (
                <div
                  key={day}
                  className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg py-1 px-0.5 text-center transition-all
                    ${isToday ? "bg-orange-100 dark:bg-orange-900/40 ring-1 ring-orange-400" : ""}
                    ${isPast && !isToday ? "bg-green-50 dark:bg-green-900/20" : ""}
                    ${!isPast && !isToday ? "bg-gray-50 dark:bg-neutral-700" : ""}
                  `}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : day === 7 ? (
                    <Flame className="w-3 h-3 text-orange-400" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-gray-300 dark:border-neutral-500 inline-block" />
                  )}
                  <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400">
                    +{pts}
                  </span>
                  <span className="text-[8px] text-gray-400 dark:text-gray-500">N{day}</span>
                </div>
              );
            })}
          </div>

          {checkinStatus?.checked_in_today ? (
            <div className="text-center py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Đã điểm danh hôm nay
            </div>
          ) : (
            <button
              onClick={handleCheckin}
              disabled={checking}
              className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4" />
              {checking ? "Đang điểm danh..." : "Điểm danh ngay"}
            </button>
          )}
          {checkinStatus && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Streak hiện tại: <span className="font-semibold text-orange-500">{checkinStatus.streak_day || 0} ngày</span>
            </p>
          )}
        </div>
      )}

      {/* Cách kiếm điểm */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-[#319527]" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Cách kiếm điểm CYO</h3>
        </div>
        <div className="flex flex-col gap-2">
          {HOW_TO_EARN.map(({ icon, label, points }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="shrink-0">{icon}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">{label}</span>
              <span className="text-xs font-semibold text-[#319527] shrink-0">{points}</span>
            </div>
          ))}
        </div>
        <Link
          href="/guide/points"
          className="mt-3 flex items-center gap-1 text-xs text-[#319527] hover:underline font-medium"
        >
          Xem chi tiết <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Mốc huy hiệu */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-yellow-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Mốc huy hiệu thành viên</h3>
        </div>
        <div className="flex flex-col gap-2">
          {TIERS.map(({ name, min, color, bg }) => (
            <div key={name} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${bg}`}>
              <span className={`text-xs font-semibold ${color}`}>{name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{min}+ điểm</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Mỗi mốc mở khóa đặc quyền và huy hiệu riêng.
        </p>
      </div>

      {/* Lợi ích khi tích lũy điểm */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-pink-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Điểm dùng để làm gì?</h3>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2.5">
            <TrendingUp className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Tăng thứ hạng trong <span className="font-medium text-gray-800 dark:text-gray-100">bảng xếp hạng</span> thành viên.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Trophy className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Nhận <span className="font-medium text-gray-800 dark:text-gray-100">huy hiệu và danh hiệu</span> đặc biệt khi đạt mốc điểm quan trọng.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Ticket className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Tham gia <span className="font-medium text-gray-800 dark:text-gray-100">sự kiện & nhận quà</span> dành riêng cho thành viên tích cực.
            </p>
          </div>
          <div className="flex gap-2.5">
            <ShoppingBag className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Quy đổi điểm lấy{" "}
              <a
                href="https://giftshop.chuyenbienhoa.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#319527] hover:underline"
              >
                vật phẩm quà tặng vật lý
              </a>{" "}
              trên Gift Shop CBH.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
