"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/app/Api";
import Badges from "@/components/ui/Badges";
import { HomeCard, UserAvatar } from "./HomeCard";
import { formatCompact, formatThousands } from "./homeUtils";

// Progress toward the next leaderboard position, using the top list we already have.
function getRankProgress(points, rank, topUsers) {
  if (!rank || !Array.isArray(topUsers) || topUsers.length === 0) return null;

  if (rank === 1) {
    return { percent: 100, label: "Bạn đang dẫn đầu bảng xếp hạng!" };
  }

  const target =
    rank <= topUsers.length ? topUsers[rank - 2] : topUsers[topUsers.length - 1];
  if (!target) return null;

  const targetPoints = Number(target.total_points) || 0;
  const missing = targetPoints - points + 1;
  // Points and rank come from different requests and can briefly disagree.
  if (missing <= 0) return null;
  const goal = rank <= topUsers.length ? `hạng #${rank - 1}` : `Top ${topUsers.length}`;

  return {
    percent: targetPoints > 0 ? Math.min((points / targetPoints) * 100, 100) : 0,
    label: `Còn ${formatThousands(missing)} điểm để lên ${goal}`,
  };
}

function GuestCard() {
  return (
    <HomeCard className="p-5">
      <h2 className="text-[15px] font-semibold text-gray-900 dark:text-neutral-100">Tham gia cộng đồng</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500 dark:text-neutral-400">
        Đăng nhập để đăng bài, bình luận, tích điểm và đổi quà tại Gift Shop.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href="/login"
          className="rounded-xl border border-gray-200 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="rounded-xl bg-primary-500 py-2 text-center text-sm font-medium !text-white hover:bg-primary-600"
        >
          Đăng ký
        </Link>
      </div>
    </HomeCard>
  );
}

function ProfileSkeleton() {
  return (
    <HomeCard className="animate-pulse p-5">
      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-neutral-600" />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-neutral-600" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-neutral-600" />
          <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-neutral-600" />
        </div>
      </div>
      <div className="mt-5 h-2 rounded-full bg-gray-200 dark:bg-neutral-600" />
      <div className="mt-5 h-10 rounded-xl bg-gray-200 dark:bg-neutral-600" />
    </HomeCard>
  );
}

export default function ProfileCard({ currentUser, authLoading, topUsers }) {
  const [profile, setProfile] = useState(null);
  const username = currentUser?.username;

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    getUserProfile(username)
      .then((response) => {
        if (!cancelled) setProfile(response.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!username) {
    return authLoading ? <ProfileSkeleton /> : <GuestCard />;
  }

  const name = currentUser.profile_name || profile?.profile?.profile_name || username;
  const points = Number(currentUser.total_points ?? profile?.stats?.activity_points) || 0;
  const rank = currentUser.rank;
  const progress = getRankProgress(points, rank, topUsers);

  const stats = [
    { label: "Bài viết", value: profile?.stats?.posts },
    { label: "Lượt thích", value: profile?.stats?.total_likes_count },
    { label: "Người theo dõi", value: profile?.stats?.followers },
  ];

  return (
    <HomeCard className="p-5">
      <h2 className="text-[15px] font-semibold text-gray-900 dark:text-neutral-100">Hồ sơ của bạn</h2>

      <div className="mt-4 flex items-center gap-3">
        <Link href={`/${username}`} className="shrink-0">
          <UserAvatar username={username} name={name} size={56} className="ring-2 ring-primary-100 dark:ring-[#2b3a2a]" />
        </Link>
        <div className="min-w-0">
          <Link
            href={`/${username}`}
            className="flex items-center font-semibold text-gray-900 hover:text-primary-600 dark:text-neutral-100"
          >
            <span className="truncate">{name}</span>
            {profile?.profile?.verified && <Badges />}
          </Link>
          <p className="truncate text-[13px] text-gray-500 dark:text-neutral-400">@{username}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold text-primary-500 dark:text-[#6bcf60]">
            {rank ? `Hạng #${rank}` : "Điểm hoạt động"}
          </span>
          <span className="text-gray-500 dark:text-neutral-400">{formatThousands(points)} điểm</span>
        </div>
        {progress && (
          <>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-600">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-[#65cd5b]"
                style={{ width: `${Math.max(progress.percent, 4)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[12px] text-gray-500 dark:text-neutral-400">{progress.label}</p>
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 border-y border-gray-100 py-3 text-center dark:border-neutral-600">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <p className="text-base font-bold text-gray-900 dark:text-neutral-100">
              {stat.value == null ? "–" : formatCompact(stat.value)}
            </p>
            <p className="truncate text-[12px] text-gray-500 dark:text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <Link
        href={`/${username}`}
        className="mt-4 block rounded-xl border border-gray-200 py-2 text-center text-sm font-medium text-primary-500 transition hover:bg-primary-50 dark:border-neutral-600 dark:text-[#6bcf60] dark:hover:bg-[#2b3a2a]"
      >
        Xem trang cá nhân
      </Link>
    </HomeCard>
  );
}
