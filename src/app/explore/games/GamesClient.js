"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "@bprogress/next/app";
import { message } from "antd";
import HomeLayout from "@/layouts/HomeLayout";
import { getGames, getRandomGame, getGameLeaderboard } from "@/app/Api";
import { Search, Dice5, TrendingUp, Sparkles, Trophy } from "lucide-react";
import { EXPLORE_FEATURES } from "@/data/exploreFeatures";

const CATEGORY_LABELS = {
  all: "Tất cả",
  arcade: "Arcade",
  puzzle: "Puzzle",
  racing: "Racing",
  adventure: "Adventure",
  shooting: "Shooting",
  other: "Khác",
};

function GameCard({ game, rank }) {
  return (
    <Link
      href={`/explore/games/${game.slug}`}
      className="flex-shrink-0 w-[190px] group"
    >
      <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-neutral-700">
        {rank != null && (
          <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-bold flex items-center justify-center">
            {rank}
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.image_url}
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="mt-2">
        <p className="font-semibold text-gray-900 dark:text-white truncate">
          {game.name}
        </p>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#E4EEE3] text-[#319527] dark:bg-[#1d2a1c] dark:text-[#6bcf60] mt-1">
          {CATEGORY_LABELS[game.category] || game.category}
        </span>
        {game.play_count != null && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {game.play_count.toLocaleString("vi-VN")} lượt chơi
          </p>
        )}
      </div>
    </Link>
  );
}

function SmallGameCard({ game }) {
  return (
    <Link
      href={`/explore/games/${game.slug}`}
      className="flex-shrink-0 w-[180px] group"
    >
      <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-neutral-700">
        {game.is_new && (
          <span className="absolute top-2 left-2 z-10 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#319527] text-white">
            MỚI
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.image_url}
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <p className="mt-2 font-semibold text-gray-900 dark:text-white truncate">
        {game.name}
      </p>
      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#E4EEE3] text-[#319527] dark:bg-[#1d2a1c] dark:text-[#6bcf60] mt-1">
        {CATEGORY_LABELS[game.category] || game.category}
      </span>
      <button className="mt-2 w-full text-sm font-medium text-white bg-[#319527] hover:bg-[#3dbb31] rounded-lg py-1.5 transition-colors">
        Chơi ngay
      </button>
    </Link>
  );
}

export default function GamesClient() {
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [mostPlayed, setMostPlayed] = useState([]);
  const [newest, setNewest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [rollingRandom, setRollingRandom] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  // Explore's own sidebar (Trang chủ/Chợ tài liệu/Game/...) instead of the
  // main forum sidebar, matching every other page nested under /explore.
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

  const load = async (params = "") => {
    setLoading(true);
    try {
      const res = await getGames(params);
      const data = res?.data || res;
      setGames(data.games || []);
      setMostPlayed(data.most_played || []);
      setNewest(data.newest || []);
      setCategories(["all", ...(data.categories || [])]);
    } catch (error) {
      message.error("Không thể tải danh sách game");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getGameLeaderboard("week")
      .then((res) => setLeaderboard((res?.data || res)?.leaderboard || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (activeCategory !== "all") params.set("category", activeCategory);
      load(params.toString());
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeCategory]);

  const handleRandom = async () => {
    setRollingRandom(true);
    try {
      const platform = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? "mobile"
        : "pc";
      const res = await getRandomGame(platform);
      const game = res?.data || res;
      router.push(`/explore/games/${game.slug}`);
    } catch (error) {
      message.error("Không tìm được game nào phù hợp");
    } finally {
      setRollingRandom(false);
    }
  };

  const filteredGames = useMemo(() => games, [games]);

  return (
    <HomeLayout
      activeNav="explore"
      activeBar="game"
      sidebarItems={sidebarItems}
      sidebarType="all"
      sidebarWidth="306px"
      showRightSidebar={false}
    >
      <div className="max-w-[1300px] mx-auto px-4 py-6 flex gap-6 overflow-x-hidden">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🎮 Game
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Chơi game trực tiếp trên web – Miễn phí, không cần tải về!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm game..."
                  className="pl-9 pr-3 py-2 rounded-full border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#319527] w-52"
                />
              </div>
              <button
                onClick={handleRandom}
                disabled={rollingRandom}
                className="flex items-center gap-1.5 bg-[#319527] hover:bg-[#3dbb31] disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
              >
                <Dice5 className="w-4 h-4" />
                Game ngẫu nhiên
              </button>
            </div>
          </div>

          {/* Most played */}
          {mostPlayed.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#319527]" />
                  Game được chơi nhiều nhất
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 pr-4 no-scrollbar w-full">
                {mostPlayed.map((g, i) => (
                  <GameCard key={g.id} game={g} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* Newest */}
          {newest.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#319527]" />
                  Game mới cập nhật
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 pr-4 no-scrollbar w-full">
                {newest.map((g) => (
                  <SmallGameCard key={g.id} game={g} />
                ))}
              </div>
            </section>
          )}

          {/* Category filter */}
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Game theo thể loại
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    activeCategory === cat
                      ? "bg-[#319527] text-white border-[#319527]"
                      : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-neutral-600 hover:border-[#319527]"
                  }`}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          {/* All games grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading ? (
              <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
                Đang tải...
              </p>
            ) : filteredGames.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
                Không tìm thấy game nào.
              </p>
            ) : (
              filteredGames.map((g) => <GameCard key={g.id} game={g} />)
            )}
          </div>
        </div>

        {/* Right column: leaderboard */}
        <div className="hidden xl:block w-[280px] flex-shrink-0">
          <div className="sticky top-[90px] bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Bảng xếp hạng
              </h3>
              <span className="text-xs text-gray-400">Tuần này</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Chưa có dữ liệu
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((u, i) => (
                  <Link
                    href={`/${u.username}`}
                    key={u.id}
                    className="flex items-center gap-2.5 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-lg p-1.5 -mx-1.5"
                  >
                    <span
                      className={`w-5 text-center text-sm font-bold ${
                        i === 0
                          ? "text-yellow-500"
                          : i === 1
                          ? "text-gray-400"
                          : i === 2
                          ? "text-amber-700"
                          : "text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.avatar_url}
                      alt={u.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                      {u.profile_name}
                    </span>
                    <span className="text-xs font-semibold text-[#319527]">
                      {u.xp} XP
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
