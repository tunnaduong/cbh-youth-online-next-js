"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { HomeCard, SectionHeader, UserAvatar } from "./HomeCard";
import { formatThousands } from "./homeUtils";

const MEDALS = [
  "bg-[#FBBF24] text-white",
  "bg-[#A8B3BF] text-white",
  "bg-[#F08A3C] text-white",
];

function RankNumber({ rank }) {
  return (
    <span
      className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
        MEDALS[rank - 1] || "text-gray-500 dark:text-neutral-400"
      }`}
    >
      {rank}
    </span>
  );
}

function RankRow({ rank, username, name, avatar, points, highlight }) {
  return (
    <Link
      href={`/${username}`}
      className={`flex items-center gap-2.5 rounded-xl px-2 py-2 transition ${
        highlight
          ? "bg-primary-50 dark:bg-[#2b3a2a]"
          : "hover:bg-gray-50 dark:hover:bg-neutral-700"
      }`}
    >
      <RankNumber rank={rank} />
      <UserAvatar username={username} name={name} src={avatar} size={28} />
      <span
        className={`min-w-0 flex-1 truncate text-[13px] font-medium ${
          highlight ? "text-primary-600 dark:text-[#86dc7c]" : "text-gray-800 dark:text-neutral-200"
        }`}
      >
        {name}
      </span>
      <span
        className={`shrink-0 text-[12px] ${
          rank === 1 ? "font-semibold text-[#F59E0B]" : "text-gray-500 dark:text-neutral-400"
        }`}
      >
        {formatThousands(points)} điểm
      </span>
    </Link>
  );
}

export default function RankingCard({ topUsers, loading, currentUser }) {
  const top = Array.isArray(topUsers) ? topUsers.slice(0, 5) : [];
  const currentInTop = top.some((user) => user.username === currentUser?.username);

  return (
    <HomeCard className="p-5">
      <SectionHeader icon={Trophy} iconClassName="!text-[#F59E0B]" title="Bảng xếp hạng thành viên" />

      <div className="mt-3 space-y-0.5">
        {loading && top.length === 0
          ? [...Array(5)].map((_, index) => (
              <div key={index} className="flex animate-pulse items-center gap-2.5 px-2 py-2">
                <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-neutral-600" />
                <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-neutral-600" />
                <div className="h-3 flex-1 rounded bg-gray-200 dark:bg-neutral-600" />
              </div>
            ))
          : top.map((user, index) => (
              <RankRow
                key={user.uid}
                rank={index + 1}
                username={user.username}
                name={user.profile_name || user.username}
                avatar={user.oauth_profile_picture}
                points={user.total_points}
                highlight={user.username === currentUser?.username}
              />
            ))}

        {!loading && top.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-neutral-400">
            Chưa có dữ liệu xếp hạng
          </p>
        )}

        {currentUser?.username && currentUser.rank && !currentInTop && top.length > 0 && (
          <>
            <div className="mx-2 border-t border-dashed border-gray-200 pt-0.5 dark:border-neutral-600" />
            <RankRow
              rank={currentUser.rank}
              username={currentUser.username}
              name="Bạn"
              points={currentUser.total_points}
              highlight
            />
          </>
        )}
      </div>

      <Link
        href="/users/ranking"
        className="mt-3 block rounded-xl border border-gray-200 py-2 text-center text-sm font-medium text-primary-500 transition hover:bg-primary-50 dark:border-neutral-600 dark:text-[#6bcf60] dark:hover:bg-[#2b3a2a]"
      >
        Xem bảng xếp hạng
      </Link>
    </HomeCard>
  );
}
