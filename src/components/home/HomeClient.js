"use client";

import { Suspense } from "react";
import ForumSection from "@/components/forum/ForumSection";
import ForumStats from "@/components/forum/ForumStats";
import TopPosts from "@/components/forum/TopPosts";
import SEOContent from "@/components/marketing/SEOContent";
import StoriesSection from "@/components/stories/StoriesSection";
import MobileButton from "@/components/home/MobileButton";
import PublicChat from "@/components/chat/PublicChat";
import { useCreatePost } from "@/contexts/CreatePostContext";

export default function HomeClient({
  initialHomeData,
  initialMainCategories,
  initialLatestPosts,
  initialStats,
}) {
  const { handleCreatePost } = useCreatePost();
  return (
    <div className="px-2.5">
      <div className="px-1 xl:min-h-screen pt-4 md:max-w-[775px] mx-auto space-y-6 mb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Diễn đàn
          </h1>
          <MobileButton handleCreatePost={handleCreatePost} />
        </div>

        <StoriesSection />
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
          }
        >
          <TopPosts initialLatestPosts={initialLatestPosts} />
        </Suspense>
        <PublicChat />
        <ForumSection initialMainCategories={initialMainCategories} />
        <ForumStats initialStats={initialStats} />
        <SEOContent />
      </div>
    </div>
  );
}
