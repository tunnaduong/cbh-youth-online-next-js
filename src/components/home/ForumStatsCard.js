"use client";

import Link from "next/link";
import { FileText, MessageSquare, Users } from "lucide-react";
import { HomeCard } from "./HomeCard";
import { formatThousands } from "./homeUtils";

function OnlineDot() {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center">
      <span className="absolute h-3 w-3 animate-ping rounded-full bg-primary-400 opacity-40" />
      <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
    </span>
  );
}

export default function ForumStatsCard({ stats }) {
  if (!stats) return null;

  const items = [
    { label: "Thành viên", value: stats.userCount, icon: <Users className="h-4 w-4" /> },
    { label: "Bài viết", value: stats.postCount, icon: <FileText className="h-4 w-4" /> },
    { label: "Bình luận", value: stats.commentCount, icon: <MessageSquare className="h-4 w-4" /> },
    { label: "Đang online", value: stats.visitors?.total, icon: <OnlineDot /> },
  ];

  const latestUser = stats.latestUser;

  return (
    <HomeCard className="p-5">
      <h2 className="text-[15px] font-semibold text-gray-900 dark:text-neutral-100">Thống kê diễn đàn</h2>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex gap-2.5">
            <span className="mt-0.5 text-gray-500 dark:text-neutral-400">{item.icon}</span>
            <div className="flex flex-col-reverse">
              <dt className="text-[12px] text-gray-500 dark:text-neutral-400">{item.label}</dt>
              <dd className="text-base font-bold leading-tight text-gray-900 dark:text-neutral-100">
                {formatThousands(item.value)}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {(latestUser || stats.record) && (
        <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-[12px] text-gray-500 dark:border-neutral-600 dark:text-neutral-400">
          {latestUser && (
            <p className="truncate">
              Thành viên mới:{" "}
              <Link
                href={`/${latestUser.username}`}
                className="font-semibold text-primary-500 hover:underline dark:text-[#6bcf60]"
              >
                {latestUser.profile?.profile_name || latestUser.username}
              </Link>
            </p>
          )}
          {stats.record?.max_online > 0 && (
            <p>
              Kỷ lục online:{" "}
              <span className="font-semibold text-gray-700 dark:text-neutral-200">
                {formatThousands(stats.record.max_online)}
              </span>{" "}
              người
            </p>
          )}
        </div>
      )}
    </HomeCard>
  );
}
