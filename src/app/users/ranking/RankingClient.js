"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { message } from "antd";
import { Trophy } from "lucide-react";
import HomeLayout from "@/layouts/HomeLayout";
import { getTopUsers } from "@/app/Api";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";

const RANK_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-700"];

export default function RankingClient() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopUsers(50)
      .then((res) => setUsers(res?.data || res || []))
      .catch(() => message.error("Không thể tải bảng xếp hạng"))
      .finally(() => setLoading(false));
  }, []);

  const sidebarItems = EXPLORE_FEATURES.map((feature) => ({
    key: feature.key,
    href: feature.href,
    label: feature.title,
    Icon: feature.sidebarIcon,
    isExternal: false,
    onClick:
      feature.href === "#"
        ? (e) => {
            e.preventDefault();
            message.info("Chức năng đang phát triển");
          }
        : undefined,
  }));

  return (
    <HomeLayout
      activeNav="explore"
      activeBar="ranking"
      sidebarItems={sidebarItems}
      sidebarType="all"
      sidebarWidth="306px"
      showRightSidebar={false}
    >
      <div className="max-w-[700px] mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Xếp hạng thành viên
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Xếp hạng theo tổng điểm hoạt động trên diễn đàn.
        </p>

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">
            Đang tải...
          </p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">
            Chưa có dữ liệu xếp hạng.
          </p>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 divide-y divide-gray-100 dark:divide-neutral-700">
            {users.map((u, i) => (
              <Link
                href={`/${u.username}`}
                key={u.uid}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <span
                  className={`w-7 text-center text-base font-bold ${
                    RANK_COLORS[i] || "text-gray-400"
                  }`}
                >
                  {i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${u.username}/avatar`}
                  alt={u.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {u.profile_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{u.username}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#319527]">
                  {u.total_points} điểm
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
