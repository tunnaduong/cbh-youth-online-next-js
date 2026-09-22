"use client";

import { useCallback, useMemo, useState } from "react";
import { Clapperboard } from "lucide-react";
import SEOContent from "@/components/marketing/SEOContent";
import StoriesSection from "@/components/stories/StoriesSection";
import PublicChat from "@/components/chat/PublicChat";
import { useAuthContext, useTopUsersContext } from "@/contexts/Support";
import { useForumData } from "@/contexts/ForumDataContext";
import useCreatePostGate from "@/hooks/useCreatePostGate";
import CreatePostModal from "@/components/modals/CreatePostModal";
import HomeHero from "./HomeHero";
import TrendingTopics from "./TrendingTopics";
import FeaturedPosts from "./FeaturedPosts";
import LatestPosts from "./LatestPosts";
import ProfileCard from "./ProfileCard";
import RankingCard from "./RankingCard";
import NewsCard from "./NewsCard";
import ForumStatsCard from "./ForumStatsCard";
import CategoryGrid from "./CategoryGrid";
import CommunityBanner from "./CommunityBanner";
import { HomeCard, SectionHeader } from "./HomeCard";
import { pickFeaturedPosts } from "./homeUtils";

export default function HomeClient({
  initialMainCategories = [],
  initialStats = null,
  initialFeed,
  featuredPool = [],
}) {
  const { loggedIn, currentUser, authLoading } = useAuthContext();
  const { topUsers, loading: topUsersLoading } = useTopUsersContext();
  const { mainCategories: contextCategories, stats: contextStats } = useForumData();

  // Context data is only populated after a refresh (e.g. a new post was created).
  const mainCategories =
    contextCategories.length > 0 ? contextCategories : initialMainCategories;
  const stats = contextStats || initialStats;
  const featuredPosts = useMemo(() => pickFeaturedPosts(featuredPool), [featuredPool]);

  const [composerOpen, setComposerOpen] = useState(false);
  const handleCreatePost = useCreatePostGate(
    useCallback(() => setComposerOpen(true), [])
  );

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-4 px-3 pb-8 pt-4 sm:space-y-5 sm:px-4 xl:pl-1 xl:pr-6 xl:pt-6">
      <HomeHero
        currentUser={currentUser}
        authLoading={authLoading}
        onCreatePost={handleCreatePost}
      />

      <TrendingTopics categories={mainCategories} />

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <FeaturedPosts posts={featuredPosts} />

          <HomeCard className="p-4 sm:p-5">
            <SectionHeader icon={Clapperboard} title="Tin" />
            <StoriesSection />
          </HomeCard>

          <LatestPosts loggedIn={loggedIn} initialFeed={initialFeed} />

          <PublicChat />
        </div>

        <aside className="min-w-0 space-y-4 sm:space-y-5">
          <ProfileCard
            currentUser={currentUser}
            authLoading={authLoading}
            topUsers={topUsers}
          />
          <RankingCard
            topUsers={topUsers}
            loading={topUsersLoading}
            currentUser={currentUser}
          />
          {/* Follows the reader down the (much longer) post column. */}
          <div className="space-y-4 sm:space-y-5 lg:sticky lg:top-[88px]">
            <NewsCard />
            <ForumStatsCard stats={stats} />
          </div>
        </aside>
      </div>

      <CategoryGrid categories={mainCategories} />

      <CommunityBanner />

      <SEOContent className="rounded-2xl border border-[#EBEFEA] dark:border-neutral-600 sm:p-8" />

      <CreatePostModal open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
